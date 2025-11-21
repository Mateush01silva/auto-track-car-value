-- ============================================
-- WiseDrive - Oficinas (Workshops)
-- Migration to add support for mechanical workshops
-- ============================================

-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CREATE WORKSHOPS TABLE
-- ============================================
CREATE TABLE public.workshops (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  cnpj text UNIQUE,
  phone text,
  email text,
  address text,
  city text,
  state text,
  logo_url text,
  plan text NOT NULL DEFAULT 'starter',
  subscription_status text NOT NULL DEFAULT 'trial',
  trial_ends_at timestamptz DEFAULT (now() + interval '30 days'),
  stripe_customer_id text,
  monthly_vehicle_limit integer NOT NULL DEFAULT 150,
  current_month_vehicles integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,

  -- Add constraints for plan and subscription_status
  CONSTRAINT valid_plan CHECK (plan IN ('starter', 'professional', 'enterprise')),
  CONSTRAINT valid_subscription_status CHECK (subscription_status IN ('trial', 'active', 'cancelled'))
);

-- Add comment to table
COMMENT ON TABLE public.workshops IS 'Mechanical workshops that can register maintenances for clients';

-- ============================================
-- 2. CREATE WORKSHOP_SERVICE_TEMPLATES TABLE
-- ============================================
CREATE TABLE public.workshop_service_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_price decimal(10,2),
  is_active boolean NOT NULL DEFAULT true
);

-- Add comment to table
COMMENT ON TABLE public.workshop_service_templates IS 'Service templates for workshops to quickly add common services';
COMMENT ON COLUMN public.workshop_service_templates.items IS 'Array of {name: string, price: number} objects';

-- ============================================
-- 3. CREATE WORKSHOP_MAINTENANCES TABLE (Join Table)
-- ============================================
CREATE TABLE public.workshop_maintenances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  maintenance_id uuid NOT NULL REFERENCES public.maintenances(id) ON DELETE CASCADE,
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Ensure unique combination
  UNIQUE(maintenance_id, workshop_id)
);

-- Add comment to table
COMMENT ON TABLE public.workshop_maintenances IS 'Join table linking maintenances to the workshops that created them';

-- ============================================
-- 4. MODIFY MAINTENANCES TABLE - Add new columns
-- ============================================
ALTER TABLE public.maintenances
  ADD COLUMN IF NOT EXISTS created_by_workshop_id uuid REFERENCES public.workshops(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_token text UNIQUE;

-- Add comments to new columns
COMMENT ON COLUMN public.maintenances.created_by_workshop_id IS 'Workshop that created this maintenance (if applicable)';
COMMENT ON COLUMN public.maintenances.is_public IS 'Whether this maintenance is publicly accessible';
COMMENT ON COLUMN public.maintenances.public_token IS 'Unique token for public access without login';

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_service_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_maintenances ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES FOR WORKSHOPS
-- ============================================

-- SELECT: Owner can view their workshops
CREATE POLICY "Workshop owners can view their workshops"
  ON public.workshops FOR SELECT
  USING (auth.uid() = owner_id);

-- SELECT: Allow viewing workshops for public joins (service accounts and reports)
CREATE POLICY "Anyone can view workshops for public data"
  ON public.workshops FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- INSERT: Authenticated users can create workshops
CREATE POLICY "Authenticated users can create workshops"
  ON public.workshops FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- UPDATE: Only owner can update
CREATE POLICY "Workshop owners can update their workshops"
  ON public.workshops FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- DELETE: Only owner can delete
CREATE POLICY "Workshop owners can delete their workshops"
  ON public.workshops FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- ============================================
-- 7. RLS POLICIES FOR WORKSHOP_SERVICE_TEMPLATES
-- ============================================

-- SELECT: Workshop owner can view templates
CREATE POLICY "Workshop owners can view their service templates"
  ON public.workshop_service_templates FOR SELECT
  TO authenticated
  USING (
    workshop_id IN (
      SELECT id FROM public.workshops WHERE owner_id = auth.uid()
    )
  );

-- INSERT: Workshop owner can create templates
CREATE POLICY "Workshop owners can create service templates"
  ON public.workshop_service_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    workshop_id IN (
      SELECT id FROM public.workshops WHERE owner_id = auth.uid()
    )
  );

