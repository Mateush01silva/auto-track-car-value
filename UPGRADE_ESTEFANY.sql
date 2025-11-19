-- 🚨 UPGRADE MANUAL DA CONTA: estefany.silva23@gmail.com
-- Execute no Supabase SQL Editor AGORA

-- 1. Ver o último pagamento no Stripe para pegar os IDs
-- Vá em: Stripe Dashboard > Payments > Procure por estefany.silva23@gmail.com
-- Copie: Customer ID (cus_...) e Subscription ID (sub_...)

-- 2. Execute este UPDATE (substitua os valores se necessário):
UPDATE profiles
SET
  subscription_plan = 'pro_monthly',  -- ou 'pro_yearly' se pagou anual
  subscription_status = 'active',
  subscription_end = NOW() + INTERVAL '1 month',  -- ou '1 year' se anual
  subscription_started_at = NOW(),
  trial_end = NULL
  -- stripe_customer_id = 'COLE_AQUI_O_CUSTOMER_ID',  -- descomente e cole o ID
  -- stripe_subscription_id = 'COLE_AQUI_O_SUBSCRIPTION_ID'  -- descomente e cole o ID
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'estefany.silva23@gmail.com'
);

-- 3. Verificar se funcionou
SELECT
  au.email,
  p.subscription_plan,
  p.subscription_status,
  p.subscription_end,
  p.stripe_customer_id,
  p.stripe_subscription_id
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'estefany.silva23@gmail.com';

-- RESULTADO ESPERADO:
-- subscription_plan: pro_monthly (ou pro_yearly)
-- subscription_status: active
-- subscription_end: data futura
