-- =====================================================
-- Correção de Segurança: Adicionar RLS às Views Admin
-- Data: 2026-01-07
-- Issue: Supabase Security Advisor - SECURITY DEFINER Views
-- =====================================================
--
-- PROBLEMA:
-- As views admin têm SECURITY DEFINER mas não têm RLS,
-- permitindo que qualquer usuário autenticado acesse
-- dados administrativos sensíveis.
--
-- SOLUÇÃO:
-- 1. Remover SECURITY DEFINER (não é necessário para views)
-- 2. Habilitar RLS nas views
-- 3. Adicionar política que permite apenas admins
-- =====================================================

-- =====================================================
-- Passo 1: Recriar views SEM SECURITY DEFINER
-- =====================================================

-- Nota: No PostgreSQL, views não podem ter RLS diretamente
-- A solução correta é garantir que as tabelas base tenham RLS
-- E criar uma política que verifica is_admin

-- =====================================================
-- Passo 2: Criar função helper para verificar admin
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
$$;

COMMENT ON FUNCTION public.is_admin IS 'Verifica se o usuário atual é admin';

-- =====================================================
-- Passo 3: Recriar views com filtro de admin
-- =====================================================

-- Para proteger as views, vamos adicionar um WHERE clause
-- que retorna dados vazios se o usuário não for admin

-- View: admin_overview
DROP VIEW IF EXISTS admin_overview CASCADE;
CREATE VIEW admin_overview AS
SELECT
  -- Contadores gerais
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_last_30d,
  (SELECT COUNT(*) FROM workshops WHERE is_active = true) as active_workshops,
  (SELECT COUNT(*) FROM workshops) as total_workshops,
  (SELECT COUNT(*) FROM vehicles) as total_vehicles,
  (SELECT COUNT(*) FROM maintenances) as total_maintenances,
  (SELECT COUNT(*) FROM maintenances WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as maintenances_last_30d,

  -- Assinaturas
  (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'free' AND status = 'active') as free_plans,
  (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'workshop_starter' AND status IN ('active', 'trialing')) as starter_plans,
  (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'workshop_professional' AND status IN ('active', 'trialing')) as professional_plans,
  (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'owner_pro' AND status IN ('active', 'trialing')) as owner_pro_plans,

  -- MRR/ARR
  (
    (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'workshop_starter' AND status = 'active') * 11490 +
    (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'workshop_professional' AND status = 'active') * 21990 +
    (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'owner_pro' AND status = 'active') * 590
  ) as mrr_cents,
  (
    (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'workshop_starter' AND status = 'active') * 11490 * 12 +
    (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'workshop_professional' AND status = 'active') * 21990 * 12 +
    (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'owner_pro' AND status = 'active') * 590 * 12
  ) as arr_cents,

  -- Trials
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'trialing') as active_trials,
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'canceled' AND canceled_at >= CURRENT_DATE - INTERVAL '30 days') as cancellations_last_30d,

  -- API metrics
  (
    SELECT COUNT(DISTINCT request_params->>'plate')
    FROM api_usage_logs
    WHERE endpoint IN ('/api/v4/VehicleInfo/byplate', '/api/v4/RevisionPlan')
      AND created_at >= CURRENT_DATE - INTERVAL '30 days'
  ) as billable_api_calls_last_30d,
  (
    SELECT COUNT(DISTINCT request_params->>'plate') * 110
    FROM api_usage_logs
    WHERE endpoint IN ('/api/v4/VehicleInfo/byplate', '/api/v4/RevisionPlan')
      AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
  ) as api_cost_current_month_cents
WHERE public.is_admin() = true; -- PROTEÇÃO: Só retorna dados para admins

COMMENT ON VIEW admin_overview IS 'Visão geral - PROTEGIDA: apenas admins';

-- View: admin_growth_by_week
DROP VIEW IF EXISTS admin_growth_by_week CASCADE;
CREATE VIEW admin_growth_by_week AS
SELECT
  DATE_TRUNC('week', created_at) as week_start,
  COUNT(*) as new_users,
  COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', created_at)) as users_this_week
FROM profiles
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
  AND public.is_admin() = true -- PROTEÇÃO
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week_start DESC;

COMMENT ON VIEW admin_growth_by_week IS 'Crescimento semanal - PROTEGIDA: apenas admins';

-- View: admin_api_usage_daily
DROP VIEW IF EXISTS admin_api_usage_daily CASCADE;
CREATE VIEW admin_api_usage_daily AS
SELECT
  DATE(created_at) as date,
  api_name,
  endpoint,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE success = true) as successful_calls,
  COUNT(*) FILTER (WHERE success = false) as failed_calls,
  ROUND(AVG(response_time_ms)) as avg_response_time_ms,
  MAX(response_time_ms) as max_response_time_ms,
  MIN(response_time_ms) as min_response_time_ms
