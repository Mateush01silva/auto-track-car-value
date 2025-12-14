-- =====================================================
-- SCRIPT DE DADOS DEMO PARA APRESENTAÇÃO
-- =====================================================
--
-- Este script cria dados de demonstração para apresentar o sistema.
-- Inclui:
-- - 15 proprietários com veículos diversos
-- - 1 oficina demo (Auto Center Demo)
-- - Histórico de manutenções variado
-- - Diferentes níveis de atraso (crítico, alto, médio, baixo)
--
-- ⚠️ ATENÇÃO: Este script LIMPA dados existentes de demo!
-- Execute APENAS em ambiente de desenvolvimento/teste.
--
-- =====================================================

-- =====================================================
-- ETAPA 1: LIMPEZA DE DADOS ANTERIORES DE DEMO
-- =====================================================

-- Deletar manutenções vinculadas à oficina demo (se existir)
DELETE FROM workshop_maintenances
WHERE workshop_id IN (
  SELECT id FROM workshops WHERE name = 'Auto Center Demo'
);

-- Deletar oficina demo
DELETE FROM workshops WHERE name = 'Auto Center Demo';

-- Deletar manutenções de veículos demo
DELETE FROM maintenances
WHERE vehicle_id IN (
  SELECT id FROM vehicles
  WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE 'demo.%@vybo.app'
  )
);

-- Deletar veículos demo
DELETE FROM vehicles
WHERE user_id IN (
  SELECT id FROM profiles WHERE email LIKE 'demo.%@vybo.app'
);

-- Deletar perfis demo (proprietários)
DELETE FROM auth.users WHERE email LIKE 'demo.%@vybo.app';
DELETE FROM profiles WHERE email LIKE 'demo.%@vybo.app';

-- Deletar perfil da oficina demo
DELETE FROM auth.users WHERE email = 'oficina.demo@vybo.app';
DELETE FROM profiles WHERE email = 'oficina.demo@vybo.app';

-- =====================================================
-- ETAPA 2: CRIAR PERFIL DA OFICINA DEMO
-- =====================================================

-- Inserir usuário da oficina no auth.users
-- Senha: Demo@2024
-- Hash gerado pelo Supabase para senha "Demo@2024"
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'oficina.demo@vybo.app',
  '$2a$10$K5xZQZ5nYZ5nYZ5nYZ5nYeXXXXXXXXXXXXXXXXXXXXXXXXXXXX', -- Placeholder - precisa ser atualizado manualmente
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
);

-- Inserir perfil da oficina
INSERT INTO profiles (
  id,
  email,
  full_name,
  phone,
  role,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'oficina.demo@vybo.app',
  'Auto Center Demo',
  '(11) 98765-4321',
  'workshop',
  now()
);

-- Criar oficina
INSERT INTO workshops (
  id,
  owner_id,
  name,
  cnpj,
  address,
  city,
  state,
  monthly_vehicle_limit,
  current_month_vehicles,
  created_at
) VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Auto Center Demo',
  '12.345.678/0001-90',
  'Rua da Demonstração, 123',
  'São Paulo',
  'SP',
  100,
  15,
  now()
);

-- =====================================================
-- ETAPA 3: CRIAR PROPRIETÁRIOS E VEÍCULOS DEMO
-- =====================================================

-- Função auxiliar para criar proprietários
-- Todos usam a senha: Demo@2024

-- Proprietário 1: João Silva
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES ('10000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'demo.joao@vybo.app',
'$2a$10$placeholder', now(), now(), now(), 'authenticated', 'authenticated');

INSERT INTO profiles (id, email, full_name, phone, role, created_at)
VALUES ('10000000-0000-0000-0000-000000000001'::uuid, 'demo.joao@vybo.app', 'João Silva', '(11) 91234-5678', 'owner', now());

INSERT INTO vehicles (id, user_id, brand, model, version, year, year_fab, plate, initial_km, current_km, status, created_at)
VALUES ('20000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000001'::uuid,
'VOLKSWAGEN', 'GOL', '1.0 FLEX', 2020, 2019, 'ABC1234', 0, 45000, 'overdue', now());

-- Proprietário 2: Maria Santos
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES ('10000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'demo.maria@vybo.app',
'$2a$10$placeholder', now(), now(), now(), 'authenticated', 'authenticated');

