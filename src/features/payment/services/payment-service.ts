// lib/payment/payment-service.ts
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';

// Types
export interface PaymentPlan {
  id: string;
  name: string;
  price_inr: number;
  price_usd: number;
  period: 'monthly' | 'yearly';
  features: string[];
  credits: number;
  popular?: boolean;
}

export interface PaymentSession {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  provider: 'razorpay' | 'stripe';
  metadata?: Record<string, any>;
}

// Pricing Configuration
export const PRICING_PLANS: Record<string, PaymentPlan> = {
  pro_monthly: {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    price_inr: 499,
    price_usd: 9.99,
    period: 'monthly',
    credits: 100,
    features: [
      '✅ Unlimited AI Notes Upload',
      '🎥 Advanced YouTube Learning',
      '🔄 KTMG with Callbacks',
      '📝 AI Quiz Generation',
      '📊 Study Analytics Dashboard',
      '⚡ Priority Support'
    ]
  },
  pro_yearly: {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    price_inr: 4999, // 2 months free
    price_usd: 99.99,
    period: 'yearly',
    credits: 1200,
    popular: true,
    features: [
      '✅ Everything in Pro Monthly',
      '💰 Save ₹999 (2 months free)',
      '🎁 Bonus 200 credits',
      '📈 Annual progress report'
    ]
  },
  premium_monthly: {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    price_inr: 999,
    price_usd: 19.99,
    period: 'monthly',
    credits: -1, // Unlimited
    features: [
      '♾️ Unlimited Everything',
      '🤖 Personal AI Tutor',
      '📚 Custom Study Plans',
      '💼 Interview Prep Mode',
      '🎯 1-on-1 Expert Support',
      '🔌 API Access',
      '🏆 Certification Prep'
    ]
  }
};

// Razorpay Integration
declare global {
  interface Window {
    Razorpay: any;
  }
}

export class RazorpayService {
  private keyId: string;

  constructor() {
    this.keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
  }

  async loadScript(): Promise<boolean> {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async createOrder(planId: string, userId: string) {
    const plan = PRICING_PLANS[planId];
    
    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-payment-session', {
      body: {
        plan_id: planId,
        amount: plan.price_inr * 100, // Convert to paise
        currency: 'INR',
        provider: 'razorpay',
        user_id: userId
      }
    });

    if (error) throw error;
    return data;
  }

  async openCheckout(orderId: string, plan: PaymentPlan, userEmail: string) {
    const loaded = await this.loadScript();
    if (!loaded) throw new Error('Razorpay SDK failed to load');

    const options = {
      key: this.keyId,
      amount: plan.price_inr * 100,
      currency: 'INR',
      order_id: orderId,
      name: 'AI Study Mentor',
      description: `${plan.name} Subscription`,
      image: '/logo.png',
      prefill: {
        email: userEmail,
      },
      theme: {
        color: '#6366f1'
      },
      handler: async (response: any) => {
        // Verify payment on backend
        await this.verifyPayment(response);
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  }

  async verifyPayment(paymentData: any) {
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: {
        provider: 'razorpay',
        payment_id: paymentData.razorpay_payment_id,
        order_id: paymentData.razorpay_order_id,
        signature: paymentData.razorpay_signature
      }
    });

    if (error) throw error;
    return data;
  }
}

// Stripe Integration (Fallback for International)
export class StripeService {
  private stripePromise: Promise<any>;

  constructor() {
    this.stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');
  }

  async createCheckoutSession(planId: string, userId: string) {
    const plan = PRICING_PLANS[planId];
    
    const { data, error } = await supabase.functions.invoke('create-payment-session', {
      body: {
        plan_id: planId,
        amount: plan.price_usd * 100, // Convert to cents
        currency: 'USD',
        provider: 'stripe',
        user_id: userId
      }
    });

    if (error) throw error;
    return data;
  }

  async redirectToCheckout(sessionId: string) {
    const stripe = await this.stripePromise;
    const { error } = await stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      console.error('Stripe checkout error:', error);
      throw error;
    }
  }
}

// Unified Payment Service
export class PaymentService {
  private razorpay: RazorpayService;
  private stripe: StripeService;

  constructor() {
    this.razorpay = new RazorpayService();
    this.stripe = new StripeService();
  }

  async initializePayment(planId: string, userId: string, userEmail: string, region: string = 'IN') {
    try {
      if (region === 'IN') {
        // Use Razorpay for Indian users
        const order = await this.razorpay.createOrder(planId, userId);
        await this.razorpay.openCheckout(order.id, PRICING_PLANS[planId], userEmail);
      } else {
        // Use Stripe for international users
        const session = await this.stripe.createCheckoutSession(planId, userId);
        await this.stripe.redirectToCheckout(session.id);
      }
    } catch (error) {
      console.error('Payment initialization failed:', error);
      throw error;
    }
  }

  async checkSubscriptionStatus(userId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    return { isActive: !!data, subscription: data, error };
  }

  async cancelSubscription(subscriptionId: string) {
    const { data, error } = await supabase.functions.invoke('cancel-subscription', {
      body: { subscription_id: subscriptionId }
    });

    if (error) throw error;
    return data;
  }

  async getPaymentHistory(userId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}