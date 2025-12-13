-- Adiciona coluna year_fab (ano de fabricação) na tabela vehicles
-- Permite armazenar tanto ano de fabricação quanto ano modelo separadamente
-- Exemplo: Ano fabricação 2018 / Ano modelo 2019

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS year_fab integer;

-- Atualiza registros existentes para ter year_fab igual ao year (assumindo que year é year_model)
UPDATE vehicles SET year_fab = year WHERE year_fab IS NULL;

-- Adiciona comentário na coluna para documentação
COMMENT ON COLUMN vehicles.year_fab IS 'Ano de fabricação do veículo';
COMMENT ON COLUMN vehicles.year IS 'Ano modelo do veículo';
