-- ============================================================================
-- MIGRAÇÃO COMPLETA AUTOTRACK - LOVABLE CLOUD → SUPABASE
-- ============================================================================
-- Este arquivo consolida todas as migrations do projeto AutoTrack
-- Execute este SQL no SQL Editor do seu novo projeto Supabase
--
-- IMPORTANTE: Execute todo o conteúdo de uma vez só!
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Create profiles table (20251027195731)
-- ============================================================================

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- MIGRATION 2: Fix search_path for handle_updated_at (20251027195837)
-- ============================================================================

-- Fix search_path for handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- MIGRATION 3: Add vehicles and maintenances tables (20251028114243)
-- ============================================================================

-- Add phone and city to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS city text;

-- Create vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  version text,
  year integer NOT NULL,
  plate text NOT NULL,
  current_km integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'up-to-date' CHECK (status IN ('up-to-date', 'due-soon', 'overdue')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, plate)
);

-- Create maintenances table
CREATE TABLE IF NOT EXISTS public.maintenances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  service_type text NOT NULL,
  km integer NOT NULL,
  cost numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  attachment_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on maintenances
ALTER TABLE public.maintenances ENABLE ROW LEVEL SECURITY;

-- RLS policies for vehicles
CREATE POLICY "Users can view their own vehicles"
  ON public.vehicles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicles"
  ON public.vehicles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicles"
  ON public.vehicles FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for maintenances
CREATE POLICY "Users can view their own maintenances"
  ON public.maintenances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own maintenances"
  ON public.maintenances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own maintenances"
  ON public.maintenances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own maintenances"
  ON public.maintenances FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenances_vehicle_id ON public.maintenances(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenances_user_id ON public.maintenances(user_id);

-- Trigger to update updated_at on vehicles
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to update updated_at on maintenances
CREATE TRIGGER update_maintenances_updated_at
  BEFORE UPDATE ON public.maintenances
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- MIGRATION 4: Update handle_new_user for phone and city (20251029105948)
-- ============================================================================

-- Update handle_new_user function to include phone and city
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, phone, city)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'city'
  );
  RETURN new;
END;
$function$;

-- ============================================================================
-- MIGRATION 5: Create storage bucket (20251103195024)
-- ============================================================================

-- Create storage bucket for maintenance attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'maintenance-attachments',
  'maintenance-attachments',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for maintenance-attachments bucket
CREATE POLICY "Users can view their own attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'maintenance-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload their own attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'maintenance-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'maintenance-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'maintenance-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- MIGRATION 6: Add new profile fields (20251107165952)
-- ============================================================================

-- Add new profile fields for better user profiling
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('masculino', 'feminino')),
ADD COLUMN IF NOT EXISTS cnh_number text,
ADD COLUMN IF NOT EXISTS preferred_contact text CHECK (preferred_contact IN ('email', 'phone', 'whatsapp')) DEFAULT 'email';

-- ============================================================================
-- MIGRATION 7: Update profile fields (20251107171228)
-- ============================================================================

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

-- ============================================================================
-- MIGRATION 8: Add subscription system (20251110143048)
-- ============================================================================

-- Create subscription plans enum
CREATE TYPE public.subscription_plan AS ENUM ('free_trial', 'pro_monthly', 'pro_yearly');

CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled');

-- Add subscription fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_plan subscription_plan DEFAULT 'free_trial',
ADD COLUMN IF NOT EXISTS subscription_status subscription_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days'),
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_cta_shown_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cta_dismiss_count INTEGER DEFAULT 0;

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

-- ============================================================================
-- MIGRATION 9: Update handle_new_user for state/municipality (20251111164028)
-- ============================================================================

-- Update handle_new_user function to use state and municipality instead of city
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, phone, state, municipality)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'municipality'
  );
  RETURN new;
END;
$function$;

-- ============================================================================
-- MIGRATION 10: Update storage policies (20251114112030)
-- ============================================================================

-- Criar políticas RLS para o bucket maintenance-attachments
-- Permitir que usuários façam upload de seus próprios arquivos
CREATE POLICY "Users can upload their own maintenance attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'maintenance-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários visualizem seus próprios arquivos
CREATE POLICY "Users can view their own maintenance attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'maintenance-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários atualizem seus próprios arquivos
CREATE POLICY "Users can update their own maintenance attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'maintenance-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários deletem seus próprios arquivos
CREATE POLICY "Users can delete their own maintenance attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'maintenance-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- MIGRATION 11: Add admin flag (20251114200000)
-- ============================================================================

-- Add is_admin column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- Comment on the column
COMMENT ON COLUMN public.profiles.is_admin IS 'Flag to identify admin users who can bypass subscription restrictions';

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================
-- Todas as migrations foram aplicadas com sucesso!
-- Próximo passo: Configurar as Edge Functions
-- ============================================================================
