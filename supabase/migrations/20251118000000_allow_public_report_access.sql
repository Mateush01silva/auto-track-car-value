-- ============================================
-- Allow public read access to vehicles and maintenances for report sharing
-- This enables QR Code sharing feature where anyone with the link can view the report
-- ============================================

-- Add public read policy for vehicles
CREATE POLICY "Anyone can view vehicles for reports"
  ON public.vehicles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Add public read policy for maintenances
CREATE POLICY "Anyone can view maintenances for reports"
  ON public.maintenances FOR SELECT
  TO anon, authenticated
  USING (true);

-- Note: Write/Update/Delete policies remain restricted to owners only
-- This ensures data security while enabling the sharing feature
