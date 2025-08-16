-- ============================================
-- CONFIGURAÇÃO DO STORAGE PARA BLOCKURB
-- Execute no SQL Editor após criar o bucket
-- ============================================

-- POLÍTICAS PARA O BUCKET 'empreendimentos'
-- ==========================================

-- 1. Permitir upload para usuários autenticados
CREATE POLICY "Authenticated users can upload files" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'empreendimentos' AND 
  auth.role() = 'authenticated'
);

-- 2. Permitir leitura pública de todos os arquivos
CREATE POLICY "Public can view files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'empreendimentos');

-- 3. Permitir update/delete apenas para usuários autenticados
CREATE POLICY "Authenticated users can update files" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'empreendimentos' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete files" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'empreendimentos' AND 
  auth.role() = 'authenticated'
);

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Listar políticas criadas
SELECT * FROM pg_policies WHERE schemaname = 'storage';

