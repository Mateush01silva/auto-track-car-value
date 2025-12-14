-- =====================================================
-- SETUP COMPLETO DO AMBIENTE DEMO - SÓ SQL!
-- =====================================================
--
-- Este script faz TUDO via SQL, sem precisar de Node.js ou scripts TypeScript.
-- Execute direto no Supabase SQL Editor.
--
-- ⚠️ IMPORTANTE:
-- A API SUIV será chamada via SQL, mas isso requer a extensão http do Supabase.
-- Como alternativa, vou fornecer queries para você fazer manualmente.
--
-- =====================================================

-- =====================================================
-- ETAPA 1: LIMPEZA DE DADOS NÃO REAIS
-- =====================================================

-- Deletar manutenções vinculadas aos veículos não reais
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

-- Deletar os veículos não reais
DELETE FROM vehicles
WHERE id IN (
  '59005700-40b8-407a-8c7a-79cf461d623c',
  '5de40ee9-707b-410c-ba70-7538159f72cb',
  '8f789253-6a63-4a62-8703-633463b7f789',
  'ee92734e-7600-4c6c-9274-75b95ebd3157'
);

-- Verificar quantos veículos restaram
SELECT COUNT(*) as total_veiculos_com_placas_reais FROM vehicles;

-- =====================================================
-- ETAPA 2: BUSCAR ID DA OFICINA
-- =====================================================

-- Buscar workshop_id da oficina silva.mateush01@gmail.com
SELECT
  w.id as workshop_id,
  w.name,
  p.email
FROM workshops w
JOIN profiles p ON p.id = w.owner_id
WHERE p.email = 'silva.mateush01@gmail.com';

-- ⚠️ ANOTE O workshop_id RETORNADO!
-- Você vai usar na ETAPA 3

-- =====================================================
-- ETAPA 3: DELETAR MANUTENÇÕES DA OFICINA
-- =====================================================

-- ⚠️ IMPORTANTE: Substituir 'WORKSHOP_ID_AQUI' pelo ID da ETAPA 2

-- Deletar vinculações
DELETE FROM workshop_maintenances
WHERE workshop_id = 'WORKSHOP_ID_AQUI'::uuid;

-- Deletar manutenções criadas pela oficina
DELETE FROM maintenances
WHERE created_by_workshop_id = 'WORKSHOP_ID_AQUI'::uuid;

-- =====================================================
-- ETAPA 4: LISTAR PLACAS PARA ATUALIZAÇÃO MANUAL
-- =====================================================

-- Esta query lista todas as placas que precisam ser atualizadas
-- Você vai buscar cada uma na API SUIV manualmente

SELECT
  v.id,
  v.plate,
  v.brand as marca_antiga,
  v.model as modelo_antigo,
  v.version as versao_antiga,
  v.year as ano_antigo,
  v.year_fab as ano_fab_antigo,
  v.current_km
FROM vehicles v
ORDER BY v.created_at;

-- ⚠️ COPIE ESTA LISTA!
-- Para cada placa, você vai:
-- 1. Buscar na API SUIV manualmente (via Postman, browser, ou sistema)
-- 2. Atualizar usando a query da ETAPA 5

-- =====================================================
-- ETAPA 5: ATUALIZAR VEÍCULO INDIVIDUAL
-- =====================================================

-- Template para atualizar cada veículo
-- Execute uma vez para cada veículo, substituindo os valores

/*
UPDATE vehicles
SET
  brand = 'VOLKSWAGEN',           -- Substituir pelo retorno da API
  model = 'GOL',                  -- Substituir pelo retorno da API
  version = '1.0 FLEX',           -- Substituir pelo retorno da API
  year = 2020,                    -- Substituir pelo yearModel da API
  year_fab = 2019,                -- Substituir pelo yearFab da API
  revisions_fetched = false,
  revisions_fetched_at = null,
  updated_at = now()
WHERE plate = 'ABC1234';          -- Substituir pela placa do veículo

-- Verificar se atualizou
SELECT * FROM vehicles WHERE plate = 'ABC1234';
*/

-- =====================================================
-- ETAPA 6: RESETAR CACHE DE REVISÕES
-- =====================================================

-- Resetar flag para todos os veículos
-- (Isso força o sistema a buscar revisões novamente quando o usuário acessar)

