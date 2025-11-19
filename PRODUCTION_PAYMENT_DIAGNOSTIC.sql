-- 🔍 DIAGNÓSTICO DE PAGAMENTO REAL
-- Execute este script no Supabase SQL Editor

-- 1. Ver todos os perfis e status de assinatura
SELECT
  profiles.id,
  profiles.created_at,
  subscription_plan,
  subscription_status,
  stripe_customer_id,
  stripe_subscription_id,
  trial_end,
  subscription_end,
  subscription_started_at
FROM profiles
ORDER BY profiles.created_at DESC
LIMIT 10;

-- Resultado esperado:
-- Se stripe_customer_id e stripe_subscription_id estão NULL = webhook não funcionou
-- Se estão preenchidos mas subscription_plan ainda é "free_trial" = problema no webhook

-- 2. Verificar se as colunas existem
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('stripe_customer_id', 'stripe_subscription_id', 'trial_end', 'subscription_end', 'subscription_started_at')
ORDER BY column_name;

-- Se retornar menos de 5 linhas = precisa executar ADD_STRIPE_FIELDS.sql

-- 3. Forçar upgrade manual do último usuário (EMERGÊNCIA)
-- CUIDADO: Use apenas se o webhook não estiver funcionando
-- Substitua o email do usuário que pagou

/*
UPDATE profiles
SET
  subscription_plan = 'pro_monthly',  -- ou 'pro_yearly'
  subscription_status = 'active',
  subscription_end = NOW() + INTERVAL '1 month',  -- ou '1 year' para anual
  subscription_started_at = NOW()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'EMAIL_DO_USUARIO_QUE_PAGOU'
);
*/

-- 4. Verificar resultado
SELECT
  au.email,
  p.subscription_plan,
  p.subscription_status,
  p.subscription_end,
  p.stripe_customer_id IS NOT NULL as has_stripe_customer,
  p.stripe_subscription_id IS NOT NULL as has_stripe_subscription
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'EMAIL_DO_USUARIO_QUE_PAGOU';
