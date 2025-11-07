-- Add new profile fields for better user profiling
ALTER TABLE public.profiles
ADD COLUMN date_of_birth date,
ADD COLUMN gender text CHECK (gender IN ('masculino', 'feminino')),
ADD COLUMN cnh_number text,
ADD COLUMN preferred_contact text CHECK (preferred_contact IN ('email', 'phone', 'whatsapp')) DEFAULT 'email';