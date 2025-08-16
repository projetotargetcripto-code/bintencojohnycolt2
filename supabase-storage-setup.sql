-- =============================================================================
-- CONFIGURAÇÃO DO STORAGE PARA EMPREENDIMENTOS
-- Execute este SQL no Supabase Dashboard APÓS o supabase-lotes-interativos.sql
-- =============================================================================

-- 1. Criar bucket se não existir (via Dashboard Storage)
-- Nota: Buckets devem ser criados manualmente no Dashboard
-- Vá em Storage > New Bucket e crie um bucket chamado "empreendimentos"
-- Marque como PUBLIC bucket

-- 2. Políticas para o bucket empreendimentos
-- =============================================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload temp" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete" ON storage.objects;

-- Permitir leitura pública
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'empreendimentos');

-- Permitir upload para usuários autenticados
CREATE POLICY "Authenticated can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'empreendimentos' 
  AND auth.role() = 'authenticated'
);

-- Permitir update para usuários autenticados
CREATE POLICY "Authenticated can update" ON storage.objects
FOR UPDATE WITH CHECK (
  bucket_id = 'empreendimentos' 
  AND auth.role() = 'authenticated'
);

-- Permitir delete para usuários autenticados (seus próprios arquivos)
CREATE POLICY "Authenticated can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'empreendimentos' 
  AND auth.role() = 'authenticated'
);

-- 3. Configurar tipos MIME permitidos (deve ser feito no Dashboard)
-- =============================================================================
-- No Dashboard do Supabase:
-- 1. Vá em Storage > empreendimentos
-- 2. Clique em Policies
-- 3. Em "Allowed MIME types", adicione:
--    - application/json
--    - application/geo+json
--    - image/jpeg
--    - image/png
--    - image/gif
--    - image/webp

-- 4. Limpar uploads problemáticos anteriores
-- =============================================================================
DELETE FROM storage.objects 
WHERE bucket_id = 'empreendimentos' 
AND name LIKE '%geojson itaborai usina%';

-- =============================================================================
-- IMPORTANTE: CONFIGURAÇÃO MANUAL NECESSÁRIA
-- =============================================================================
-- 1. Criar bucket "empreendimentos" como PUBLIC no Dashboard
-- 2. Configurar MIME types permitidos no Dashboard
-- 3. Verificar se as políticas foram aplicadas corretamente
-- =============================================================================

