-- =====================================================
-- API Usage Tracking - Admin Dashboard
-- Criado em: 2026-01-06
-- Descrição: Tabela para trackear todas as chamadas de API externa
--            (SUIV, etc) para controle de custos e analytics
-- =====================================================

-- =====================================================
-- 1. Criar tabela de logs de uso de API
-- =====================================================

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Usuário que fez a chamada
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  workshop_id UUID REFERENCES workshops(id) ON DELETE SET NULL,

  -- Detalhes da chamada
  api_name TEXT NOT NULL, -- 'suiv', 'fipe', etc
  endpoint TEXT NOT NULL, -- '/api/v4/VehicleInfo/byplate', '/api/v4/RevisionPlan', etc
  method TEXT DEFAULT 'GET',

  -- Resultado
  success BOOLEAN DEFAULT true,
  response_time_ms INTEGER, -- tempo de resposta em milissegundos
  status_code INTEGER, -- HTTP status code
  error_message TEXT,

  -- Metadados úteis
  request_params JSONB, -- parâmetros enviados (plate, makerId, etc)
  metadata JSONB, -- informações extras (ex: país, região, etc)

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_workshop_id ON api_usage_logs(workshop_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_api_name ON api_usage_logs(api_name);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_success ON api_usage_logs(success);

-- Índice composto para queries comuns (analytics por período)
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_date_api ON api_usage_logs(created_at DESC, api_name);

-- Comentários
COMMENT ON TABLE api_usage_logs IS 'Logs de todas as chamadas de API externa para controle de custos e analytics';
COMMENT ON COLUMN api_usage_logs.api_name IS 'Nome da API: suiv, fipe, etc';
COMMENT ON COLUMN api_usage_logs.endpoint IS 'Endpoint chamado na API';
COMMENT ON COLUMN api_usage_logs.response_time_ms IS 'Tempo de resposta em milissegundos';
COMMENT ON COLUMN api_usage_logs.request_params IS 'Parâmetros enviados na requisição (JSON)';

-- =====================================================
-- 2. RLS (Row Level Security)
-- =====================================================

ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver os logs
CREATE POLICY "Admins can view all API usage logs"
  ON api_usage_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Service role pode inserir (para logging automático)
CREATE POLICY "Service role can insert API logs"
  ON api_usage_logs FOR INSERT
  WITH CHECK (true);

-- Usuários podem ver seus próprios logs (opcional)
CREATE POLICY "Users can view their own API logs"
  ON api_usage_logs FOR SELECT
  USING (
    user_id = auth.uid() OR workshop_id IN (
      SELECT id FROM workshops WHERE owner_id = auth.uid()
    )
  );
