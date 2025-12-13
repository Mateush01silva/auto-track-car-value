-- Create workshop_service_prices table
-- This table stores custom pricing estimates set by each workshop for different services

CREATE TABLE IF NOT EXISTS workshop_service_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,

  -- Service identification
  service_category text NOT NULL, -- Ex: "Motor", "Freios", "Suspensão"
  service_item text NOT NULL, -- Ex: "Troca de óleo do motor", "Pastilhas de freio"
  service_description text, -- Descrição detalhada (opcional)

  -- Pricing (in cents to avoid floating point issues)
  min_price integer NOT NULL DEFAULT 0, -- Preço mínimo em centavos
  max_price integer NOT NULL DEFAULT 0, -- Preço máximo em centavos

  -- Labor cost (optional, if workshop wants to separate parts from labor)
  labor_percentage integer DEFAULT 25, -- Percentual de mão de obra (padrão 25%)

  -- Metadata
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Constraints
  CONSTRAINT positive_prices CHECK (min_price >= 0 AND max_price >= 0),
  CONSTRAINT valid_price_range CHECK (max_price >= min_price),
  CONSTRAINT valid_labor_percentage CHECK (labor_percentage >= 0 AND labor_percentage <= 100),

  -- Unique constraint: one price per service per workshop
  UNIQUE(workshop_id, service_category, service_item)
);

-- Create index for faster lookups
CREATE INDEX idx_workshop_service_prices_workshop ON workshop_service_prices(workshop_id);
CREATE INDEX idx_workshop_service_prices_category ON workshop_service_prices(service_category);

-- Enable RLS
ALTER TABLE workshop_service_prices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Workshop owners can manage their own service prices
CREATE POLICY "Workshops can view their own service prices"
  ON workshop_service_prices
  FOR SELECT
  USING (
    workshop_id IN (
      SELECT id FROM workshops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Workshops can insert their own service prices"
  ON workshop_service_prices
  FOR INSERT
  WITH CHECK (
    workshop_id IN (
      SELECT id FROM workshops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Workshops can update their own service prices"
  ON workshop_service_prices
  FOR UPDATE
  USING (
    workshop_id IN (
      SELECT id FROM workshops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Workshops can delete their own service prices"
  ON workshop_service_prices
  FOR DELETE
  USING (
    workshop_id IN (
      SELECT id FROM workshops WHERE owner_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workshop_service_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_workshop_service_prices_updated_at
  BEFORE UPDATE ON workshop_service_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_workshop_service_prices_updated_at();

-- Add comment to table
COMMENT ON TABLE workshop_service_prices IS 'Stores custom service pricing set by workshops for use in opportunity calculations';
