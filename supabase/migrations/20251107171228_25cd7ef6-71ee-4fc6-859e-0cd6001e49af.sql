-- Remove CNH field and add new profile fields
ALTER TABLE public.profiles DROP COLUMN IF EXISTS cnh_number;

-- Add location fields (state and municipality instead of generic city)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.profiles RENAME COLUMN city TO municipality;

-- Add demographic and usage profile fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS average_monthly_km integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vehicles_count integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vehicle_usage_type text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mechanical_knowledge text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS maintenance_frequency text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS income_range text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profession text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS residence_type text;