FROM api_usage_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND public.is_admin() = true -- PROTEÇÃO
GROUP BY DATE(created_at), api_name, endpoint
ORDER BY date DESC, total_calls DESC;

COMMENT ON VIEW admin_api_usage_daily IS 'Uso diário de API - PROTEGIDA: apenas admins';

-- View: admin_api_usage_monthly
DROP VIEW IF EXISTS admin_api_usage_monthly CASCADE;
CREATE VIEW admin_api_usage_monthly AS
SELECT
  DATE_TRUNC('month', created_at) as month,
  api_name,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE success = true) as successful_calls,
  COUNT(*) FILTER (WHERE success = false) as failed_calls,
  ROUND(AVG(response_time_ms)) as avg_response_time_ms,
  CASE
    WHEN api_name = 'suiv' THEN
      COUNT(DISTINCT request_params->>'plate') FILTER (
        WHERE endpoint IN ('/api/v4/VehicleInfo/byplate', '/api/v4/RevisionPlan')
      ) * 110
    ELSE 0
  END as estimated_cost_cents
FROM api_usage_logs
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '12 months'
  AND public.is_admin() = true -- PROTEÇÃO
GROUP BY DATE_TRUNC('month', created_at), api_name
ORDER BY month DESC, total_calls DESC;

COMMENT ON VIEW admin_api_usage_monthly IS 'Uso mensal de API - PROTEGIDA: apenas admins';

-- View: admin_billable_api_calls
DROP VIEW IF EXISTS admin_billable_api_calls CASCADE;
CREATE VIEW admin_billable_api_calls AS
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT request_params->>'plate') as unique_vehicles,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE success = true) as successful_calls,
  COUNT(*) FILTER (WHERE success = false) as failed_calls,
  ROUND(AVG(response_time_ms)) as avg_response_time_ms,
  COUNT(DISTINCT request_params->>'plate') * 110 as cost_cents
FROM api_usage_logs
WHERE api_name = 'suiv'
  AND endpoint IN ('/api/v4/VehicleInfo/byplate', '/api/v4/RevisionPlan')
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND public.is_admin() = true -- PROTEÇÃO
GROUP BY DATE(created_at)
ORDER BY date DESC;

COMMENT ON VIEW admin_billable_api_calls IS 'Chamadas billable - PROTEGIDA: apenas admins';

-- View: admin_top_api_users
DROP VIEW IF EXISTS admin_top_api_users CASCADE;
CREATE VIEW admin_top_api_users AS
SELECT
  COALESCE(p.full_name, p.email, 'Usuário sem nome') as user_name,
  p.email,
  w.name as workshop_name,
  COUNT(*) as total_api_calls,
  COUNT(*) FILTER (WHERE a.success = true) as successful_calls,
  COUNT(*) FILTER (WHERE a.success = false) as failed_calls,
  MAX(a.created_at) as last_api_call
FROM api_usage_logs a
LEFT JOIN profiles p ON p.id = a.user_id
LEFT JOIN workshops w ON w.id = a.workshop_id
WHERE a.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND public.is_admin() = true -- PROTEÇÃO
GROUP BY p.full_name, p.email, w.name
ORDER BY total_api_calls DESC
LIMIT 50;

COMMENT ON VIEW admin_top_api_users IS 'Top usuários API - PROTEGIDA: apenas admins';

-- View: admin_subscription_distribution
DROP VIEW IF EXISTS admin_subscription_distribution CASCADE;
CREATE VIEW admin_subscription_distribution AS
SELECT
  s.plan_id,
  s.status,
  COUNT(*) as count,
  CASE s.plan_id
    WHEN 'workshop_starter' THEN COUNT(*) * 11490
    WHEN 'workshop_professional' THEN COUNT(*) * 21990
    WHEN 'owner_pro' THEN COUNT(*) * 590
    ELSE 0
  END as monthly_revenue_cents,
  ROUND(AVG(s.monthly_usage)) as avg_monthly_usage,
  MAX(s.monthly_usage) as max_monthly_usage
FROM subscriptions s
WHERE public.is_admin() = true -- PROTEÇÃO
GROUP BY s.plan_id, s.status
ORDER BY monthly_revenue_cents DESC;

COMMENT ON VIEW admin_subscription_distribution IS 'Distribuição de assinaturas - PROTEGIDA: apenas admins';

