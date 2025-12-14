-- =====================================================
-- SCRIPT DE LIMPEZA PARA AMBIENTE DE DEMONSTRAÇÃO
-- =====================================================
--
-- Este script:
-- 1. Remove veículos com placas não reais (IDs especificados)
-- 2. Remove todas as manutenções da oficina silva.mateush01@gmail.com
-- 3. Prepara o ambiente para usar placas reais existentes
--
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- =====================================================
-- ETAPA 1: DELETAR VEÍCULOS COM PLACAS NÃO REAIS
-- =====================================================

-- IDs dos veículos a serem deletados:
-- 59005700-40b8-407a-8c7a-79cf461d623c
-- 5de40ee9-707b-410c-ba70-7538159f72cb
-- 8f789253-6a63-4a62-8703-633463b7f789
-- ee92734e-7600-4c6c-9274-75b95ebd3157

-- Deletar manutenções vinculadas a esses veículos primeiro
DELETE FROM maintenances
WHERE vehicle_id IN (
  '59005700-40b8-407a-8c7a-79cf461d623c',
  '5de40ee9-707b-410c-ba70-7538159f72cb',
  '8f789253-6a63-4a62-8703-633463b7f789',
  'ee92734e-7600-4c6c-9274-75b95ebd3157'
);

-- Deletar cache de revisões desses veículos
DELETE FROM vehicle_manufacturer_revisions
WHERE vehicle_id IN (
  '59005700-40b8-407a-8c7a-79cf461d623c',
  '5de40ee9-707b-410c-ba70-7538159f72cb',
  '8f789253-6a63-4a62-8703-633463b7f789',
  'ee92734e-7600-4c6c-9274-75b95ebd3157'
);

-- Deletar os veículos
DELETE FROM vehicles
WHERE id IN (
  '59005700-40b8-407a-8c7a-79cf461d623c',
  '5de40ee9-707b-410c-ba70-7538159f72cb',
  '8f789253-6a63-4a62-8703-633463b7f789',
  'ee92734e-7600-4c6c-9274-75b95ebd3157'
);

-- =====================================================
-- ETAPA 2: BUSCAR ID DA OFICINA
-- =====================================================

-- Verificar se a oficina existe
SELECT
  w.id as workshop_id,
  w.name as workshop_name,
  p.email,
  p.full_name
FROM workshops w
JOIN profiles p ON p.id = w.owner_id
WHERE p.email = 'silva.mateush01@gmail.com';

-- Anotar o workshop_id retornado acima e usar na próxima etapa

-- =====================================================
-- ETAPA 3: DELETAR MANUTENÇÕES DA OFICINA
-- =====================================================

-- IMPORTANTE: Substituir 'WORKSHOP_ID_AQUI' pelo ID retornado acima

-- Deletar vinculações na tabela workshop_maintenances
DELETE FROM workshop_maintenances
WHERE workshop_id = 'WORKSHOP_ID_AQUI';

-- Deletar as manutenções que foram criadas por essa oficina
DELETE FROM maintenances
WHERE created_by_workshop_id = 'WORKSHOP_ID_AQUI';

-- OU se quiser deletar TODAS as manutenções vinculadas à oficina:
-- DELETE FROM maintenances
-- WHERE id IN (
--   SELECT maintenance_id FROM workshop_maintenances
--   WHERE workshop_id = 'WORKSHOP_ID_AQUI'
-- );

-- =====================================================
-- ETAPA 4: VERIFICAR VEÍCULOS RESTANTES COM PLACAS REAIS
-- =====================================================

-- Listar todos os veículos que sobraram (com placas reais)
SELECT
  v.id,
  v.plate,
  v.brand,
  v.model,
  v.version,
  v.year,
  v.year_fab,
  v.current_km,
  p.email as owner_email,
  p.full_name as owner_name
FROM vehicles v
JOIN profiles p ON p.id = v.user_id
ORDER BY v.created_at DESC;

-- Contar quantos veículos restaram
SELECT COUNT(*) as total_vehicles_with_real_plates
FROM vehicles;

-- =====================================================
-- ETAPA 5: VERIFICAR CACHE DE REVISÕES
-- =====================================================

-- Verificar quais veículos já têm cache de revisões
SELECT
  v.id,
  v.plate,
  v.brand,
  v.model,
  v.revisions_fetched,
  v.revisions_fetched_at,
  COUNT(vmr.id) as cached_revisions_count
FROM vehicles v
LEFT JOIN vehicle_manufacturer_revisions vmr ON vmr.vehicle_id = v.id
GROUP BY v.id, v.plate, v.brand, v.model, v.revisions_fetched, v.revisions_fetched_at
ORDER BY v.created_at DESC;

-- =====================================================
-- ✅ SCRIPT DE LIMPEZA CONCLUÍDO
-- =====================================================

-- Resumo do que foi feito:
-- 1. ✅ Deletados 4 veículos com placas não reais
-- 2. ✅ Deletadas manutenções da oficina silva.mateush01@gmail.com
-- 3. ✅ Preparado ambiente para usar apenas placas reais
--
-- Próximos passos:
-- 1. Executar script de atualização via API (update-vehicles-from-api.ts)
-- 2. Popular cache de revisões (populate-revisions-cache.ts)
-- 3. Vincular veículos à oficina como clientes
