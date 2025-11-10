-- Create subscription plans enum
CREATE TYPE public.subscription_plan AS ENUM ('free_trial', 'pro_monthly', 'pro_yearly');

CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled');

-- Add subscription fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN subscription_plan subscription_plan DEFAULT 'free_trial',
ADD COLUMN subscription_status subscription_status DEFAULT 'active',
ADD COLUMN trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days'),
ADD COLUMN subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_cta_shown_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN cta_dismiss_count INTEGER DEFAULT 0;

-- Create function to check if user is on valid trial
CREATE OR REPLACE FUNCTION public.is_trial_active(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
    AND subscription_plan = 'free_trial'
    AND subscription_status = 'active'
    AND trial_ends_at > NOW()
  );
$$;

-- Create function to check if user has pro plan
CREATE OR REPLACE FUNCTION public.has_pro_plan(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
    AND subscription_plan IN ('pro_monthly', 'pro_yearly')
    AND subscription_status = 'active'
    AND (subscription_ends_at IS NULL OR subscription_ends_at > NOW())
  );
$$;

-- Create function to get trial days remaining
CREATE OR REPLACE FUNCTION public.get_trial_days_remaining(user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(0, EXTRACT(DAY FROM (trial_ends_at - NOW()))::INTEGER)
  FROM public.profiles
  WHERE id = user_id;
$$;