-- Add initial_km field to vehicles table
-- This field stores the KM when the vehicle was first registered or purchased
-- It will be used as a baseline for calculating maintenance alerts

-- Add the column (default to current_km for existing vehicles)
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS initial_km INTEGER;

-- For existing vehicles, set initial_km to current_km
UPDATE public.vehicles
SET initial_km = current_km
WHERE initial_km IS NULL;

-- Make it NOT NULL after setting values
ALTER TABLE public.vehicles
ALTER COLUMN initial_km SET NOT NULL;

-- Add comment to document the field
COMMENT ON COLUMN public.vehicles.initial_km IS 'Quilometragem inicial do veículo quando foi cadastrado/comprado';
COMMENT ON COLUMN public.vehicles.current_km IS 'Quilometragem atual do veículo (atualizada automaticamente com manutenções)';
