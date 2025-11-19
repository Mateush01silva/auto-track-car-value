-- 🚨 UPGRADE MANUAL EMERGENCIAL
-- Execute no Supabase SQL Editor AGORA

-- Verificar seu usuário atual
SELECT
  id,
  email,
  subscription_plan,
  subscription_status
FROM auth.users
LEFT JOIN profiles ON auth.users.id = profiles.id
WHERE auth.users.email = 'silva.mateush01@gmail.com';

-- Fazer o upgrade manual para Pro (MENSAL)
UPDATE profiles
SET
  subscription_plan = 'pro_monthly',
  subscription_status = 'active',
  subscription_end = NOW() + INTERVAL '1 month',
  subscription_started_at = NOW(),
  stripe_customer_id = 'cus_TRtHR967uVZdWy',  -- Do evento que você me enviou
  stripe_subscription_id = 'sub_1SUzUyDxgvgb9mV6WTaTPLKE'  -- Do evento que você me enviou
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'silva.mateush01@gmail.com'
);

-- Verificar se funcionou
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
