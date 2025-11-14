-- Add is_admin column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- Comment on the column
COMMENT ON COLUMN public.profiles.is_admin IS 'Flag to identify admin users who can bypass subscription restrictions';
