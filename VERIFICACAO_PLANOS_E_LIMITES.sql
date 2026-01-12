-- ============================================
-- SCRIPT DE VERIFICAÇÃO DE PLANOS E LIMITES
-- Vybo - Stripe Integration
-- ============================================

-- Execute estas queries no Supabase SQL Editor para verificar
-- se as travas de funcionalidades estão corretas

-- ============================================
-- 1. VERIFICAR ESTRUTURA DA TABELA SUBSCRIPTIONS
-- ============================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Resultado esperado:
-- Deve ter colunas: id, user_id, plan_id, stripe_customer_id,
-- stripe_subscription_id, status, trial_start, trial_end,
-- monthly_usage, usage_reset_at, etc.

-- ============================================
-- 2. VERIFICAR PLANOS ATIVOS NO SISTEMA
-- ============================================

SELECT
  plan_id,
  status,
  COUNT(*) as total_usuarios,
  SUM(CASE WHEN status = 'trialing' THEN 1 ELSE 0 END) as em_trial,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as ativos,
  AVG(monthly_usage) as uso_medio_mensal
FROM subscriptions
GROUP BY plan_id, status
ORDER BY plan_id;

-- Resultado esperado:
-- Deve mostrar quantos usuários existem em cada plano
-- e quantos estão em trial vs ativos

-- ============================================
-- 3. VERIFICAR TRIALS E DATAS DE EXPIRAÇÃO
-- ============================================

SELECT
  s.id,
  p.email,
  p.role,
  s.plan_id,
  s.status,
  s.trial_start,
  s.trial_end,
  CASE
    WHEN s.trial_end IS NULL THEN 'Sem trial'
    WHEN s.trial_end < NOW() THEN 'Trial expirado'
    ELSE CONCAT(
      EXTRACT(DAY FROM (s.trial_end - NOW())),
      ' dias restantes'
    )
  END as status_trial,
  s.current_period_end,
  s.monthly_usage
FROM subscriptions s
JOIN profiles p ON p.id = s.user_id
WHERE s.status IN ('active', 'trialing')
ORDER BY s.trial_end ASC NULLS LAST;

-- Resultado esperado:
-- Oficinas: 14 dias de trial
-- Proprietários Pro: 30 dias de trial

-- ============================================
-- 4. VERIFICAR LIMITES DE USO MENSAL
-- ============================================

-- Oficinas com Starter (limite 100/mês)
SELECT
  p.email,
  s.plan_id,
  s.monthly_usage,
  CASE
    WHEN s.plan_id = 'workshop_starter' THEN 100
    ELSE NULL
  END as limite,
  CASE
    WHEN s.plan_id = 'workshop_starter' AND s.monthly_usage >= 100
      THEN '🚨 LIMITE ATINGIDO'
    WHEN s.plan_id = 'workshop_starter' AND s.monthly_usage >= 70
      THEN '⚠️ Próximo do limite (70%+)'
    ELSE '✅ Dentro do limite'
  END as status_uso
FROM subscriptions s
JOIN profiles p ON p.id = s.user_id
WHERE s.plan_id = 'workshop_starter'
  AND s.status IN ('active', 'trialing')
ORDER BY s.monthly_usage DESC;

-- ============================================
-- 5. VERIFICAR FUNCIONALIDADE: can_create_more()
-- ============================================

-- Esta função deve retornar se o usuário pode criar mais atendimentos/veículos

-- Teste 1: Usuário free (limite 10)
-- Substitua 'USER_ID_AQUI' por um ID real de teste
DO $$
DECLARE
  result JSONB;
BEGIN
  -- Simular usuário free que já tem 10 atendimentos
  SELECT can_create_more(
    'USER_ID_FREE_AQUI',  -- Substitua
    'workshop'
  ) INTO result;

  RAISE NOTICE 'Resultado para usuário FREE com 10+ atendimentos: %', result;
  -- Esperado: { "allowed": false, "reason": "Limite de 10 atingido..." }
END $$;

-- Teste 2: Usuário Starter (limite 100)
DO $$
DECLARE
  result JSONB;
BEGIN
  SELECT can_create_more(
    'USER_ID_STARTER_AQUI',  -- Substitua
    'workshop'
  ) INTO result;

  RAISE NOTICE 'Resultado para usuário STARTER: %', result;
  -- Esperado: { "allowed": true } se < 100
END $$;

-- ============================================
-- 6. VERIFICAR RESET AUTOMÁTICO DE USO MENSAL
-- ============================================

