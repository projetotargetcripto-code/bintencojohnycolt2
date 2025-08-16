-- CORRIGIR TABELA EMPREENDIMENTOS
-- Execute no SQL Editor do Supabase

-- Adicionar colunas que podem estar faltando
ALTER TABLE empreendimentos 
ADD COLUMN IF NOT EXISTS total_lotes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lotes_vendidos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS geojson_url TEXT,
ADD COLUMN IF NOT EXISTS masterplan_url TEXT,
ADD COLUMN IF NOT EXISTS bounds TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'empreendimentos' 
ORDER BY ordinal_position;

