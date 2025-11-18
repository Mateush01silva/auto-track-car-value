-- ============================================
-- Script para permitir visualização pública de relatórios
-- Execute este script no Supabase SQL Editor:
-- https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/sql/new
-- ============================================

-- Adicionar política de leitura pública para veículos
CREATE POLICY "Anyone can view vehicles for reports"
  ON public.vehicles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Adicionar política de leitura pública para manutenções
CREATE POLICY "Anyone can view maintenances for reports"
  ON public.maintenances FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================
-- O que isso faz:
-- - Permite que qualquer pessoa (logada ou não) possa VER veículos e manutenções
-- - Apenas leitura (SELECT) - não podem modificar, adicionar ou deletar
-- - As políticas de escrita/modificação continuam restritas aos donos
-- - Habilita o recurso de compartilhamento via QR Code
-- ============================================

-- Verificar se as políticas foram criadas (deve retornar 2 linhas)
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE policyname IN (
  'Anyone can view vehicles for reports',
  'Anyone can view maintenances for reports'
);