INSERT INTO profiles (id, email, full_name, phone, role, created_at)
VALUES ('10000000-0000-0000-0000-000000000002'::uuid, 'demo.maria@vybo.app', 'Maria Santos', '(11) 92345-6789', 'owner', now());

INSERT INTO vehicles (id, user_id, brand, model, version, year, year_fab, plate, initial_km, current_km, status, created_at)
VALUES ('20000000-0000-0000-0000-000000000002'::uuid, '10000000-0000-0000-0000-000000000002'::uuid,
'CHEVROLET', 'ONIX', '1.0 TURBO', 2022, 2021, 'DEF5678', 0, 28000, 'due-soon', now());

-- Proprietário 3: Pedro Oliveira
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES ('10000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'demo.pedro@vybo.app',
'$2a$10$placeholder', now(), now(), now(), 'authenticated', 'authenticated');

INSERT INTO profiles (id, email, full_name, phone, role, created_at)
VALUES ('10000000-0000-0000-0000-000000000003'::uuid, 'demo.pedro@vybo.app', 'Pedro Oliveira', '(11) 93456-7890', 'owner', now());

INSERT INTO vehicles (id, user_id, brand, model, version, year, year_fab, plate, initial_km, current_km, status, created_at)
VALUES ('20000000-0000-0000-0000-000000000003'::uuid, '10000000-0000-0000-0000-000000000003'::uuid,
'FIAT', 'ARGO', '1.3 FIREFLY', 2021, 2020, 'GHI9012', 0, 52000, 'overdue', now());

-- Proprietário 4: Ana Costa
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES ('10000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'demo.ana@vybo.app',
'$2a$10$placeholder', now(), now(), now(), 'authenticated', 'authenticated');

INSERT INTO profiles (id, email, full_name, phone, role, created_at)
VALUES ('10000000-0000-0000-0000-000000000004'::uuid, 'demo.ana@vybo.app', 'Ana Costa', '(11) 94567-8901', 'owner', now());

INSERT INTO vehicles (id, user_id, brand, model, version, year, year_fab, plate, initial_km, current_km, status, created_at)
VALUES ('20000000-0000-0000-0000-000000000004'::uuid, '10000000-0000-0000-0000-000000000004'::uuid,
'TOYOTA', 'COROLLA', '2.0 GLI', 2019, 2018, 'JKL3456', 0, 78000, 'overdue', now());

-- Proprietário 5: Carlos Ferreira
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES ('10000000-0000-0000-0000-000000000005'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'demo.carlos@vybo.app',
'$2a$10$placeholder', now(), now(), now(), 'authenticated', 'authenticated');

INSERT INTO profiles (id, email, full_name, phone, role, created_at)
VALUES ('10000000-0000-0000-0000-000000000005'::uuid, 'demo.carlos@vybo.app', 'Carlos Ferreira', '(11) 95678-9012', 'owner', now());

INSERT INTO vehicles (id, user_id, brand, model, version, year, year_fab, plate, initial_km, current_km, status, created_at)
VALUES ('20000000-0000-0000-0000-000000000005'::uuid, '10000000-0000-0000-0000-000000000005'::uuid,
'HYUNDAI', 'HB20', '1.0 COMFORT', 2020, 2020, 'MNO7890', 0, 35000, 'due-soon', now());

-- Proprietário 6: Juliana Alves
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES ('10000000-0000-0000-0000-000000000006'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'demo.juliana@vybo.app',
'$2a$10$placeholder', now(), now(), now(), 'authenticated', 'authenticated');

INSERT INTO profiles (id, email, full_name, phone, role, created_at)
VALUES ('10000000-0000-0000-0000-000000000006'::uuid, 'demo.juliana@vybo.app', 'Juliana Alves', '(11) 96789-0123', 'owner', now());

INSERT INTO vehicles (id, user_id, brand, model, version, year, year_fab, plate, initial_km, current_km, status, created_at)
VALUES ('20000000-0000-0000-0000-000000000006'::uuid, '10000000-0000-0000-0000-000000000006'::uuid,
'HONDA', 'CIVIC', '2.0 SPORT', 2021, 2020, 'PQR1234', 0, 42000, 'up-to-date', now());

-- Proprietário 7: Roberto Lima
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES ('10000000-0000-0000-0000-000000000007'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'demo.roberto@vybo.app',
'$2a$10$placeholder', now(), now(), now(), 'authenticated', 'authenticated');