UPDATE vehicles
SET
  revisions_fetched = false,
  revisions_fetched_at = null
WHERE revisions_fetched = true;

-- Verificar
SELECT COUNT(*) as veiculos_sem_cache
FROM vehicles
WHERE revisions_fetched = false OR revisions_fetched IS NULL;

-- =====================================================
-- ETAPA 7: CRIAR MANUTENÇÕES ANTIGAS
-- =====================================================

-- ⚠️ IMPORTANTE: Substituir 'WORKSHOP_ID_AQUI' pelo ID da ETAPA 2

-- Criar manutenção antiga (12 meses atrás) para cada veículo
INSERT INTO maintenances (vehicle_id, date, service_type, description, cost, km, created_by_workshop_id)
SELECT
  v.id,
  (now() - interval '12 months'),
  'Troca de óleo',
  'Manutenção básica',
  25000, -- R$ 250,00 em centavos
  GREATEST(v.current_km - 10000, 0),
  'WORKSHOP_ID_AQUI'::uuid
FROM vehicles v
WHERE NOT EXISTS (
  SELECT 1 FROM maintenances m WHERE m.vehicle_id = v.id
);

-- Verificar quantas manutenções foram criadas
SELECT COUNT(*) as manutencoes_criadas FROM maintenances;

-- =====================================================
-- ETAPA 8: VINCULAR MANUTENÇÕES À OFICINA
-- =====================================================

-- ⚠️ IMPORTANTE: Substituir 'WORKSHOP_ID_AQUI' pelo ID da ETAPA 2

INSERT INTO workshop_maintenances (workshop_id, maintenance_id)
SELECT
  'WORKSHOP_ID_AQUI'::uuid,
  m.id
FROM maintenances m
WHERE NOT EXISTS (
  SELECT 1
  FROM workshop_maintenances wm
  WHERE wm.maintenance_id = m.id
  AND wm.workshop_id = 'WORKSHOP_ID_AQUI'::uuid
)
ON CONFLICT DO NOTHING;

-- Verificar vinculações
SELECT COUNT(*) as manutencoes_vinculadas
FROM workshop_maintenances
WHERE workshop_id = 'WORKSHOP_ID_AQUI'::uuid;

-- =====================================================
-- ETAPA 9: VERIFICAR CLIENTES DA OFICINA
-- =====================================================

-- ⚠️ IMPORTANTE: Substituir 'WORKSHOP_ID_AQUI' pelo ID da ETAPA 2

-- Ver todos os veículos vinculados à oficina
SELECT DISTINCT
  v.id,
  v.plate,
  v.brand,
  v.model,
  v.version,
  v.year,
  p.full_name as proprietario,
  p.phone,
  p.email,
  COUNT(m.id) as total_manutencoes,
  MAX(m.date) as ultima_manutencao
FROM vehicles v
JOIN profiles p ON p.id = v.user_id
JOIN maintenances m ON m.vehicle_id = v.id
JOIN workshop_maintenances wm ON wm.maintenance_id = m.id
WHERE wm.workshop_id = 'WORKSHOP_ID_AQUI'::uuid
GROUP BY v.id, v.plate, v.brand, v.model, v.version, v.year, p.full_name, p.phone, p.email
ORDER BY MAX(m.date) ASC;

-- =====================================================
-- ✅ SETUP COMPLETO!
-- =====================================================

-- Resumo do que foi feito:
-- ✅ Deletados veículos com placas não reais
-- ✅ Deletadas manutenções da oficina
-- ✅ Listadas placas para atualização manual
-- ✅ Cache de revisões resetado
-- ✅ Manutenções antigas criadas
-- ✅ Manutenções vinculadas à oficina
-- ✅ Clientes prontos para aparecer em Oportunidades

-- Próximos passos:
-- 1. Sistema vai popular cache de revisões automaticamente quando:
--    - Usuário acessar página de veículos
--    - Oficina buscar por placa
--    - Sistema calcular oportunidades
--
-- 2. Fazer login como silva.mateush01@gmail.com
--
-- 3. Ir para aba Oportunidades
--
-- 4. Sistema vai:
--    - Buscar revisões da API SUIV automaticamente (primeira vez)
--    - Salvar no cache
--    - Calcular oportunidades
--    - Mostrar receita potencial
