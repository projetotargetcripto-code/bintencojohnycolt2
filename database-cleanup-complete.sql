-- ============================================
-- LIMPEZA E CORREÇÃO COMPLETA DO BANCO DE DADOS
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================

-- 1. REMOVER TABELAS REDUNDANTES/DESNECESSÁRIAS
-- =============================================
DROP TABLE IF EXISTS test_table CASCADE;
DROP TABLE IF EXISTS temp_uploads CASCADE; 
DROP TABLE IF EXISTS old_empreendimentos CASCADE;
DROP TABLE IF EXISTS backup_data CASCADE;
DROP TABLE IF EXISTS import_logs CASCADE;
DROP TABLE IF EXISTS temp_data CASCADE;
DROP TABLE IF EXISTS test_empreendimentos CASCADE;
DROP TABLE IF EXISTS sample_data CASCADE;

-- 2. ADICIONAR CAMPOS NECESSÁRIOS NA TABELA EMPREENDIMENTOS
-- =========================================================
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado'));
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS created_by_email TEXT;
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- ================================
CREATE INDEX IF NOT EXISTS idx_empreendimentos_status ON empreendimentos(status);
CREATE INDEX IF NOT EXISTS idx_empreendimentos_created_by ON empreendimentos(created_by);
CREATE INDEX IF NOT EXISTS idx_lotes_empreendimento ON lotes(empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_lotes_status ON lotes(status);
CREATE INDEX IF NOT EXISTS idx_overlays_empreendimento ON masterplan_overlays(empreendimento_id);

-- 4. ATUALIZAR POLÍTICAS RLS PARA EMPREENDIMENTOS
-- ==============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Public read access" ON empreendimentos;
DROP POLICY IF EXISTS "Authenticated users can insert" ON empreendimentos;
DROP POLICY IF EXISTS "Authenticated users can update" ON empreendimentos;
DROP POLICY IF EXISTS "Authenticated users can delete" ON empreendimentos;
DROP POLICY IF EXISTS "Public read approved empreendimentos" ON empreendimentos;
DROP POLICY IF EXISTS "Authenticated users can create" ON empreendimentos;
DROP POLICY IF EXISTS "Admin or owner can update" ON empreendimentos;

-- Criar novas políticas
CREATE POLICY "Public read approved empreendimentos" ON empreendimentos 
FOR SELECT USING (
  status = 'aprovado' OR 
  auth.uid() = created_by OR 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND (user_profiles.role = 'superadmin' OR user_profiles.role = 'admin')
  )
);

CREATE POLICY "Authenticated users can create" ON empreendimentos 
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  created_by = auth.uid() AND
  status = 'pendente'
);

CREATE POLICY "Admin or owner can update" ON empreendimentos 
FOR UPDATE USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND (user_profiles.role = 'superadmin' OR user_profiles.role = 'admin')
  )
);

CREATE POLICY "Admin can delete" ON empreendimentos 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND (user_profiles.role = 'superadmin' OR user_profiles.role = 'admin')
  )
);

-- 5. CRIAR/ATUALIZAR FUNÇÃO DE APROVAÇÃO
-- ====================================
CREATE OR REPLACE FUNCTION approve_empreendimento(
  p_empreendimento_id UUID,
  p_approved BOOLEAN DEFAULT TRUE,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Verificar se o usuário é admin ou superadmin
  SELECT role INTO v_user_role
  FROM user_profiles
  WHERE user_id = auth.uid();
  
  IF v_user_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Apenas administradores podem aprovar empreendimentos';
  END IF;
  
  -- Atualizar o status
  IF p_approved THEN
    UPDATE empreendimentos 
    SET 
      status = 'aprovado',
      approved_by = auth.uid(),
      approved_at = NOW(),
      rejection_reason = NULL
    WHERE id = p_empreendimento_id;
  ELSE
    UPDATE empreendimentos 
    SET 
      status = 'rejeitado',
      approved_by = auth.uid(),
      approved_at = NOW(),
      rejection_reason = p_rejection_reason
    WHERE id = p_empreendimento_id;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION approve_empreendimento TO authenticated;

-- 6. CORRIGIR POLÍTICAS DE STORAGE
-- ===============================

-- Remover políticas antigas de storage
DROP POLICY IF EXISTS "Allow all authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;

-- Criar políticas de storage simplificadas
CREATE POLICY "Allow all authenticated uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'empreendimentos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public read" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'empreendimentos');

CREATE POLICY "Allow authenticated updates" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'empreendimentos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated deletes" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'empreendimentos' AND auth.role() = 'authenticated');

-- 7. LIMPAR DADOS DE TESTE ANTIGOS
-- ===============================
DELETE FROM lotes WHERE codigo LIKE '%test%' OR codigo LIKE '%Test%' OR codigo LIKE '%TESTE%';
DELETE FROM empreendimentos WHERE nome LIKE '%test%' OR nome LIKE '%Test%' OR nome LIKE '%TESTE%' OR nome LIKE '%mock%';

-- 8. ATUALIZAR EMPREENDIMENTOS EXISTENTES PARA TER STATUS
-- ======================================================
UPDATE empreendimentos 
SET status = 'aprovado' 
WHERE status IS NULL;

-- 9. VERIFICAR ESTRUTURA FINAL
-- ===========================
SELECT 'Tabelas principais:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name IN ('empreendimentos', 'lotes', 'masterplan_overlays', 'user_profiles')
ORDER BY table_name;

SELECT 'Estatísticas:' as info;
SELECT 
  'empreendimentos' as tabela,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'pendente') as pendentes,
  COUNT(*) FILTER (WHERE status = 'aprovado') as aprovados,
  COUNT(*) FILTER (WHERE status = 'rejeitado') as rejeitados
FROM empreendimentos;

SELECT 
  'user_profiles' as tabela,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE role = 'superadmin') as superadmins,
  COUNT(*) FILTER (WHERE role = 'admin') as admins
FROM user_profiles;

-- ============================================
-- CONCLUSÃO
-- ============================================
SELECT '✅ Banco de dados limpo e configurado!' as status;
