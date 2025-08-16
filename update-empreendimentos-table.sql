-- Adicionar campos de aprovação e criador na tabela empreendimentos
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado'));
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS created_by_email TEXT;
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_empreendimentos_status ON empreendimentos(status);
CREATE INDEX IF NOT EXISTS idx_empreendimentos_created_by ON empreendimentos(created_by);

-- Atualizar políticas RLS para considerar o status
DROP POLICY IF EXISTS "Public read access" ON empreendimentos;
CREATE POLICY "Public read approved empreendimentos" ON empreendimentos 
  FOR SELECT USING (status = 'aprovado' OR auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND (user_profiles.role = 'superadmin' OR user_profiles.role = 'admin')
    )
  );

-- Política para criação - todos autenticados podem criar
DROP POLICY IF EXISTS "Authenticated users can insert" ON empreendimentos;
CREATE POLICY "Authenticated users can create" ON empreendimentos 
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    created_by = auth.uid() AND
    status = 'pendente'
  );

-- Política para atualização - apenas admin/superadmin ou criador
DROP POLICY IF EXISTS "Authenticated users can update" ON empreendimentos;
CREATE POLICY "Admin or owner can update" ON empreendimentos 
  FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND (user_profiles.role = 'superadmin' OR user_profiles.role = 'admin')
    )
  );

-- Função para aprovar empreendimento
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

-- Conceder permissão para executar a função
GRANT EXECUTE ON FUNCTION approve_empreendimento TO authenticated;