-- Ver usuários que precisam de reset (usage_reset_at passou)
SELECT
  p.email,
  s.plan_id,
  s.monthly_usage,
  s.usage_reset_at,
  NOW() as data_atual,
  CASE
    WHEN s.usage_reset_at < NOW() THEN '🔄 Precisa resetar'
    ELSE '✅ OK'
  END as status_reset
FROM subscriptions s
JOIN profiles p ON p.id = s.user_id
WHERE s.status IN ('active', 'trialing')
ORDER BY s.usage_reset_at;

-- ============================================
-- 7. VERIFICAR TRAVAS DE FUNCIONALIDADES POR PLANO
-- ============================================

-- Esta query mostra quais recursos cada usuário tem acesso
SELECT
  p.email,
  p.role,
  s.plan_id,
  s.status,

  -- Limites de uso
  CASE
    WHEN p.role = 'workshop' AND s.plan_id IS NULL THEN '10 atendimentos/mês'
    WHEN s.plan_id = 'workshop_starter' THEN '100 atendimentos/mês'
    WHEN s.plan_id = 'workshop_professional' THEN 'Ilimitado'
    WHEN p.role = 'owner' AND s.plan_id IS NULL THEN '1 veículo'
    WHEN s.plan_id = 'owner_pro' THEN 'Ilimitado'
    ELSE 'N/A'
  END as limite_uso,

  -- Acesso a recursos avançados
  CASE
    WHEN s.plan_id = 'workshop_professional' THEN 'Sim'
    ELSE 'Não'
  END as tem_oportunidades,

  CASE
    WHEN s.plan_id = 'workshop_professional' THEN 'Sim'
    ELSE 'Não'
  END as tem_score_fidelidade,

  CASE
    WHEN s.plan_id IN ('workshop_starter', 'workshop_professional') THEN 'Sim'
    WHEN s.plan_id = 'owner_pro' THEN 'Sim'
    ELSE 'Não'
  END as tem_busca_por_placa,

  CASE
    WHEN s.plan_id = 'owner_pro' THEN 'Sim'
    ELSE 'Não'
  END as tem_alertas_inteligentes,

  -- Formatos de exportação
  CASE
    WHEN s.plan_id = 'workshop_professional' THEN 'CSV, Excel, PDF'
    WHEN s.plan_id = 'workshop_starter' THEN 'CSV'
    WHEN s.plan_id = 'owner_pro' THEN 'PDF, Excel'
    ELSE 'Nenhum'
  END as formatos_exportacao

FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.id
ORDER BY p.created_at DESC
LIMIT 20;

-- ============================================
-- 8. VERIFICAR INTEGRIDADE DOS DADOS STRIPE
-- ============================================

-- Verificar se todos os usuários pagos têm stripe_customer_id
SELECT
  p.email,
  s.plan_id,
  s.status,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  CASE
    WHEN s.stripe_customer_id IS NULL THEN '❌ SEM CUSTOMER ID'
    WHEN s.stripe_subscription_id IS NULL THEN '⚠️ SEM SUBSCRIPTION ID'
    ELSE '✅ OK'
  END as integridade_stripe
FROM subscriptions s
JOIN profiles p ON p.id = s.user_id
WHERE s.plan_id IN ('workshop_starter', 'workshop_professional', 'owner_pro')
ORDER BY s.created_at DESC;

-- ============================================
-- 9. TESTAR INCREMENTO DE USO MENSAL
-- ============================================

-- Esta função deve incrementar o contador quando um atendimento é criado
-- Teste manual (execute e depois reverta):

DO $$
DECLARE
  test_user_id UUID;
  usage_before INT;
  usage_after INT;
BEGIN
  -- Pegar um usuário de teste
  SELECT user_id INTO test_user_id
  FROM subscriptions
  WHERE plan_id = 'workshop_starter'
  LIMIT 1;

  -- Ver uso antes
  SELECT monthly_usage INTO usage_before
  FROM subscriptions
  WHERE user_id = test_user_id;

  RAISE NOTICE 'Uso ANTES: %', usage_before;

  -- Incrementar (simular criação de atendimento)
  PERFORM increment_monthly_usage(test_user_id);

  -- Ver uso depois
  SELECT monthly_usage INTO usage_after
  FROM subscriptions
  WHERE user_id = test_user_id;

  RAISE NOTICE 'Uso DEPOIS: %', usage_after;

  -- Reverter (para não afetar dados reais)
  UPDATE subscriptions
  SET monthly_usage = usage_before
  WHERE user_id = test_user_id;

  RAISE NOTICE 'Revertido para: %', usage_before;
END $$;

-- ============================================
-- 10. DASHBOARD DE MÉTRICAS DE ASSINATURAS
-- ============================================