-- View: admin_trial_conversion
DROP VIEW IF EXISTS admin_trial_conversion CASCADE;
CREATE VIEW admin_trial_conversion AS
SELECT
  DATE_TRUNC('month', s.created_at) as signup_month,
  s.plan_id,
  COUNT(*) as total_trials,
  COUNT(*) FILTER (WHERE s.status = 'active') as converted_to_active,
  COUNT(*) FILTER (WHERE s.status = 'canceled') as canceled,
  COUNT(*) FILTER (WHERE s.status = 'trialing') as still_trialing,
  CASE
    WHEN COUNT(*) > 0 THEN
      ROUND((COUNT(*) FILTER (WHERE s.status = 'active')::NUMERIC / COUNT(*)) * 100, 2)
    ELSE 0
  END as conversion_rate_percent
FROM subscriptions s
WHERE s.trial_start IS NOT NULL
  AND s.created_at >= CURRENT_DATE - INTERVAL '12 months'
  AND public.is_admin() = true -- PROTEÇÃO
GROUP BY DATE_TRUNC('month', s.created_at), s.plan_id
ORDER BY signup_month DESC;

COMMENT ON VIEW admin_trial_conversion IS 'Conversão de trials - PROTEGIDA: apenas admins';

-- View: admin_workshop_performance
DROP VIEW IF EXISTS admin_workshop_performance CASCADE;
CREATE VIEW admin_workshop_performance AS
SELECT
  w.id,
  w.name,
  w.plan,
  w.subscription_status,
  w.created_at as joined_at,
  COUNT(DISTINCT wm.maintenance_id) as total_maintenances,
  COUNT(DISTINCT m.vehicle_id) as unique_vehicles,
  MAX(m.created_at) as last_maintenance_date,
  CASE
    WHEN EXTRACT(MONTH FROM AGE(CURRENT_DATE, w.created_at)) > 0 THEN
      ROUND(COUNT(DISTINCT wm.maintenance_id)::NUMERIC / EXTRACT(MONTH FROM AGE(CURRENT_DATE, w.created_at)), 1)
    ELSE 0
  END as avg_maintenances_per_month
FROM workshops w
LEFT JOIN workshop_maintenances wm ON wm.workshop_id = w.id
LEFT JOIN maintenances m ON m.id = wm.maintenance_id
WHERE w.is_active = true
  AND public.is_admin() = true -- PROTEÇÃO
GROUP BY w.id, w.name, w.plan, w.subscription_status, w.created_at
ORDER BY total_maintenances DESC;

COMMENT ON VIEW admin_workshop_performance IS 'Performance de oficinas - PROTEGIDA: apenas admins';

-- View: user_subscription_details (essa também precisa de proteção)
DROP VIEW IF EXISTS user_subscription_details CASCADE;
CREATE VIEW user_subscription_details AS
SELECT
  p.id as user_id,
  p.email,
  p.full_name,
  s.plan_id,
  s.status,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  s.current_period_start,
  s.current_period_end,
  s.trial_end,
  s.monthly_usage,
  s.usage_reset_at,
  s.cancel_at_period_end,
  -- Campos calculados
  CASE
    WHEN s.plan_id = 'free' THEN 10
    WHEN s.plan_id = 'workshop_starter' THEN 100
    ELSE NULL
  END as usage_limit,
  CASE
    WHEN s.trial_end IS NOT NULL AND s.trial_end > now()
    THEN EXTRACT(DAY FROM (s.trial_end - now()))
    ELSE 0
  END as trial_days_remaining,
  CASE
    WHEN s.plan_id IN ('workshop_professional', 'owner_pro') THEN true
    ELSE false
  END as is_premium
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.id
-- PROTEÇÃO: Usuário só vê seus próprios dados OU admin vê tudo
WHERE p.id = auth.uid() OR public.is_admin() = true;

COMMENT ON VIEW user_subscription_details IS 'Detalhes de assinatura - PROTEGIDA: usuário próprio ou admin';

-- =====================================================
-- Passo 4: Instruções para remover SECURITY DEFINER
-- =====================================================

-- IMPORTANTE: Se as views ainda tiverem SECURITY DEFINER no Supabase,
-- você precisa executar manualmente no SQL Editor do Supabase:
--
-- Para cada view, execute:
-- ALTER VIEW <nome_da_view> OWNER TO postgres;
--
-- Exemplo:
-- ALTER VIEW admin_overview OWNER TO postgres;
-- ALTER VIEW admin_growth_by_week OWNER TO postgres;
-- etc...
--
-- Isso remove o SECURITY DEFINER implícito.

-- =====================================================
-- CONCLUSÃO
-- =====================================================
-- Esta migration adiciona proteção em nível de view
-- garantindo que apenas usuários admin possam acessar
-- dados administrativos sensíveis, mesmo que façam
-- queries diretas via API do Supabase.
-- =====================================================
