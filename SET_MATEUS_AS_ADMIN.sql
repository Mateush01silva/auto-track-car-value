-- ============================================
-- Script para tornar silva.mateush01@gmail.com administrador
-- ============================================
-- Execute este script no Supabase SQL Editor:
-- https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/sql/new
-- ============================================

-- Passo 1: Criar a coluna is_admin se não existir
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Passo 2: Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- Passo 3: Adicionar comentário na coluna
COMMENT ON COLUMN public.profiles.is_admin IS 'Flag to identify admin users who can bypass subscription restrictions';

-- Passo 4: Marcar silva.mateush01@gmail.com como administrador
UPDATE public.profiles
SET is_admin = true
WHERE email = 'silva.mateush01@gmail.com';

-- Passo 5: Verificar se funcionou (retorna os dados do admin)
SELECT
  id,
  email,
  is_admin,
  subscription_plan,
  subscription_status,
  created_at
FROM public.profiles
WHERE email = 'silva.mateush01@gmail.com';

-- ============================================
-- Resultado esperado:
-- is_admin deve ser: true
-- ============================================
