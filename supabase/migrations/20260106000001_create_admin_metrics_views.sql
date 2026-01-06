-- =====================================================
-- Admin Dashboard - Views de Métricas
-- Criado em: 2026-01-06
-- Descrição: Views otimizadas para dashboard administrativo
--            com KPIs, MRR, contadores, e analytics
-- =====================================================

-- =====================================================
-- 1. View: Visão Geral (Overview KPIs)
-- =====================================================

CREATE OR REPLACE VIEW admin_overview AS
SELECT
  -- Contadores gerais
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_last_30d,
  (SELECT COUNT(*) FROM workshops WHERE is_active = true) as active_workshops,
  (SELECT COUNT(*) FROM workshops) as total_workshops,
  (SELECT COUNT(*) FROM vehicles) as total_vehicles,
  (SELECT COUNT(*) FROM maintenances) as total_maintenances,
  (SELECT COUNT(*) FROM maintenances WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as maintenances_last_30d,

  -- Assinaturas por plano
  (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'free' AND status = 'active') as free_plans,
  (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'workshop_starter' AND status IN ('active', 'trialing')) as starter_plans,
  (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'workshop_professional' AND status IN ('active', 'trialing')) as professional_plans,
  (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'owner_pro' AND status IN ('active', 'trialing')) as owner_pro_plans,

  -- MRR (Monthly Recurring Revenue) em centavos
  (
    (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'workshop_starter' AND status = 'active') * 11490 +
    (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'workshop_professional' AND status = 'active') * 21990 +
    (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'owner_pro' AND status = 'active') * 590
  ) as mrr_cents,

  -- ARR (Annual Recurring Revenue) em centavos
  (
    (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'workshop_starter' AND status = 'active') * 11490 * 12 +
    (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'workshop_professional' AND status = 'active') * 21990 * 12 +
    (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'owner_pro' AND status = 'active') * 590 * 12
  ) as arr_cents,

  -- Trials ativos
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'trialing') as active_trials,

  -- Cancelamentos (últimos 30 dias)
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'canceled' AND canceled_at >= CURRENT_DATE - INTERVAL '30 days') as cancellations_last_30d;

COMMENT ON VIEW admin_overview IS 'Visão geral com KPIs principais do negócio';

-- =====================================================
-- 2. View: Crescimento por Período (Growth Metrics)
-- =====================================================

CREATE OR REPLACE VIEW admin_growth_by_week AS
SELECT
  DATE_TRUNC('week', created_at) as week_start,
  COUNT(*) as new_users,
  COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', created_at)) as users_this_week
FROM profiles
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week_start DESC;

COMMENT ON VIEW admin_growth_by_week IS 'Crescimento de usuários por semana (últimos 90 dias)';

-- =====================================================
-- 3. View: Uso de API por Dia (API Usage Analytics)
-- =====================================================

CREATE OR REPLACE VIEW admin_api_usage_daily AS
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
GROUP BY DATE(created_at), api_name, endpoint
ORDER BY date DESC, total_calls DESC;

COMMENT ON VIEW admin_api_usage_daily IS 'Uso de API por dia com estatísticas de performance';

-- =====================================================
-- 4. View: Resumo de API por Mês (para cálculo de custo)
-- =====================================================

CREATE OR REPLACE VIEW admin_api_usage_monthly AS
SELECT
  DATE_TRUNC('month', created_at) as month,
  api_name,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE success = true) as successful_calls,
  COUNT(*) FILTER (WHERE success = false) as failed_calls,
  ROUND(AVG(response_time_ms)) as avg_response_time_ms,

  -- Estimativa de custo (assumindo R$ 0.015 por chamada SUIV)
  -- Ajustar valor conforme seu plano
  CASE
    WHEN api_name = 'suiv' THEN COUNT(*) * 1.5 -- R$ 0.015 = 1.5 centavos
    ELSE 0
  END as estimated_cost_cents
FROM api_usage_logs
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at), api_name
ORDER BY month DESC, total_calls DESC;

COMMENT ON VIEW admin_api_usage_monthly IS 'Uso de API por mês com estimativa de custos';

-- =====================================================
-- 5. View: Top Usuários por Uso de API
-- =====================================================

CREATE OR REPLACE VIEW admin_top_api_users AS
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
GROUP BY p.full_name, p.email, w.name
ORDER BY total_api_calls DESC
LIMIT 50;

COMMENT ON VIEW admin_top_api_users IS 'Top 50 usuários por chamadas de API (últimos 30 dias)';

-- =====================================================
-- 6. View: Distribuição de Assinaturas (Subscription Distribution)
-- =====================================================

