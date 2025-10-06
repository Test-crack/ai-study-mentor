// supabase/functions/handle-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.10.0';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const signature = req.headers.get('stripe-signature') || req.headers.get('x-razorpay-signature');
  const provider = req.headers.get('stripe-signature') ? 'stripe' : 'razorpay';

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.text();
    let event: any;

    if (provider === 'stripe') {
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
        apiVersion: '2023-10-16',
      });

      event = stripe.webhooks.constructEvent(
        body,
        signature!,
        Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
      );

      // Handle Stripe events
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          
          // Update subscription in database
          const { error } = await supabaseClient
            .from('subscriptions')
            .upsert({
              user_id: session.metadata.user_id,
              stripe_subscription_id: session.subscription,
              stripe_customer_id: session.customer,
              plan_id: session.metadata.plan_id,
              status: 'active',
              billing_period: session.metadata.plan_id.includes('yearly') ? 'yearly' : 'monthly',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            });

          if (error) throw error;

          // Update user profile
          await supabaseClient
            .from('user_profiles')
            .update({
              subscription_plan: session.metadata.plan_id.includes('premium') ? 'premium' : 'pro',
              subscription_status: 'active',
              stripe_customer_id: session.customer,
            })
            .eq('user_id', session.metadata.user_id);

          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          
          await supabaseClient
            .from('subscriptions')
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);

          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          
          await supabaseClient
            .from('subscriptions')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);

          // Update user profile
          const { data: sub } = await supabaseClient
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .single();

          if (sub) {
            await supabaseClient
              .from('user_profiles')
              .update({
                subscription_plan: 'free',
                subscription_status: 'inactive',
              })
              .eq('user_id', sub.user_id);
          }

          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          
          // Send notification to user
          const { data: sub } = await supabaseClient
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', invoice.customer)
            .single();

          if (sub) {
            await supabaseClient
              .from('notifications')
              .insert({
                user_id: sub.user_id,
                type: 'subscription',
                title: 'Payment Failed',
                message: 'Your subscription payment failed. Please update your payment method.',
                data: { invoice_id: invoice.id },
              });
          }

          break;
        }
      }
    } else if (provider === 'razorpay') {
      // Verify Razorpay webhook signature
      const expectedSignature = createHmac(
        'sha256',
        Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? ''
      )
        .update(body)
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new Error('Invalid webhook signature');
      }

      event = JSON.parse(body);

      // Handle Razorpay events
      switch (event.event) {
        case 'payment.captured': {
          const payment = event.payload.payment.entity;
          
          // Update payment record
          await supabaseClient
            .from('payment_sessions')
            .update({
              status: 'completed',
              payment_id: payment.id,
            })
            .eq('id', payment.order_id);

          break;
        }

        case 'payment.failed': {
          const payment = event.payload.payment.entity;
          
          await supabaseClient
            .from('payment_sessions')
            .update({
              status: 'failed',
              error_description: payment.error_description,
            })
            .eq('id', payment.order_id);

          // Notify user
          if (payment.notes && payment.notes.user_id) {
            await supabaseClient
              .from('notifications')
              .insert({
                user_id: payment.notes.user_id,
                type: 'subscription',
                title: 'Payment Failed',
                message: payment.error_description || 'Your payment could not be processed.',
                data: { payment_id: payment.id },
              });
          }

          break;
        }

        case 'subscription.activated': {
          const subscription = event.payload.subscription.entity;
          
          await supabaseClient
            .from('subscriptions')
            .upsert({
              user_id: subscription.notes.user_id,
              stripe_subscription_id: subscription.id, // Using stripe fields for consistency
              status: 'active',
              current_period_start: new Date(subscription.current_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_end * 1000).toISOString(),
            });

          break;
        }

        case 'subscription.cancelled': {
          const subscription = event.payload.subscription.entity;
          
          await supabaseClient
            .from('subscriptions')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);

          break;
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});