-- =====================================================
-- MIGRATIONS STRIPE & SUBSCRIPTIONS
-- Cards: #2 (Webhooks), #3 (Limites), #4 (Features)
-- =====================================================

-- =====================================================
-- Tabela de Assinaturas
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Identificação do plano
  plan_id TEXT NOT NULL CHECK (plan_id IN ('free', 'workshop_starter', 'workshop_professional', 'owner_pro')),

  -- Dados do Stripe
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,

  -- Status da assinatura
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired')),

  -- Período atual
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 month'),

  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Cancelamento
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,

  -- Controle de uso (Card #3 - Limites)
  monthly_usage INTEGER NOT NULL DEFAULT 0,
  usage_reset_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);

-- Comentários
COMMENT ON TABLE subscriptions IS 'Assinaturas dos usuários com Stripe (Cards #2, #3, #4)';
COMMENT ON COLUMN subscriptions.plan_id IS 'ID do plano: free, workshop_starter, workshop_professional, owner_pro';
COMMENT ON COLUMN subscriptions.monthly_usage IS 'Contador de atendimentos/veículos no período atual';
COMMENT ON COLUMN subscriptions.usage_reset_at IS 'Data do próximo reset do contador (aniversário da assinatura)';

-- =====================================================
-- Trigger para atualizar updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- =====================================================
-- Função para resetar contador de uso mensal
-- =====================================================

CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  -- Reseta contador para assinaturas que passaram da data de reset
  UPDATE subscriptions
  SET
    monthly_usage = 0,
    usage_reset_at = usage_reset_at + interval '1 month'
  WHERE usage_reset_at <= now()
    AND status IN ('active', 'trialing');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Função para incrementar uso mensal
-- =====================================================

CREATE OR REPLACE FUNCTION increment_monthly_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_new_usage INTEGER;
BEGIN
  -- Primeiro, verifica se precisa resetar
  PERFORM reset_monthly_usage();

  -- Incrementa o uso
  UPDATE subscriptions
  SET monthly_usage = monthly_usage + 1
  WHERE user_id = p_user_id
  RETURNING monthly_usage INTO v_new_usage;

  RETURN COALESCE(v_new_usage, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Função para verificar se pode criar mais
-- =====================================================

CREATE OR REPLACE FUNCTION can_create_more(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan_id TEXT;
  v_monthly_usage INTEGER;
  v_limit INTEGER;
BEGIN
  -- Busca dados da assinatura
  SELECT plan_id, monthly_usage
  INTO v_plan_id, v_monthly_usage
  FROM subscriptions
  WHERE user_id = p_user_id;

  -- Se não tem assinatura, usa free tier (limite 10)
  IF v_plan_id IS NULL THEN
    v_plan_id := 'free';
    v_monthly_usage := 0;
  END IF;

  -- Define limites por plano
  v_limit := CASE v_plan_id
    WHEN 'free' THEN 10
    WHEN 'workshop_starter' THEN 100
    WHEN 'workshop_professional' THEN NULL -- ilimitado
    WHEN 'owner_pro' THEN NULL -- ilimitado
    ELSE 10
  END;

  -- Se é ilimitado, sempre pode
  IF v_limit IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Verifica se está abaixo do limite
  RETURN v_monthly_usage < v_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver sua própria assinatura
CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- Apenas o sistema pode criar/atualizar assinaturas (via service role)
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- Criar assinatura FREE para usuários existentes
-- =====================================================

-- Adiciona assinatura free para todos os usuários que ainda não têm
INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end, usage_reset_at)
SELECT
  p.id,
  'free',
  'active',
  now(),
  now() + interval '1 month',
  now() + interval '1 month'
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.id
WHERE s.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- Trigger para criar assinatura free em novos usuários
-- =====================================================

CREATE OR REPLACE FUNCTION create_free_subscription_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (
    user_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    usage_reset_at
  ) VALUES (
    NEW.id,
    'free',
    'active',
    now(),
    now() + interval '1 month',
    now() + interval '1 month'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_subscription_on_user_creation
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_free_subscription_for_new_user();

-- =====================================================
-- View para facilitar queries
-- =====================================================

CREATE OR REPLACE VIEW user_subscription_details AS
SELECT
  p.id as user_id,
  p.email,
  p.full_name,
  p.role,
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
    ELSE NULL -- ilimitado
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
LEFT JOIN subscriptions s ON s.user_id = p.id;

COMMENT ON VIEW user_subscription_details IS 'View com detalhes completos da assinatura + campos calculados';