INSERT INTO profiles (id, email, full_name, phone, role, created_at)
VALUES ('10000000-0000-0000-0000-000000000007'::uuid, 'demo.roberto@vybo.app', 'Roberto Lima', '(11) 97890-1234', 'owner', now());

INSERT INTO vehicles (id, user_id, brand, model, version, year, year_fab, plate, initial_km, current_km, status, created_at)
VALUES ('20000000-0000-0000-0000-000000000007'::uuid, '10000000-0000-0000-0000-000000000007'::uuid,
'FORD', 'KA', 'SE 1.5 AT', 2018, 2018, 'STU5678', 0, 95000, 'overdue', now());

-- Proprietário 8: Fernanda Rocha
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES ('10000000-0000-0000-0000-000000000008'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'demo.fernanda@vybo.app',
'$2a$10$placeholder', now(), now(), now(), 'authenticated', 'authenticated');

INSERT INTO profiles (id, email, full_name, phone, role, created_at)
VALUES ('10000000-0000-0000-0000-000000000008'::uuid, 'demo.fernanda@vybo.app', 'Fernanda Rocha', '(11) 98901-2345', 'owner', now());

INSERT INTO vehicles (id, user_id, brand, model, version, year, year_fab, plate, initial_km, current_km, status, created_at)
VALUES ('20000000-0000-0000-0000-000000000008'::uuid, '10000000-0000-0000-0000-000000000008'::uuid,
'RENAULT', 'KWID', '1.0 ZEN', 2022, 2022, 'VWX9012', 0, 15000, 'up-to-date', now());

-- Proprietário 9: Ricardo Souza
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES ('10000000-0000-0000-0000-000000000009'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'demo.ricardo@vybo.app',
'$2a$10$placeholder', now(), now(), now(), 'authenticated', 'authenticated');

INSERT INTO profiles (id, email, full_name, phone, role, created_at)
VALUES ('10000000-0000-0000-0000-000000000009'::uuid, 'demo.ricardo@vybo.app', 'Ricardo Souza', '(11) 99012-3456', 'owner', now());

INSERT INTO vehicles (id, user_id, brand, model, version, year, year_fab, plate, initial_km, current_km, status, created_at)
VALUES ('20000000-0000-0000-0000-000000000009'::uuid, '10000000-0000-0000-0000-000000000009'::uuid,
'NISSAN', 'VERSA', '1.6 SV', 2020, 2019, 'YZA3456', 0, 61000, 'due-soon', now());

-- Proprietário 10: Patricia Mendes
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES ('10000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'demo.patricia@vybo.app',
'$2a$10$placeholder', now(), now(), now(), 'authenticated', 'authenticated');

INSERT INTO profiles (id, email, full_name, phone, role, created_at)
VALUES ('10000000-0000-0000-0000-000000000010'::uuid, 'demo.patricia@vybo.app', 'Patricia Mendes', '(11) 91111-2222', 'owner', now());

INSERT INTO vehicles (id, user_id, brand, model, version, year, year_fab, plate, initial_km, current_km, status, created_at)
VALUES ('20000000-0000-0000-0000-000000000010'::uuid, '10000000-0000-0000-0000-000000000010'::uuid,
'JEEP', 'COMPASS', '2.0 SPORT', 2019, 2019, 'BCD7890', 0, 72000, 'overdue', now());

-- Proprietário 11: Marcos Ribeiro
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES ('10000000-0000-0000-0000-000000000011'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'demo.marcos@vybo.app',
'$2a$10$placeholder', now(), now(), now(), 'authenticated', 'authenticated');

INSERT INTO profiles (id, email, full_name, phone, role, created_at)
VALUES ('10000000-0000-0000-0000-000000000011'::uuid, 'demo.marcos@vybo.app', 'Marcos Ribeiro', '(11) 92222-3333', 'owner', now());

INSERT INTO vehicles (id, user_id, brand, model, version, year, year_fab, plate, initial_km, current_km, status, created_at)
VALUES ('20000000-0000-0000-0000-000000000011'::uuid, '10000000-0000-0000-0000-000000000011'::uuid,
'VOLKSWAGEN', 'POLO', '1.6 MSI', 2021, 2021, 'EFG1234', 0, 38000, 'up-to-date', now());

-- Proprietário 12: Camila Martins
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES ('10000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'demo.camila@vybo.app',
'$2a$10$placeholder', now(), now(), now(), 'authenticated', 'authenticated');