-- Resumo geral do sistema de assinaturas
SELECT
  'Total de Usuários' as metrica,
  COUNT(*) as valor
FROM profiles

UNION ALL

SELECT
  'Usuários com Assinatura Paga',
  COUNT(*)
FROM subscriptions
WHERE plan_id IN ('workshop_starter', 'workshop_professional', 'owner_pro')
  AND status IN ('active', 'trialing')

UNION ALL

SELECT
  'Usuários em Trial',
  COUNT(*)
FROM subscriptions
WHERE status = 'trialing'

UNION ALL

SELECT
  'Revenue Mensal Estimado (R$)',
  ROUND(
    SUM(
      CASE
        WHEN plan_id = 'workshop_starter' THEN 114.90
        WHEN plan_id = 'workshop_professional' THEN 219.90
        WHEN plan_id = 'owner_pro' THEN 5.90
        ELSE 0
      END
    ),
    2
  )
FROM subscriptions
WHERE status = 'active'

UNION ALL

SELECT
  'Taxa de Conversão Trial → Pago (%)',
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'active') * 100.0) /
    NULLIF(COUNT(*) FILTER (WHERE status IN ('active', 'trialing')), 0),
    2
  )
FROM subscriptions
WHERE plan_id IN ('workshop_starter', 'workshop_professional', 'owner_pro');

-- ============================================
-- 11. VERIFICAR CANCELAMENTOS E CHURNING
-- ============================================

-- Usuários que cancelaram recentemente
SELECT
  p.email,
  p.role,
  s.plan_id,
  s.status,
  s.canceled_at,
  s.current_period_end,
  CASE
    WHEN s.cancel_at_period_end = TRUE
      THEN 'Vai cancelar no fim do período'
    WHEN s.status = 'canceled'
      THEN 'Cancelado'
    ELSE 'Ativo'
  END as status_cancelamento,
  EXTRACT(DAY FROM (NOW() - s.canceled_at)) as dias_desde_cancelamento
FROM subscriptions s
JOIN profiles p ON p.id = s.user_id
WHERE s.status = 'canceled'
   OR s.cancel_at_period_end = TRUE
ORDER BY s.canceled_at DESC;

-- ============================================
-- 12. VERIFICAR FEATURE FLAGS (APIs Pagas)
-- ============================================

-- Verificar quais usuários têm acesso a APIs pagas
-- (busca por placa e revisões do fabricante)

SELECT
  p.email,
  p.role,
  s.plan_id,
  CASE
    WHEN s.plan_id IN ('workshop_starter', 'workshop_professional', 'owner_pro')
      THEN '✅ API de Placa habilitada'
    ELSE '❌ API de Placa desabilitada (usa FIPE manual)'
  END as api_placa,
  CASE
    WHEN s.plan_id IN ('workshop_starter', 'workshop_professional', 'owner_pro')
      THEN '✅ Revisões do Fabricante habilitadas'
    ELSE '❌ Revisões genéricas (tabela hardcoded)'
  END as api_revisoes
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.id
WHERE p.role IN ('owner', 'workshop')
ORDER BY s.plan_id NULLS LAST;

-- ============================================
-- COMANDOS ÚTEIS PARA DEBUG
-- ============================================

-- Resetar uso mensal de um usuário específico (para testes)
-- UPDATE subscriptions
-- SET monthly_usage = 0,
--     usage_reset_at = NOW() + INTERVAL '1 month'
-- WHERE user_id = 'USER_ID_AQUI';

-- Simular fim de trial (para testar fluxo de conversão)
-- UPDATE subscriptions
-- SET trial_end = NOW() - INTERVAL '1 day',
--     status = 'active'
-- WHERE user_id = 'USER_ID_AQUI';

-- Dar upgrade manual para Professional (para testes)
-- UPDATE subscriptions
-- SET plan_id = 'workshop_professional',
--     monthly_usage = 0
-- WHERE user_id = 'USER_ID_AQUI';

-- ============================================
-- FIM DO SCRIPT DE VERIFICAÇÃO
-- ============================================

-- RESUMO:
-- ✅ Execute estas queries para verificar se:
--    1. Tabela de subscriptions está correta
--    2. Trials de 14/30 dias estão configurados
--    3. Limites de uso estão sendo respeitados
--    4. Feature flags estão funcionando
--    5. Dados do Stripe estão integrados
--    6. Cancelamentos estão sendo tratados
--
-- 📊 Use a query #10 (Dashboard de Métricas) para acompanhar
--    o crescimento do sistema de assinaturas
