-- supabase/migrations/20240115_payment_tables.sql

-- Create payment_sessions table for tracking payment attempts
CREATE TABLE IF NOT EXISTS public.payment_sessions (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  plan_id text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('razorpay', 'stripe')),
  amount integer NOT NULL,
  currency text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_id text,
  error_description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create payments history table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  subscription_id uuid REFERENCES public.subscriptions(id),
  amount integer NOT NULL,
  currency text NOT NULL,
  provider text NOT NULL,
  status text NOT NULL,
  payment_method text,
  invoice_url text,
  receipt_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX idx_payment_sessions_user_id ON public.payment_sessions(user_id);
CREATE INDEX idx_payment_sessions_status ON public.payment_sessions(status);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_subscription_id ON public.payments(subscription_id);

-- Create RLS policies
ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can only view their own payment sessions
CREATE POLICY "Users can view own payment sessions" ON public.payment_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only view their own payment history
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- Create function to automatically update subscription credits
CREATE OR REPLACE FUNCTION update_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    -- Update user credits based on plan
    UPDATE public.user_profiles
    SET credits = CASE
      WHEN NEW.plan_id LIKE '%premium%' THEN -1  -- Unlimited
      WHEN NEW.plan_id LIKE '%yearly%' THEN 1200
      ELSE 100
    END,
    updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic credit updates
CREATE TRIGGER update_credits_on_subscription
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_credits();

-- Create function to check subscription expiry
CREATE OR REPLACE FUNCTION check_subscription_expiry()
RETURNS void AS $$
BEGIN
  -- Mark expired subscriptions
  UPDATE public.subscriptions
  SET status = 'expired'
  WHERE status = 'active'
    AND current_period_end < now();

  -- Update user profiles for expired subscriptions
  UPDATE public.user_profiles p
  SET subscription_status = 'inactive',
      subscription_plan = 'free',
      credits = 10
  FROM public.subscriptions s
  WHERE p.user_id = s.user_id
    AND s.status = 'expired';
END;
$$ LANGUAGE plpgsql;

-- Schedule subscription expiry check (run daily)
-- Note: You'll need to set up a cron job in Supabase dashboard
-- SELECT cron.schedule('check-subscription-expiry', '0 0 * * *', 'SELECT check_subscription_expiry();');