INSERT INTO profiles (id, email, full_name, phone, role, created_at)
VALUES ('10000000-0000-0000-0000-000000000012'::uuid, 'demo.camila@vybo.app', 'Camila Martins', '(11) 93333-4444', 'owner', now());

INSERT INTO vehicles (id, user_id, brand, model, version, year, year_fab, plate, initial_km, current_km, status, created_at)
VALUES ('20000000-0000-0000-0000-000000000012'::uuid, '10000000-0000-0000-0000-000000000012'::uuid,
'CHEVROLET', 'TRACKER', '1.0 TURBO', 2022, 2022, 'HIJ5678', 0, 22000, 'up-to-date', now());

-- Proprietário 13: Lucas Carvalho
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES ('10000000-0000-0000-0000-000000000013'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'demo.lucas@vybo.app',
'$2a$10$placeholder', now(), now(), now(), 'authenticated', 'authenticated');

INSERT INTO profiles (id, email, full_name, phone, role, created_at)
VALUES ('10000000-0000-0000-0000-000000000013'::uuid, 'demo.lucas@vybo.app', 'Lucas Carvalho', '(11) 94444-5555', 'owner', now());

INSERT INTO vehicles (id, user_id, brand, model, version, year, year_fab, plate, initial_km, current_km, status, created_at)
VALUES ('20000000-0000-0000-0000-000000000013'::uuid, '10000000-0000-0000-0000-000000000013'::uuid,
'FIAT', 'MOBI', '1.0 EASY', 2020, 2020, 'KLM9012', 0, 48000, 'due-soon', now());

-- Proprietário 14: Beatriz Dias
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES ('10000000-0000-0000-0000-000000000014'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'demo.beatriz@vybo.app',
'$2a$10$placeholder', now(), now(), now(), 'authenticated', 'authenticated');

INSERT INTO profiles (id, email, full_name, phone, role, created_at)
VALUES ('10000000-0000-0000-0000-000000000014'::uuid, 'demo.beatriz@vybo.app', 'Beatriz Dias', '(11) 95555-6666', 'owner', now());

INSERT INTO vehicles (id, user_id, brand, model, version, year, year_fab, plate, initial_km, current_km, status, created_at)
VALUES ('20000000-0000-0000-0000-000000000014'::uuid, '10000000-0000-0000-0000-000000000014'::uuid,
'TOYOTA', 'ETIOS', '1.5 XS', 2018, 2017, 'NOP3456', 0, 88000, 'overdue', now());

-- Proprietário 15: Gustavo Nunes
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES ('10000000-0000-0000-0000-000000000015'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'demo.gustavo@vybo.app',
'$2a$10$placeholder', now(), now(), now(), 'authenticated', 'authenticated');

INSERT INTO profiles (id, email, full_name, phone, role, created_at)
VALUES ('10000000-0000-0000-0000-000000000015'::uuid, 'demo.gustavo@vybo.app', 'Gustavo Nunes', '(11) 96666-7777', 'owner', now());

INSERT INTO vehicles (id, user_id, brand, model, version, year, year_fab, plate, initial_km, current_km, status, created_at)
VALUES ('20000000-0000-0000-0000-000000000015'::uuid, '10000000-0000-0000-0000-000000000015'::uuid,
'HYUNDAI', 'CRETA', '1.6 PULSE', 2021, 2021, 'QRS7890', 0, 33000, 'up-to-date', now());

-- =====================================================
-- ETAPA 4: CRIAR HISTÓRICO DE MANUTENÇÕES
-- =====================================================

-- Criar manutenções antigas para gerar oportunidades

-- Veículo 1 (João - GOL) - MUITO ATRASADO
INSERT INTO maintenances (id, vehicle_id, date, service_type, description, cost, km, created_at)
VALUES
('30000000-0000-0000-0000-000000000001'::uuid, '20000000-0000-0000-0000-000000000001'::uuid,
 (now() - interval '18 months'), 'Troca de óleo', 'Óleo sintético 5W30', 28000, 25000, now()),
('30000000-0000-0000-0000-000000000002'::uuid, '20000000-0000-0000-0000-000000000001'::uuid,
 (now() - interval '24 months'), 'Revisão completa', 'Revisão de 20.000 km', 85000, 20000, now());

-- Veículo 2 (Maria - ONIX) - PREVENTIVA EM BREVE
INSERT INTO maintenances (id, vehicle_id, date, service_type, description, cost, km, created_at)
VALUES
('30000000-0000-0000-0000-000000000003'::uuid, '20000000-0000-0000-0000-000000000002'::uuid,
 (now() - interval '8 months'), 'Troca de óleo', 'Óleo sintético', 25000, 20000, now());

