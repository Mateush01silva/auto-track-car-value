-- Reset revisions cache for vehicles without cached revisions
-- Este script limpa a flag revisions_fetched para veículos que não têm revisões no cache
-- Isso permite que o sistema tente buscar as revisões novamente da API SUIV

-- Encontrar veículos que estão marcados como "fetched" mas não têm revisões
SELECT
  v.id,
  v.brand,
  v.model,
  v.year,
  v.revisions_fetched,
  v.revisions_fetched_at,
  COUNT(vmr.id) as revision_count
FROM vehicles v
LEFT JOIN vehicle_manufacturer_revisions vmr ON vmr.vehicle_id = v.id
WHERE v.revisions_fetched = true
GROUP BY v.id
HAVING COUNT(vmr.id) = 0;

-- Resetar flag para esses veículos (permitir nova tentativa)
UPDATE vehicles
SET
  revisions_fetched = false,
  revisions_fetched_at = NULL
WHERE id IN (
  SELECT v.id
  FROM vehicles v
  LEFT JOIN vehicle_manufacturer_revisions vmr ON vmr.vehicle_id = v.id
  WHERE v.revisions_fetched = true
  GROUP BY v.id
  HAVING COUNT(vmr.id) = 0
);

-- Verificar resultado
SELECT
  COUNT(*) as vehicles_reset
FROM vehicles
WHERE revisions_fetched = false;
