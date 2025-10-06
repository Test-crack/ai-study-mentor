// supabase/functions/verify-payment/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { provider, payment_id, order_id, signature } = await req.json();

    if (provider === 'razorpay') {
      // Verify Razorpay signature
      const secret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';
      const body = order_id + '|' + payment_id;
      
      const expectedSignature = createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new Error('Invalid payment signature');
      }

      // Get payment session from database
      const { data: session, error: sessionError } = await supabaseClient
        .from('payment_sessions')
        .select('*')
        .eq('id', order_id)
        .single();

      if (sessionError || !session) {
        throw new Error('Payment session not found');
      }

      // Update payment session status
      const { error: updateError } = await supabaseClient
        .from('payment_sessions')
        .update({
          status: 'completed',
          payment_id: payment_id,
          completed_at: new Date().toISOString(),
        })
        .eq('id', order_id);

      if (updateError) throw updateError;

      // Get or create subscription
      const { data: existingSub } = await supabaseClient
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const subscriptionData = {
        user_id: user.id,
        plan_id: session.plan_id,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(
          Date.now() + (session.plan_id.includes('yearly') ? 365 : 30) * 24 * 60 * 60 * 1000
        ).toISOString(),
        stripe_subscription_id: `rzp_${order_id}`,
        stripe_customer_id: `rzp_${user.id}`,
        billing_period: session.plan_id.includes('yearly') ? 'yearly' : 'monthly',
      };

      if (existingSub) {
        const { error: subError } = await supabaseClient
          .from('subscriptions')
          .update(subscriptionData)
          .eq('user_id', user.id);
        if (subError) throw subError;
      } else {
        const { error: subError } = await supabaseClient
          .from('subscriptions')
          .insert(subscriptionData);
        if (subError) throw subError;
      }

      // Update user profile
      const { error: profileError } = await supabaseClient
        .from('user_profiles')
        .update({
          subscription_plan: session.plan_id.includes('premium') ? 'premium' : 'pro',
          subscription_status: 'active',
          credits: session.plan_id.includes('premium') ? -1 : 
                  session.plan_id.includes('yearly') ? 1200 : 100,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Create notification
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'subscription',
          title: 'Payment Successful!',
          message: `Your ${session.plan_id} subscription is now active. Welcome to AI Study Mentor Pro!`,
          data: { plan_id: session.plan_id, payment_id },
        });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment verified and subscription activated',
          subscription: subscriptionData,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Handle Stripe verification (webhook-based, usually)
    if (provider === 'stripe') {
      // Stripe verification is typically handled via webhooks
      // This is a placeholder for manual verification if needed
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Stripe payment verification pending webhook',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    throw new Error('Invalid payment provider');
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});