-- Create vehicle_manufacturer_revisions table
-- This table caches manufacturer revision plans to avoid repeated API calls
-- ONE API CALL PER VEHICLE - saves money!

CREATE TABLE IF NOT EXISTS vehicle_manufacturer_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

  -- Service identification (from manufacturer)
  category text NOT NULL,
  item text NOT NULL,
  description text NOT NULL,

  -- Maintenance intervals
  km_interval integer, -- Intervalo em KM (ex: 10000)
  time_interval integer, -- Intervalo em meses (ex: 12)

  -- Metadata
  type text NOT NULL DEFAULT 'Preventiva', -- Preventiva ou Corretiva
  criticality text NOT NULL, -- Crítica, Alta, Média, Baixa

  -- Cost estimates (from SUIV API or generic)
  min_cost numeric(10,2) DEFAULT 0,
  max_cost numeric(10,2) DEFAULT 0,
  estimated_time integer, -- Tempo estimado em minutos

  -- API source tracking
  source text NOT NULL DEFAULT 'suiv', -- 'suiv' ou 'generic'

  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Constraint: unique revision per vehicle
  UNIQUE(vehicle_id, category, item)
);

-- Create indexes for faster lookups
CREATE INDEX idx_vehicle_manufacturer_revisions_vehicle ON vehicle_manufacturer_revisions(vehicle_id);
CREATE INDEX idx_vehicle_manufacturer_revisions_category ON vehicle_manufacturer_revisions(category);
CREATE INDEX idx_vehicle_manufacturer_revisions_criticality ON vehicle_manufacturer_revisions(criticality);

-- Enable RLS
ALTER TABLE vehicle_manufacturer_revisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can view revisions for their own vehicles
CREATE POLICY "Users can view revisions for their vehicles"
  ON vehicle_manufacturer_revisions
  FOR SELECT
  USING (
    vehicle_id IN (
      SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
  );

-- Workshops can view revisions for vehicles they service
CREATE POLICY "Workshops can view revisions for client vehicles"
  ON vehicle_manufacturer_revisions
  FOR SELECT
  USING (
    vehicle_id IN (
      SELECT DISTINCT v.id
      FROM vehicles v
      INNER JOIN maintenances m ON m.vehicle_id = v.id
      INNER JOIN workshop_maintenances wm ON wm.maintenance_id = m.id
      INNER JOIN workshops w ON w.id = wm.workshop_id
      WHERE w.owner_id = auth.uid()
    )
  );

-- System can insert revisions (for any vehicle)
CREATE POLICY "System can insert revisions"
  ON vehicle_manufacturer_revisions
  FOR INSERT
  WITH CHECK (true);

-- Users can update revisions for their vehicles
CREATE POLICY "Users can update revisions for their vehicles"
  ON vehicle_manufacturer_revisions
  FOR UPDATE
  USING (
    vehicle_id IN (
      SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vehicle_manufacturer_revisions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_vehicle_manufacturer_revisions_updated_at
  BEFORE UPDATE ON vehicle_manufacturer_revisions
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_manufacturer_revisions_updated_at();

-- Add comment to table
COMMENT ON TABLE vehicle_manufacturer_revisions IS 'Caches manufacturer revision plans to minimize API calls. One API call per vehicle only!';

-- Add a field to vehicles table to track if revisions were fetched
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS revisions_fetched boolean DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS revisions_fetched_at timestamp with time zone;

COMMENT ON COLUMN vehicles.revisions_fetched IS 'Indicates if manufacturer revisions were already fetched from API';
COMMENT ON COLUMN vehicles.revisions_fetched_at IS 'Timestamp when revisions were last fetched from API';
