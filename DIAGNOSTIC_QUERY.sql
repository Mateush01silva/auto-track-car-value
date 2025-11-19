-- 🔍 SCRIPT DE DIAGNÓSTICO
-- Execute este script no Supabase SQL Editor para verificar a configuração

-- 1. Verificar se as colunas do Stripe existem na tabela profiles
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('stripe_customer_id', 'stripe_subscription_id', 'trial_end', 'subscription_end')
ORDER BY column_name;

-- Resultado esperado: 4 linhas mostrando essas colunas
-- Se aparecer menos de 4 linhas, a migration não foi executada!

-- 2. Verificar subscription_status enum (deve ter canceled e past_due)
SELECT
  enumlabel as status_value
FROM pg_enum
WHERE enumtypid = (
  SELECT oid
  FROM pg_type
  WHERE typname = 'subscription_status'
)
ORDER BY enumlabel;

-- Resultado esperado: active, canceled, cancelled, expired, past_due

-- 3. Ver o perfil do usuário atual (substitua o email)
-- IMPORTANTE: Substitua 'SEU_EMAIL_AQUI' pelo email que você usou no teste
SELECT
  id,
  email,
  subscription_plan,
  subscription_status,
  stripe_customer_id,
  stripe_subscription_id,
  trial_end,
  subscription_end,
  subscription_started_at,
  is_admin
FROM auth.users
LEFT JOIN profiles ON auth.users.id = profiles.id
WHERE auth.users.email = 'SEU_EMAIL_AQUI';

-- Resultado esperado após pagamento bem-sucedido:
-- - subscription_plan: pro_monthly ou pro_yearly
-- - subscription_status: active
-- - stripe_customer_id: cus_xxxxx
-- - stripe_subscription_id: sub_xxxxx
-- - subscription_end: data futura

-- 4. Ver todos os perfis (para debug geral)
SELECT
  profiles.id,
  subscription_plan,
  subscription_status,
  stripe_customer_id,
  stripe_subscription_id,
  trial_end,
  subscription_end
FROM profiles
ORDER BY profiles.created_at DESC
LIMIT 5;
