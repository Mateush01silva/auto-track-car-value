-- Add Stripe-related fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON public.profiles(stripe_subscription_id);

-- Update subscription_status enum to include new statuses
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'canceled';
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'past_due';

-- Rename subscription_ends_at to subscription_end for consistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'subscription_ends_at'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'subscription_end'
  ) THEN
    ALTER TABLE public.profiles
    RENAME COLUMN subscription_ends_at TO subscription_end;
  END IF;
END $$;

-- Rename trial_ends_at to trial_end for consistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'trial_ends_at'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'trial_end'
  ) THEN
    ALTER TABLE public.profiles
    RENAME COLUMN trial_ends_at TO trial_end;
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer ID for this user';
COMMENT ON COLUMN public.profiles.stripe_subscription_id IS 'Stripe subscription ID for active subscription';
COMMENT ON COLUMN public.profiles.subscription_end IS 'When the current subscription period ends';
COMMENT ON COLUMN public.profiles.trial_end IS 'When the trial period ends';
