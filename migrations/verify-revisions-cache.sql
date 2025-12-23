-- Diagnostic queries to verify revisions cache state
-- Run these queries in Supabase SQL Editor to check what data exists

-- 1. Overview: Check all vehicles and their revision counts
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
GROUP BY v.id, v.brand, v.model, v.year, v.revisions_fetched, v.revisions_fetched_at
ORDER BY v.created_at DESC;

-- 2. Check if ANY revisions exist in the database
SELECT COUNT(*) as total_revisions
FROM vehicle_manufacturer_revisions;

-- 3. Show all cached revisions (if any exist)
SELECT
  v.brand,
  v.model,
  v.year,
  vmr.category,
  vmr.item,
  vmr.description,
  vmr.km_interval,
  vmr.time_interval,
  vmr.criticality,
  vmr.created_at
FROM vehicle_manufacturer_revisions vmr
JOIN vehicles v ON v.id = vmr.vehicle_id
ORDER BY v.brand, v.model, vmr.category, vmr.item;

-- 4. Specific check for COBALT (the vehicle we've been testing)
SELECT
  v.id,
  v.brand,
  v.model,
  v.year,
  v.revisions_fetched,
  v.revisions_fetched_at,
  vmr.category,
  vmr.item,
  vmr.description,
  vmr.km_interval,
  vmr.time_interval
FROM vehicles v
LEFT JOIN vehicle_manufacturer_revisions vmr ON vmr.vehicle_id = v.id
WHERE v.model LIKE '%COBALT%'
   OR v.brand LIKE '%CHEVROLET%'
ORDER BY v.id, vmr.category;

-- 5. Find vehicles marked as fetched but with no revisions (problematic state)
SELECT
  v.id,
  v.brand,
  v.model,
  v.year,
  v.revisions_fetched,
  v.revisions_fetched_at
FROM vehicles v
LEFT JOIN vehicle_manufacturer_revisions vmr ON vmr.vehicle_id = v.id
WHERE v.revisions_fetched = true
GROUP BY v.id
HAVING COUNT(vmr.id) = 0;
