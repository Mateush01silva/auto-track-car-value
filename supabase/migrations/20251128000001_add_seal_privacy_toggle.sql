-- ============================================
-- Migration: Add privacy toggle for quality seal
-- Allows vehicle owners to hide seal in public history
-- ============================================

-- 1. Add column to vehicles table
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS mostrar_selo_publico BOOLEAN DEFAULT true;

-- 2. Add comment
COMMENT ON COLUMN public.vehicles.mostrar_selo_publico IS 'Se true, o selo de qualidade será exibido no histórico público compartilhado';

-- 3. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_mostrar_selo_publico
  ON public.vehicles(mostrar_selo_publico);

-- ============================================
-- Migration complete!
-- ============================================
