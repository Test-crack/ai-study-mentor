// supabase/functions/create-payment-session/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Razorpay from 'https://esm.sh/razorpay@2.9.2';
import Stripe from 'https://esm.sh/stripe@13.10.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { plan_id, amount, currency, provider } = await req.json();

    let paymentSession;

    if (provider === 'razorpay') {
      // Initialize Razorpay
      const razorpay = new Razorpay({
        key_id: Deno.env.get('RAZORPAY_KEY_ID') ?? '',
        key_secret: Deno.env.get('RAZORPAY_KEY_SECRET') ?? '',
      });

      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: amount, // amount in paise
        currency: currency,
        receipt: `order_${Date.now()}`,
        notes: {
          user_id: user.id,
          plan_id: plan_id,
        },
      });

      paymentSession = {
        id: order.id,
        provider: 'razorpay',
        amount: order.amount,
        currency: order.currency,
        status: 'created',
      };

      // Store order in database
      const { error: dbError } = await supabaseClient
        .from('payment_sessions')
        .insert({
          id: order.id,
          user_id: user.id,
          plan_id: plan_id,
          provider: 'razorpay',
          amount: order.amount,
          currency: order.currency,
          status: 'pending',
          metadata: order,
        });

      if (dbError) throw dbError;

    } else if (provider === 'stripe') {
      // Initialize Stripe
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
        apiVersion: '2023-10-16',
      });

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: `AI Study Mentor - ${plan_id}`,
                description: 'AI-powered learning platform subscription',
              },
              unit_amount: amount,
              recurring: {
                interval: plan_id.includes('yearly') ? 'year' : 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.get('origin')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get('origin')}/pricing`,
        customer_email: user.email,
        metadata: {
          user_id: user.id,
          plan_id: plan_id,
        },
      });

      paymentSession = {
        id: session.id,
        provider: 'stripe',
        amount: amount,
        currency: currency,
        status: 'created',
        url: session.url,
      };

      // Store session in database
      const { error: dbError } = await supabaseClient
        .from('payment_sessions')
        .insert({
          id: session.id,
          user_id: user.id,
          plan_id: plan_id,
          provider: 'stripe',
          amount: amount,
          currency: currency,
          status: 'pending',
          metadata: session,
        });

      if (dbError) throw dbError;
    }

    return new Response(
      JSON.stringify(paymentSession),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
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