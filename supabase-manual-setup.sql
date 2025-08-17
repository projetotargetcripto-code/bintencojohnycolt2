-- =============================================================================
-- CONFIGURAÇÃO MANUAL PARA SUPABASE - COLE NO SQL EDITOR
-- =============================================================================

-- 1. POLÍTICAS DE STORAGE
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow all uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow all updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes" ON storage.objects;

-- Permitir leitura pública
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'empreendimentos');

-- Permitir upload para todos
CREATE POLICY "Allow all uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'empreendimentos');

-- Permitir update para todos
CREATE POLICY "Allow all updates" ON storage.objects
FOR UPDATE WITH CHECK (bucket_id = 'empreendimentos');

-- Permitir delete para todos
CREATE POLICY "Allow all deletes" ON storage.objects
FOR DELETE USING (bucket_id = 'empreendimentos');

-- =============================================================================
-- FIM - Execute este SQL no Supabase Dashboard
-- =============================================================================
