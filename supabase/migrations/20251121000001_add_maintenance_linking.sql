-- ============================================
-- Migration: Auto-link maintenances to users
-- When workshop creates maintenance for client,
-- automatically link when client creates account
-- ============================================

-- 1. Add metadata column to maintenances for pending user info
ALTER TABLE public.maintenances
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.maintenances.metadata IS 'Additional data like pending_user_email, pending_user_phone for linking';

-- 2. Create index for metadata searches
CREATE INDEX IF NOT EXISTS idx_maintenances_metadata_email
  ON public.maintenances ((metadata->>'pending_user_email'))
  WHERE metadata->>'pending_user_email' IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_maintenances_metadata_phone
  ON public.maintenances ((metadata->>'pending_user_phone'))
  WHERE metadata->>'pending_user_phone' IS NOT NULL;

-- 3. Function to link pending maintenances when user creates account
CREATE OR REPLACE FUNCTION public.link_pending_maintenances()
RETURNS TRIGGER AS $$
DECLARE
  linked_count integer := 0;
BEGIN
  -- First, link vehicles that have pending maintenances for this user
  WITH pending_vehicles AS (
    SELECT DISTINCT v.id as vehicle_id
    FROM public.vehicles v
    JOIN public.maintenances m ON v.id = m.vehicle_id
    WHERE v.user_id IS NULL
      AND (
        (NEW.email IS NOT NULL AND m.metadata->>'pending_user_email' = NEW.email)
        OR (NEW.phone IS NOT NULL AND m.metadata->>'pending_user_phone' = NEW.phone)
      )
  )
  UPDATE public.vehicles
  SET user_id = NEW.id
  WHERE id IN (SELECT vehicle_id FROM pending_vehicles);

  -- Then, link maintenances and clean up metadata
  WITH updated AS (
    UPDATE public.maintenances
    SET
      user_id = NEW.id,
      metadata = metadata - 'pending_user_email' - 'pending_user_phone' - 'pending_user_name'
    WHERE user_id IS NULL
      AND (
        (NEW.email IS NOT NULL AND metadata->>'pending_user_email' = NEW.email)
        OR (NEW.phone IS NOT NULL AND metadata->>'pending_user_phone' = NEW.phone)
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO linked_count FROM updated;

  -- Log the linking (optional, for debugging)
  IF linked_count > 0 THEN
    RAISE NOTICE 'Linked % maintenances to user %', linked_count, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.link_pending_maintenances IS 'Automatically links pending maintenances to users when they create an account';

-- 4. Create trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_created_link_maintenances ON public.profiles;

CREATE TRIGGER on_profile_created_link_maintenances
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.link_pending_maintenances();

-- 5. Also handle profile updates (in case email/phone is updated)
DROP TRIGGER IF EXISTS on_profile_updated_link_maintenances ON public.profiles;

CREATE TRIGGER on_profile_updated_link_maintenances
  AFTER UPDATE OF email, phone ON public.profiles
  FOR EACH ROW
  WHEN (NEW.email IS DISTINCT FROM OLD.email OR NEW.phone IS DISTINCT FROM OLD.phone)
  EXECUTE FUNCTION public.link_pending_maintenances();

-- 6. Add phone column to profiles if it doesn't exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text;

CREATE INDEX IF NOT EXISTS idx_profiles_phone
  ON public.profiles (phone)
  WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON public.profiles (email)
  WHERE email IS NOT NULL;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION public.link_pending_maintenances TO authenticated;

-- ============================================
-- Migration complete!
--
-- Manual step: Ensure the profiles table captures
-- email and phone during signup flow.
-- ============================================