-- UPDATE: Workshop owner can update templates
CREATE POLICY "Workshop owners can update service templates"
  ON public.workshop_service_templates FOR UPDATE
  TO authenticated
  USING (
    workshop_id IN (
      SELECT id FROM public.workshops WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    workshop_id IN (
      SELECT id FROM public.workshops WHERE owner_id = auth.uid()
    )
  );

-- DELETE: Workshop owner can delete templates
CREATE POLICY "Workshop owners can delete service templates"
  ON public.workshop_service_templates FOR DELETE
  TO authenticated
  USING (
    workshop_id IN (
      SELECT id FROM public.workshops WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- 8. RLS POLICIES FOR WORKSHOP_MAINTENANCES
-- ============================================

-- SELECT: Always allowed (for joins)
CREATE POLICY "Anyone can view workshop_maintenances"
  ON public.workshop_maintenances FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT: Workshop owner can create
CREATE POLICY "Workshop owners can create workshop_maintenances"
  ON public.workshop_maintenances FOR INSERT
  TO authenticated
  WITH CHECK (
    workshop_id IN (
      SELECT id FROM public.workshops WHERE owner_id = auth.uid()
    )
  );

-- DELETE: Workshop owner can delete
CREATE POLICY "Workshop owners can delete workshop_maintenances"
  ON public.workshop_maintenances FOR DELETE
  TO authenticated
  USING (
    workshop_id IN (
      SELECT id FROM public.workshops WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- 9. UPDATE RLS POLICIES FOR MAINTENANCES
-- Note: We need to drop existing restrictive policies and create new ones
-- ============================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own maintenances" ON public.maintenances;
DROP POLICY IF EXISTS "Users can insert their own maintenances" ON public.maintenances;
DROP POLICY IF EXISTS "Users can update their own maintenances" ON public.maintenances;
DROP POLICY IF EXISTS "Users can delete their own maintenances" ON public.maintenances;

-- SELECT: User owns it, or it's public, or workshop owner created it
CREATE POLICY "Users can view maintenances"
  ON public.maintenances FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_public = true
    OR created_by_workshop_id IN (
      SELECT id FROM public.workshops WHERE owner_id = auth.uid()
    )
  );

-- INSERT: User creating for themselves or workshop creating for client
CREATE POLICY "Users and workshops can create maintenances"
  ON public.maintenances FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR created_by_workshop_id IN (
      SELECT id FROM public.workshops WHERE owner_id = auth.uid()
    )
  );

-- UPDATE: User owns it or workshop created it
CREATE POLICY "Users and workshops can update maintenances"
  ON public.maintenances FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR created_by_workshop_id IN (
      SELECT id FROM public.workshops WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR created_by_workshop_id IN (
      SELECT id FROM public.workshops WHERE owner_id = auth.uid()
    )
  );

-- DELETE: User owns it or workshop created it
CREATE POLICY "Users and workshops can delete maintenances"
  ON public.maintenances FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR created_by_workshop_id IN (
      SELECT id FROM public.workshops WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- 10. TRIGGERS
-- ============================================

-- Trigger to update updated_at on workshops
CREATE TRIGGER on_workshop_updated
  BEFORE UPDATE ON public.workshops
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to reset monthly vehicle count
CREATE OR REPLACE FUNCTION public.reset_monthly_vehicle_count()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.workshops
  SET current_month_vehicles = 0
  WHERE current_month_vehicles > 0;
END;
$$;

-- Note: For automatic monthly reset, you should create a cron job in Supabase
-- Go to Database > Extensions > Enable pg_cron
-- Then create: SELECT cron.schedule('reset-workshop-monthly-count', '0 0 1 * *', 'SELECT public.reset_monthly_vehicle_count()');

COMMENT ON FUNCTION public.reset_monthly_vehicle_count IS 'Resets the current_month_vehicles counter for all workshops. Should be called on the 1st of each month via pg_cron.';

-- ============================================
-- 11. INDEXES
-- ============================================

-- Indexes for workshops
CREATE INDEX idx_workshops_owner_id ON public.workshops(owner_id);
CREATE INDEX idx_workshops_cnpj ON public.workshops(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX idx_workshops_email ON public.workshops(email) WHERE email IS NOT NULL;
CREATE INDEX idx_workshops_is_active ON public.workshops(is_active);

-- Indexes for workshop_service_templates
CREATE INDEX idx_workshop_service_templates_workshop_id ON public.workshop_service_templates(workshop_id);
CREATE INDEX idx_workshop_service_templates_is_active ON public.workshop_service_templates(is_active);

-- Indexes for workshop_maintenances
CREATE INDEX idx_workshop_maintenances_maintenance_id ON public.workshop_maintenances(maintenance_id);
CREATE INDEX idx_workshop_maintenances_workshop_id ON public.workshop_maintenances(workshop_id);

-- Indexes for maintenances (new columns)
CREATE INDEX idx_maintenances_created_by_workshop_id ON public.maintenances(created_by_workshop_id) WHERE created_by_workshop_id IS NOT NULL;
CREATE INDEX idx_maintenances_public_token ON public.maintenances(public_token) WHERE public_token IS NOT NULL;
CREATE INDEX idx_maintenances_is_public ON public.maintenances(is_public) WHERE is_public = true;

-- ============================================
-- 12. GRANT PERMISSIONS
-- ============================================

-- Grant usage to authenticated and anon roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table permissions
GRANT SELECT ON public.workshops TO anon;
GRANT ALL ON public.workshops TO authenticated;

GRANT ALL ON public.workshop_service_templates TO authenticated;

GRANT SELECT ON public.workshop_maintenances TO anon;
GRANT ALL ON public.workshop_maintenances TO authenticated;

-- ============================================
-- Migration complete!
-- ============================================
