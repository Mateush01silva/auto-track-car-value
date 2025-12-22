-- =====================================================
-- MIGRATIONS CRM FEATURES
-- Cards: #9 (Aniversários), #10 (Notas), #13 (Tags)
-- =====================================================

-- =====================================================
-- CARD #9: ALERTAS DE ANIVERSÁRIO
-- =====================================================

-- Adicionar campo birth_date na tabela profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Criar índice para consultas rápidas de aniversariantes do mês
CREATE INDEX IF NOT EXISTS idx_profiles_birth_month
ON profiles (EXTRACT(MONTH FROM birth_date), EXTRACT(DAY FROM birth_date))
WHERE birth_date IS NOT NULL;

COMMENT ON COLUMN profiles.birth_date IS 'Data de nascimento do cliente para alertas de aniversário';

-- =====================================================
-- CARD #10: HISTÓRICO DE NOTAS/INTERAÇÕES
-- =====================================================

-- Criar tabela customer_notes
CREATE TABLE IF NOT EXISTS customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT note_text_not_empty CHECK (length(trim(note_text)) > 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer
ON customer_notes(customer_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_notes_workshop
ON customer_notes(workshop_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_notes_created_by
ON customer_notes(created_by);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_customer_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_notes_updated_at
  BEFORE UPDATE ON customer_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_notes_updated_at();

-- Comentários
COMMENT ON TABLE customer_notes IS 'Histórico de notas e interações com clientes (Card #10)';
COMMENT ON COLUMN customer_notes.customer_user_id IS 'ID do cliente (profile) sobre quem a nota foi feita';
COMMENT ON COLUMN customer_notes.workshop_id IS 'ID da oficina que criou a nota';
COMMENT ON COLUMN customer_notes.created_by IS 'ID do usuário (profile) que criou a nota';

-- =====================================================
-- CARD #13: TAGS PERSONALIZÁVEIS
-- =====================================================

-- Criar tabela tags
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- Hex color code
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT tag_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT tag_color_valid CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT unique_tag_per_workshop UNIQUE (workshop_id, name)
);

-- Criar tabela customer_tags (relacionamento muitos-para-muitos)
CREATE TABLE IF NOT EXISTS customer_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_customer_tag UNIQUE (customer_user_id, tag_id, workshop_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tags_workshop
ON tags(workshop_id, name);

CREATE INDEX IF NOT EXISTS idx_customer_tags_customer
ON customer_tags(customer_user_id);

CREATE INDEX IF NOT EXISTS idx_customer_tags_tag
ON customer_tags(tag_id);

CREATE INDEX IF NOT EXISTS idx_customer_tags_workshop
ON customer_tags(workshop_id);

-- Comentários
COMMENT ON TABLE tags IS 'Tags personalizáveis criadas pelas oficinas (Card #13)';
COMMENT ON TABLE customer_tags IS 'Relacionamento entre clientes e tags';
COMMENT ON COLUMN tags.color IS 'Cor em hexadecimal para a tag (ex: #3B82F6)';

-- =====================================================
-- RLS (Row Level Security) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;

-- Policies for customer_notes
CREATE POLICY "Workshop can view their customer notes"
  ON customer_notes FOR SELECT
  USING (
    workshop_id IN (
      SELECT id FROM workshops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Workshop can create customer notes"
  ON customer_notes FOR INSERT
  WITH CHECK (
    workshop_id IN (
      SELECT id FROM workshops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Only creator can update their notes"
  ON customer_notes FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Only creator can delete their notes"
  ON customer_notes FOR DELETE
  USING (created_by = auth.uid());

-- Policies for tags
CREATE POLICY "Workshop can view their tags"
  ON tags FOR SELECT
  USING (
    workshop_id IN (
      SELECT id FROM workshops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Workshop can create tags"
  ON tags FOR INSERT
  WITH CHECK (
    workshop_id IN (
      SELECT id FROM workshops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Workshop can update their tags"
  ON tags FOR UPDATE
  USING (
    workshop_id IN (
      SELECT id FROM workshops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Workshop can delete their tags"
  ON tags FOR DELETE
  USING (
    workshop_id IN (
      SELECT id FROM workshops WHERE owner_id = auth.uid()
    )
  );

-- Policies for customer_tags
CREATE POLICY "Workshop can view their customer tags"
  ON customer_tags FOR SELECT
  USING (
    workshop_id IN (
      SELECT id FROM workshops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Workshop can create customer tags"
  ON customer_tags FOR INSERT
  WITH CHECK (
    workshop_id IN (
      SELECT id FROM workshops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Workshop can delete customer tags"
  ON customer_tags FOR DELETE
  USING (
    workshop_id IN (
      SELECT id FROM workshops WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- SAMPLE DATA (opcional - comentado)
-- =====================================================

-- Exemplos de tags padrão (descomente se quiser criar para todas as oficinas)
-- INSERT INTO tags (workshop_id, name, color)
-- SELECT id, 'VIP', '#FFD700' FROM workshops
-- ON CONFLICT (workshop_id, name) DO NOTHING;
--
-- INSERT INTO tags (workshop_id, name, color)
-- SELECT id, 'Frota', '#3B82F6' FROM workshops
-- ON CONFLICT (workshop_id, name) DO NOTHING;
--
-- INSERT INTO tags (workshop_id, name, color)
-- SELECT id, 'Pagamento à Vista', '#10B981' FROM workshops
-- ON CONFLICT (workshop_id, name) DO NOTHING;
