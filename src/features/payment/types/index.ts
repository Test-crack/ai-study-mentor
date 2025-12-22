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

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  billing_period: 'monthly' | 'yearly';
}
