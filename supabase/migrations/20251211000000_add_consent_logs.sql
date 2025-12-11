-- Migration: Adicionar tabela de logs de consentimento (LGPD)
-- Data: 2025-12-11
-- Descrição: Cria tabela para armazenar logs de consentimento de usuários
--            conforme exigências da LGPD

-- Criar tabela de logs de consentimento
CREATE TABLE IF NOT EXISTS consent_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL, -- 'cookies', 'marketing', 'data_sharing', 'terms'
  consent_data JSONB, -- Armazena detalhes do consentimento (ex: quais cookies foram aceitos)
  granted BOOLEAN DEFAULT true,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id ON consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_consent_type ON consent_logs(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_logs_created_at ON consent_logs(created_at);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_consent_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_consent_logs_updated_at
  BEFORE UPDATE ON consent_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_consent_logs_updated_at();

-- RLS (Row Level Security) Policies
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios consentimentos
CREATE POLICY "Users can view own consent logs"
  ON consent_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem inserir seus próprios consentimentos
CREATE POLICY "Users can insert own consent logs"
  ON consent_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Admins podem ver todos os consentimentos
CREATE POLICY "Admins can view all consent logs"
  ON consent_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Comentários para documentação
COMMENT ON TABLE consent_logs IS 'Armazena logs de consentimento de usuários para conformidade com LGPD';
COMMENT ON COLUMN consent_logs.user_id IS 'Referência ao usuário que deu o consentimento';
COMMENT ON COLUMN consent_logs.consent_type IS 'Tipo de consentimento: cookies, marketing, data_sharing, etc';
COMMENT ON COLUMN consent_logs.consent_data IS 'Dados detalhados do consentimento em formato JSON';
COMMENT ON COLUMN consent_logs.granted IS 'Se o consentimento foi concedido (true) ou revogado (false)';
COMMENT ON COLUMN consent_logs.ip_address IS 'Endereço IP do usuário no momento do consentimento';
COMMENT ON COLUMN consent_logs.user_agent IS 'User agent do navegador do usuário';
