-- =====================================================
-- Correção: Erro de tipo de dado + Custo por veículo
-- Data: 2026-01-06
-- Descrição:
-- - Corrige erro 42P16 (tipo de dado da view)
-- - Ajusta para R$ 1,10 POR VEÍCULO (não por endpoint)
-- - Placa + Revisão do mesmo veículo = R$ 1,10 total
-- =====================================================

-- =====================================================
-- 1. Dropar views antigas para recriar com tipo correto
-- =====================================================

DROP VIEW IF EXISTS admin_api_usage_monthly CASCADE;
DROP VIEW IF EXISTS admin_billable_api_calls CASCADE;
DROP VIEW IF EXISTS admin_overview CASCADE;

-- =====================================================
-- 2. Recriar view: Uso mensal com custo por VEÍCULO
-- =====================================================

-- A lógica agora é: agrupar por placa/veículo
-- Se consultou VehicleInfo + RevisionPlan para a mesma placa = R$ 1,10 (não R$ 2,20)

CREATE OR REPLACE VIEW admin_api_usage_monthly AS
SELECT
  DATE_TRUNC('month', created_at) as month,
  api_name,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE success = true) as successful_calls,
  COUNT(*) FILTER (WHERE success = false) as failed_calls,
  ROUND(AVG(response_time_ms)) as avg_response_time_ms,

  -- Estimativa de custo CORRIGIDA: R$ 1,10 por veículo consultado
  -- Conta veículos únicos (baseado na placa no request_params)
  CASE
    WHEN api_name = 'suiv' THEN
      (
        SELECT COUNT(DISTINCT request_params->>'plate')
        FROM api_usage_logs l2
        WHERE l2.api_name = 'suiv'
          AND l2.endpoint IN ('/api/v4/VehicleInfo/byplate', '/api/v4/RevisionPlan')
          AND DATE_TRUNC('month', l2.created_at) = DATE_TRUNC('month', api_usage_logs.created_at)
      ) * 110  -- R$ 1,10 por veículo único = 110 centavos
    ELSE 0
  END as estimated_cost_cents
FROM api_usage_logs
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at), api_name
ORDER BY month DESC, total_calls DESC;

COMMENT ON VIEW admin_api_usage_monthly IS 'Uso de API por mês - R$ 1,10 por VEÍCULO consultado (placa + revisões)';

-- =====================================================
-- 3. Recriar view: Chamadas billable (veículos únicos)
-- =====================================================

CREATE OR REPLACE VIEW admin_billable_api_calls AS
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT request_params->>'plate') as unique_vehicles,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE success = true) as successful_calls,
  COUNT(*) FILTER (WHERE success = false) as failed_calls,
  ROUND(AVG(response_time_ms)) as avg_response_time_ms,
  -- R$ 1,10 por veículo único consultado
  COUNT(DISTINCT request_params->>'plate') * 110 as cost_cents
FROM api_usage_logs
WHERE
  api_name = 'suiv'
  AND endpoint IN ('/api/v4/VehicleInfo/byplate', '/api/v4/RevisionPlan')
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

COMMENT ON VIEW admin_billable_api_calls IS 'Veículos únicos consultados por dia - R$ 1,10 por veículo (placa + revisões)';

-- =====================================================
-- 4. Recriar view: Overview com métricas corretas
-- =====================================================

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

  -- API: VEÍCULOS ÚNICOS consultados (não total de chamadas)
  (
    SELECT COUNT(DISTINCT request_params->>'plate')
    FROM api_usage_logs
    WHERE endpoint IN ('/api/v4/VehicleInfo/byplate', '/api/v4/RevisionPlan')
    AND created_at >= CURRENT_DATE - INTERVAL '30 days'
  ) as billable_api_calls_last_30d,

  -- Custo do mês atual: veículos únicos × R$ 1,10
  (
    SELECT COUNT(DISTINCT request_params->>'plate') * 110
    FROM api_usage_logs
    WHERE endpoint IN ('/api/v4/VehicleInfo/byplate', '/api/v4/RevisionPlan')
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
  ) as api_cost_current_month_cents;

COMMENT ON VIEW admin_overview IS 'Visão geral - R$ 1,10 por VEÍCULO consultado (placa + revisões)';
