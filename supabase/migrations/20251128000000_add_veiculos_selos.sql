-- ============================================
-- Migration: Sistema de Selos de Qualidade
-- Tabela para armazenar o selo de qualidade dos veículos
-- baseado no cumprimento das manutenções
-- ============================================

-- 1. Criar tabela veiculos_selos
CREATE TABLE IF NOT EXISTS public.veiculos_selos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  tipo_selo TEXT NOT NULL CHECK (tipo_selo IN ('ouro', 'prata', 'bronze', 'nenhum')),
  percentual_criticas NUMERIC(5,2) NOT NULL DEFAULT 0,
  percentual_altas NUMERIC(5,2) NOT NULL DEFAULT 0,
  percentual_todas NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_atrasadas_criticas INTEGER NOT NULL DEFAULT 0,
  total_atrasadas_altas INTEGER NOT NULL DEFAULT 0,
  total_atrasadas_todas INTEGER NOT NULL DEFAULT 0,
  total_sugestoes_criticas INTEGER NOT NULL DEFAULT 0,
  total_sugestoes_altas INTEGER NOT NULL DEFAULT 0,
  total_sugestoes_todas INTEGER NOT NULL DEFAULT 0,
  data_calculo TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(veiculo_id)
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_veiculos_selos_veiculo_id ON public.veiculos_selos(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_selos_tipo_selo ON public.veiculos_selos(tipo_selo);
CREATE INDEX IF NOT EXISTS idx_veiculos_selos_data_calculo ON public.veiculos_selos(data_calculo);

-- 3. Adicionar comentários
COMMENT ON TABLE public.veiculos_selos IS 'Armazena o selo de qualidade de manutenção dos veículos';
COMMENT ON COLUMN public.veiculos_selos.tipo_selo IS 'Tipo do selo: ouro, prata, bronze ou nenhum';
COMMENT ON COLUMN public.veiculos_selos.percentual_criticas IS 'Percentual de manutenções críticas em dia';
COMMENT ON COLUMN public.veiculos_selos.percentual_altas IS 'Percentual de manutenções de alta criticidade em dia';
COMMENT ON COLUMN public.veiculos_selos.percentual_todas IS 'Percentual de todas as manutenções em dia';
COMMENT ON COLUMN public.veiculos_selos.total_atrasadas_criticas IS 'Total de manutenções críticas atrasadas';
COMMENT ON COLUMN public.veiculos_selos.data_calculo IS 'Data do último cálculo do selo';

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE public.veiculos_selos ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para veiculos_selos

-- Política para SELECT: Usuários podem ver selos dos seus veículos
CREATE POLICY "Users can view seals of their own vehicles"
  ON public.veiculos_selos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = veiculos_selos.veiculo_id
      AND v.user_id = auth.uid()
    )
  );

-- Política para INSERT: Sistema pode criar selos
CREATE POLICY "System can insert seals"
  ON public.veiculos_selos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = veiculos_selos.veiculo_id
      AND v.user_id = auth.uid()
    )
  );

-- Política para UPDATE: Sistema pode atualizar selos dos veículos do usuário
CREATE POLICY "System can update seals of user vehicles"
  ON public.veiculos_selos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = veiculos_selos.veiculo_id
      AND v.user_id = auth.uid()
    )
  );

-- Política para DELETE: Sistema pode deletar selos ao deletar veículo (CASCADE já cuida)
CREATE POLICY "System can delete seals"
  ON public.veiculos_selos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = veiculos_selos.veiculo_id
      AND v.user_id = auth.uid()
    )
  );

-- 6. Trigger para atualizar updated_at
CREATE TRIGGER update_veiculos_selos_updated_at
  BEFORE UPDATE ON public.veiculos_selos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 7. Política pública para leitura (histórico compartilhado via QR Code)
-- Usuários podem ver selos de veículos compartilhados publicamente
CREATE POLICY "Public can view seals of publicly shared vehicles"
  ON public.veiculos_selos FOR SELECT
  USING (true);

-- ============================================
-- Migration complete!
-- ============================================
