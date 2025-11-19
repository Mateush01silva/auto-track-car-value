-- 🚀 SCRIPT COMPLETO DE DIAGNÓSTICO E CORREÇÃO
-- Execute este script NO SUPABASE SQL EDITOR antes de testar o pagamento

-- =============================================================================
-- PARTE 1: VERIFICAÇÃO DO AMBIENTE
-- =============================================================================

-- 1.1 Verificar se as colunas do Stripe existem
SELECT 'Verificando colunas do Stripe...' as step;

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('stripe_customer_id', 'stripe_subscription_id', 'trial_end', 'subscription_end', 'subscription_started_at')
ORDER BY column_name;

-- RESULTADO ESPERADO: 5 linhas
-- Se aparecer menos de 5 linhas, você precisa executar ADD_STRIPE_FIELDS.sql primeiro!

-- 1.2 Verificar subscription_status enum
SELECT 'Verificando enum subscription_status...' as step;

SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_status')
ORDER BY enumlabel;

-- RESULTADO ESPERADO: active, canceled, cancelled, expired, past_due

-- =============================================================================
-- PARTE 2: UPGRADE MANUAL DA SUA CONTA (EMERGENCIAL)
-- =============================================================================

SELECT 'Fazendo upgrade manual da sua conta...' as step;

-- 2.1 Verificar estado atual
SELECT
  au.email,
  p.subscription_plan,
  p.subscription_status,
  p.subscription_end,
  p.stripe_customer_id,
  p.stripe_subscription_id
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'silva.mateush01@gmail.com';

-- 2.2 FAZER O UPGRADE MANUAL
UPDATE profiles
SET
  subscription_plan = 'pro_monthly',
  subscription_status = 'active',
  subscription_end = NOW() + INTERVAL '1 month',
  subscription_started_at = NOW(),
  stripe_customer_id = 'cus_TRtHR967uVZdWy',
  stripe_subscription_id = 'sub_1SUzUyDxgvgb9mV6WTaTPLKE',
  trial_end = NULL  -- Encerrar trial
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'silva.mateush01@gmail.com'
);

-- 2.3 Verificar se funcionou
SELECT
  au.email,
  p.subscription_plan as plano,
  p.subscription_status as status,
  p.subscription_end as proxima_cobranca,
  p.stripe_customer_id IS NOT NULL as tem_customer_id,
  p.stripe_subscription_id IS NOT NULL as tem_subscription_id,
  p.trial_end IS NULL as trial_encerrado
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'silva.mateush01@gmail.com';

-- RESULTADO ESPERADO:
-- plano: pro_monthly
-- status: active
-- tem_customer_id: true
-- tem_subscription_id: true
-- trial_encerrado: true

-- =============================================================================
-- PARTE 3: LIMPEZA DE CONTAS DE TESTE (OPCIONAL)
-- =============================================================================

-- 3.1 Ver todas as contas (para limpar se necessário)
SELECT
  au.email,
  p.subscription_plan,
  p.subscription_status,
  p.created_at
FROM profiles p
JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC
LIMIT 10;

-- 3.2 Se quiser resetar uma conta de teste para trial (opcional):
/*
UPDATE profiles
SET
  subscription_plan = 'free_trial',
  subscription_status = 'active',
  subscription_end = NULL,
  subscription_started_at = NULL,
  stripe_customer_id = NULL,
  stripe_subscription_id = NULL,
  trial_end = NOW() + INTERVAL '90 days'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'email_de_teste@exemplo.com'
);
*/

-- =============================================================================
-- PARTE 4: VERIFICAÇÃO FINAL
-- =============================================================================

SELECT 'Verificação final...' as step;

-- 4.1 Contar usuários por plano
SELECT
  subscription_plan,
  subscription_status,
  COUNT(*) as total
FROM profiles
GROUP BY subscription_plan, subscription_status
ORDER BY subscription_plan, subscription_status;

-- 4.2 Ver usuários Pro
SELECT
  au.email,
  p.subscription_plan,
  p.subscription_status,
  p.subscription_end
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.subscription_plan IN ('pro_monthly', 'pro_yearly')
  AND p.subscription_status = 'active'
ORDER BY p.created_at DESC;

SELECT '✅ Script concluído! Recarregue o dashboard agora.' as resultado;