-- Veículo 3 (Pedro - ARGO) - ATRASADO
INSERT INTO maintenances (id, vehicle_id, date, service_type, description, cost, km, created_at)
VALUES
('30000000-0000-0000-0000-000000000004'::uuid, '20000000-0000-0000-0000-000000000003'::uuid,
 (now() - interval '14 months'), 'Troca de óleo e filtros', 'Manutenção básica', 32000, 40000, now());

-- Veículo 4 (Ana - COROLLA) - MUITO ATRASADO
INSERT INTO maintenances (id, vehicle_id, date, service_type, description, cost, km, created_at)
VALUES
('30000000-0000-0000-0000-000000000005'::uuid, '20000000-0000-0000-0000-000000000004'::uuid,
 (now() - interval '20 months'), 'Revisão completa', 'Revisão de 60.000 km', 145000, 60000, now());

-- Veículo 5 (Carlos - HB20) - EM DIA
INSERT INTO maintenances (id, vehicle_id, date, service_type, description, cost, km, created_at)
VALUES
('30000000-0000-0000-0000-000000000006'::uuid, '20000000-0000-0000-0000-000000000005'::uuid,
 (now() - interval '4 months'), 'Troca de óleo', 'Manutenção preventiva', 24000, 30000, now());

-- Veículo 6 (Juliana - CIVIC) - EM DIA
INSERT INTO maintenances (id, vehicle_id, date, service_type, description, cost, km, created_at)
VALUES
('30000000-0000-0000-0000-000000000007'::uuid, '20000000-0000-0000-0000-000000000006'::uuid,
 (now() - interval '3 months'), 'Troca de óleo e filtros', 'Revisão preventiva', 38000, 40000, now());

-- Veículo 7 (Roberto - KA) - CRÍTICO
INSERT INTO maintenances (id, vehicle_id, date, service_type, description, cost, km, created_at)
VALUES
('30000000-0000-0000-0000-000000000008'::uuid, '20000000-0000-0000-0000-000000000007'::uuid,
 (now() - interval '28 months'), 'Troca de óleo', 'Básica', 22000, 70000, now());

-- Veículo 8 (Fernanda - KWID) - EM DIA
INSERT INTO maintenances (id, vehicle_id, date, service_type, description, cost, km, created_at)
VALUES
('30000000-0000-0000-0000-000000000009'::uuid, '20000000-0000-0000-0000-000000000008'::uuid,
 (now() - interval '2 months'), 'Troca de óleo', 'Primeira revisão', 21000, 10000, now());

-- Veículo 9 (Ricardo - VERSA) - ATRASADO
INSERT INTO maintenances (id, vehicle_id, date, service_type, description, cost, km, created_at)
VALUES
('30000000-0000-0000-0000-000000000010'::uuid, '20000000-0000-0000-0000-000000000009'::uuid,
 (now() - interval '15 months'), 'Revisão', 'Revisão de 50.000 km', 75000, 50000, now());

-- Veículo 10 (Patricia - COMPASS) - ATRASADO
INSERT INTO maintenances (id, vehicle_id, date, service_type, description, cost, km, created_at)
VALUES
('30000000-0000-0000-0000-000000000011'::uuid, '20000000-0000-0000-0000-000000000010'::uuid,
 (now() - interval '16 months'), 'Revisão completa', 'Revisão de 60.000 km', 125000, 60000, now());

-- =====================================================
-- ETAPA 5: VINCULAR VEÍCULOS À OFICINA DEMO
-- =====================================================

-- Vincular todas as manutenções à oficina demo
INSERT INTO workshop_maintenances (workshop_id, maintenance_id, created_at)
SELECT
  '10000000-0000-0000-0000-000000000001'::uuid,
  id,
  now()
FROM maintenances
WHERE id::text LIKE '30000000%';

-- =====================================================
-- ✅ SCRIPT CONCLUÍDO
-- =====================================================

-- Resumo:
-- - 1 oficina demo criada
-- - 15 proprietários criados
-- - 15 veículos cadastrados
-- - Histórico de manutenções variado
-- - Diferentes níveis de atraso

-- Próximos passos:
-- 1. Atualizar as senhas manualmente no Supabase Auth
-- 2. Executar as migrações de cache de revisões
-- 3. Testar login com as credenciais demo
