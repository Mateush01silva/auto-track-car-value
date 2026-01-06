-- =====================================================
-- Atualização: Custo correto da API SUIV
-- Data: 2026-01-06
-- Descrição: Ajusta custo de R$ 0,015 para R$ 1,10 por chamada
-- =====================================================

-- =====================================================
-- Recriar view de uso mensal com custo correto
-- =====================================================

CREATE OR REPLACE VIEW admin_api_usage_monthly AS
SELECT
  DATE_TRUNC('month', created_at) as month,
  api_name,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE success = true) as successful_calls,
  COUNT(*) FILTER (WHERE success = false) as failed_calls,
  ROUND(AVG(response_time_ms)) as avg_response_time_ms,

  -- Estimativa de custo CORRIGIDA
  -- R$ 1,10 por chamada SUIV = 110 centavos
  -- Apenas endpoints que geram custo real:
  -- - /api/v4/VehicleInfo/byplate
  -- - /api/v4/RevisionPlan
  CASE
    WHEN api_name = 'suiv' THEN
      COUNT(*) FILTER (
        WHERE endpoint IN ('/api/v4/VehicleInfo/byplate', '/api/v4/RevisionPlan')
      ) * 110  -- R$ 1,10 = 110 centavos
    ELSE 0
  END as estimated_cost_cents
FROM api_usage_logs
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at), api_name
ORDER BY month DESC, total_calls DESC;

COMMENT ON VIEW admin_api_usage_monthly IS 'Uso de API por mês com estimativa de custos (R$ 1,10 por chamada de VehicleInfo e RevisionPlan)';

-- =====================================================
-- Nova view: Chamadas que geram custo real
-- =====================================================

CREATE OR REPLACE VIEW admin_billable_api_calls AS
SELECT
  DATE(created_at) as date,
  endpoint,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE success = true) as successful_calls,
  COUNT(*) FILTER (WHERE success = false) as failed_calls,
  ROUND(AVG(response_time_ms)) as avg_response_time_ms,
  COUNT(*) * 110 as cost_cents  -- R$ 1,10 por chamada
FROM api_usage_logs
WHERE
  api_name = 'suiv'
  AND endpoint IN ('/api/v4/VehicleInfo/byplate', '/api/v4/RevisionPlan')
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), endpoint
ORDER BY date DESC;

COMMENT ON VIEW admin_billable_api_calls IS 'Apenas chamadas que geram custo real (VehicleInfo e RevisionPlan) - R$ 1,10 cada';

-- =====================================================
-- View atualizada: Overview com custos corretos
-- =====================================================

-- Adiciona contadores de chamadas billable ao overview
CREATE OR REPLACE VIEW admin_overview AS
SELECT
  -- Contadores gerais (mantidos)
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_last_30d,
  (SELECT COUNT(*) FROM workshops WHERE is_active = true) as active_workshops,
  (SELECT COUNT(*) FROM workshops) as total_workshops,
  (SELECT COUNT(*) FROM vehicles) as total_vehicles,
  (SELECT COUNT(*) FROM maintenances) as total_maintenances,
  (SELECT COUNT(*) FROM maintenances WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as maintenances_last_30d,

  -- Assinaturas por plano (mantidos)
  (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'free' AND status = 'active') as free_plans,
  (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'workshop_starter' AND status IN ('active', 'trialing')) as starter_plans,
  (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'workshop_professional' AND status IN ('active', 'trialing')) as professional_plans,
  (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'owner_pro' AND status IN ('active', 'trialing')) as owner_pro_plans,

  -- MRR/ARR (mantidos)
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

  -- Trials (mantidos)
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'trialing') as active_trials,
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'canceled' AND canceled_at >= CURRENT_DATE - INTERVAL '30 days') as cancellations_last_30d,

  -- NOVO: Estatísticas de API
  (
    SELECT COUNT(*)
    FROM api_usage_logs
    WHERE endpoint IN ('/api/v4/VehicleInfo/byplate', '/api/v4/RevisionPlan')
    AND created_at >= CURRENT_DATE - INTERVAL '30 days'
  ) as billable_api_calls_last_30d,

  (
    SELECT COUNT(*) * 110
    FROM api_usage_logs
    WHERE endpoint IN ('/api/v4/VehicleInfo/byplate', '/api/v4/RevisionPlan')
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
  ) as api_cost_current_month_cents;

COMMENT ON VIEW admin_overview IS 'Visão geral com KPIs principais + custos de API corrigidos (R$ 1,10/chamada)';
