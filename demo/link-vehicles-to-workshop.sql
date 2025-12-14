-- =====================================================
-- VINCULAR VEÍCULOS EXISTENTES À OFICINA DEMO
-- =====================================================
--
-- Este script vincula todos os veículos com placas reais
-- à oficina silva.mateush01@gmail.com como clientes.
--
-- Isso permite que a oficina veja oportunidades de negócio
-- para esses veículos na aba Oportunidades.
--
-- Execute após:
-- 1. cleanup-for-real-plates.sql
-- 2. update-vehicles-from-api.ts
-- 3. populate-revisions-cache.ts
--
-- =====================================================

-- =====================================================
-- ETAPA 1: BUSCAR ID DA OFICINA
-- =====================================================

-- Verificar oficina
SELECT
  w.id as workshop_id,
  w.name,
  p.email,
  p.full_name
FROM workshops w
JOIN profiles p ON p.id = w.owner_id
WHERE p.email = 'silva.mateush01@gmail.com';

-- Anotar o workshop_id retornado acima

-- =====================================================
-- ETAPA 2: LISTAR VEÍCULOS A SEREM VINCULADOS
-- =====================================================

-- Ver todos os veículos com placas reais e seus proprietários
SELECT
  v.id as vehicle_id,
  v.plate,
  v.brand,
  v.model,
  v.year,
  v.current_km,
  p.email as owner_email,
  p.full_name as owner_name,
  p.phone,
  (SELECT COUNT(*) FROM maintenances m WHERE m.vehicle_id = v.id) as maintenance_count
FROM vehicles v
JOIN profiles p ON p.id = v.user_id
ORDER BY v.created_at DESC;

-- Anotar quantos veículos existem

-- =====================================================
-- ETAPA 3: CRIAR MANUTENÇÕES SIMULADAS (OPCIONAL)
-- =====================================================

-- Para gerar oportunidades, precisamos de histórico de manutenções antigas
-- Isso vai criar uma manutenção antiga para cada veículo (se não tiver)

-- IMPORTANTE: Substituir 'WORKSHOP_ID_AQUI' pelo ID da oficina

-- Inserir manutenção antiga para veículos sem histórico
INSERT INTO maintenances (vehicle_id, date, service_type, description, cost, km, created_by_workshop_id)
SELECT
  v.id,
  (now() - interval '12 months'), -- 12 meses atrás
  'Troca de óleo',
  'Manutenção básica',
  25000, -- R$ 250,00
  v.current_km - 10000, -- 10.000 km atrás
  'WORKSHOP_ID_AQUI'
FROM vehicles v
WHERE NOT EXISTS (
  SELECT 1 FROM maintenances m WHERE m.vehicle_id = v.id
);

-- =====================================================
-- ETAPA 4: VINCULAR MANUTENÇÕES À OFICINA
-- =====================================================

-- IMPORTANTE: Substituir 'WORKSHOP_ID_AQUI' pelo ID da oficina

-- Vincular todas as manutenções existentes à oficina
INSERT INTO workshop_maintenances (workshop_id, maintenance_id)
SELECT
  'WORKSHOP_ID_AQUI',
  m.id
FROM maintenances m
WHERE NOT EXISTS (
  SELECT 1
  FROM workshop_maintenances wm
  WHERE wm.maintenance_id = m.id
  AND wm.workshop_id = 'WORKSHOP_ID_AQUI'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ETAPA 5: VERIFICAR VINCULAÇÕES
-- =====================================================

-- IMPORTANTE: Substituir 'WORKSHOP_ID_AQUI' pelo ID da oficina

-- Contar quantas manutenções a oficina tem acesso
SELECT COUNT(*) as total_maintenances
FROM workshop_maintenances
WHERE workshop_id = 'WORKSHOP_ID_AQUI';

-- Listar veículos vinculados à oficina
SELECT DISTINCT
  v.id,
  v.plate,
  v.brand,
  v.model,
  v.year,
  p.full_name as owner,
  p.phone,
  COUNT(m.id) as maintenance_count,
  MAX(m.date) as last_maintenance
FROM vehicles v
JOIN profiles p ON p.id = v.user_id
JOIN maintenances m ON m.vehicle_id = v.id
JOIN workshop_maintenances wm ON wm.maintenance_id = m.id
WHERE wm.workshop_id = 'WORKSHOP_ID_AQUI'
GROUP BY v.id, v.plate, v.brand, v.model, v.year, p.full_name, p.phone
ORDER BY MAX(m.date) DESC;

-- =====================================================
-- ETAPA 6: VERIFICAR CACHE DE REVISÕES
-- =====================================================

-- Verificar quantos veículos têm cache populado
SELECT
  COUNT(DISTINCT v.id) as vehicles_with_cache,
  SUM(CASE WHEN v.revisions_fetched THEN 1 ELSE 0 END) as vehicles_fetched,
  COUNT(DISTINCT vmr.vehicle_id) as vehicles_with_revisions
FROM vehicles v
LEFT JOIN vehicle_manufacturer_revisions vmr ON vmr.vehicle_id = v.id;

-- Detalhes por veículo
SELECT
  v.plate,
  v.brand,
  v.model,
  v.revisions_fetched,
  COUNT(vmr.id) as revision_count
FROM vehicles v
LEFT JOIN vehicle_manufacturer_revisions vmr ON vmr.vehicle_id = v.id
GROUP BY v.id, v.plate, v.brand, v.model, v.revisions_fetched
ORDER BY v.revisions_fetched DESC, v.plate;

-- =====================================================
-- ✅ SCRIPT CONCLUÍDO
-- =====================================================

-- Resumo:
-- 1. ✅ Oficina identificada
-- 2. ✅ Manutenções criadas/vinculadas
-- 3. ✅ Veículos vinculados à oficina
--
-- Próximos passos:
-- 1. Fazer login como silva.mateush01@gmail.com
-- 2. Ir para aba "Oportunidades"
-- 3. Verificar lista de clientes com manutenções atrasadas
-- 4. Verificar cálculo de receita potencial