CREATE OR REPLACE VIEW admin_subscription_distribution AS
SELECT
  s.plan_id,
  s.status,
  COUNT(*) as count,

  -- Valor mensal gerado por este grupo
  CASE s.plan_id
    WHEN 'workshop_starter' THEN COUNT(*) * 11490
    WHEN 'workshop_professional' THEN COUNT(*) * 21990
    WHEN 'owner_pro' THEN COUNT(*) * 590
    ELSE 0
  END as monthly_revenue_cents,

  -- Média de uso mensal
  ROUND(AVG(s.monthly_usage)) as avg_monthly_usage,
  MAX(s.monthly_usage) as max_monthly_usage
FROM subscriptions s
GROUP BY s.plan_id, s.status
ORDER BY monthly_revenue_cents DESC;

COMMENT ON VIEW admin_subscription_distribution IS 'Distribuição de assinaturas por plano e status com receita';

-- =====================================================
-- 7. View: Conversão de Trial (Trial Conversion)
-- =====================================================

CREATE OR REPLACE VIEW admin_trial_conversion AS
SELECT
  DATE_TRUNC('month', s.created_at) as signup_month,
  s.plan_id,

  COUNT(*) as total_trials,
  COUNT(*) FILTER (WHERE s.status = 'active') as converted_to_active,
  COUNT(*) FILTER (WHERE s.status = 'canceled') as canceled,
  COUNT(*) FILTER (WHERE s.status = 'trialing') as still_trialing,

  -- Taxa de conversão (percentual)
  CASE
    WHEN COUNT(*) > 0 THEN
      ROUND((COUNT(*) FILTER (WHERE s.status = 'active')::NUMERIC / COUNT(*)) * 100, 2)
    ELSE 0
  END as conversion_rate_percent
FROM subscriptions s
WHERE s.trial_start IS NOT NULL
  AND s.created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', s.created_at), s.plan_id
ORDER BY signup_month DESC;

COMMENT ON VIEW admin_trial_conversion IS 'Taxa de conversão de trial para assinatura paga';

-- =====================================================
-- 8. View: Manutenções por Oficina (Workshop Performance)
-- =====================================================

CREATE OR REPLACE VIEW admin_workshop_performance AS
SELECT
  w.id,
  w.name,
  w.plan,
  w.subscription_status,
  w.created_at as joined_at,

  -- Contadores
  COUNT(DISTINCT wm.maintenance_id) as total_maintenances,
  COUNT(DISTINCT m.vehicle_id) as unique_vehicles,

  -- Últimas atividades
  MAX(m.created_at) as last_maintenance_date,

  -- Média por mês (desde criação)
  CASE
    WHEN EXTRACT(MONTH FROM AGE(CURRENT_DATE, w.created_at)) > 0 THEN
      ROUND(COUNT(DISTINCT wm.maintenance_id)::NUMERIC / EXTRACT(MONTH FROM AGE(CURRENT_DATE, w.created_at)), 1)
    ELSE 0
  END as avg_maintenances_per_month
FROM workshops w
LEFT JOIN workshop_maintenances wm ON wm.workshop_id = w.id
LEFT JOIN maintenances m ON m.id = wm.maintenance_id
WHERE w.is_active = true
GROUP BY w.id, w.name, w.plan, w.subscription_status, w.created_at
ORDER BY total_maintenances DESC;

COMMENT ON VIEW admin_workshop_performance IS 'Performance das oficinas com estatísticas de uso';

-- =====================================================
-- 9. Função Helper: MRR por período customizado
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_mrr_at_date(target_date DATE)
RETURNS TABLE(
  date DATE,
  mrr_cents BIGINT,
  arr_cents BIGINT,
  active_subscriptions INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    target_date,
    (
      (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'workshop_starter' AND status = 'active' AND current_period_start <= target_date) * 11490 +
      (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'workshop_professional' AND status = 'active' AND current_period_start <= target_date) * 21990 +
      (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'owner_pro' AND status = 'active' AND current_period_start <= target_date) * 590
    )::BIGINT as mrr_cents,
    (
      (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'workshop_starter' AND status = 'active' AND current_period_start <= target_date) * 11490 * 12 +
      (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'workshop_professional' AND status = 'active' AND current_period_start <= target_date) * 21990 * 12 +
      (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'owner_pro' AND status = 'active' AND current_period_start <= target_date) * 590 * 12
    )::BIGINT as arr_cents,
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND current_period_start <= target_date)::INTEGER as active_subscriptions;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_mrr_at_date IS 'Calcula MRR/ARR em uma data específica (para análise histórica)';
