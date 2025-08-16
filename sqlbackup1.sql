-- BlockURB DATABASE BACKUP V2 - ESTRUTURA COM TRIGGER DE ROLES
-- Data: 15/08/2024
-- Este script limpa e recria completamente a estrutura do banco de dados.
-- Contém a lógica de trigger para sincronizar o 'role' do usuário com o app_metadata de auth.users.

-- ================================================================================================
-- SEÇÃO 0: LIMPEZA COMPLETA (AÇÃO DESTRUTIVA)
-- ================================================================================================

-- APAGA TODAS AS TABELAS E FUNÇÕES DO SCHEMA PÚBLICO
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- RECONCEDE PERMISSÕES BÁSICAS AO NOVO SCHEMA PÚBLICO
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- ESVAZIA O BUCKET DE ARMAZENAMENTO DE ARQUIVOS (SE EXISTIR)
DELETE FROM storage.objects WHERE bucket_id = 'empreendimentos';


-- ================================================================================================
-- SEÇÃO 1: EXTENSÕES E CONFIGURAÇÕES INICIAIS
-- ================================================================================================

-- Habilita a funcionalidade de geoprocessamento
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;


-- ================================================================================================
-- SEÇÃO 2: TABELA DE FILIAIS
-- ================================================================================================

CREATE TABLE public.filiais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ================================================================================================
-- SEÇÃO 3: TABELA DE PERFIS DE USUÁRIO (user_profiles) - VERSÃO CORRIGIDA
-- ================================================================================================

CREATE TABLE public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE, -- Coluna essencial adicionada para busca de perfil
    full_name TEXT,
    role TEXT NOT NULL, -- Armazena 'superadmin', 'adminfilial', etc.
    panels TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    filial_id UUID NOT NULL REFERENCES public.filiais(id),
    updated_at TIMESTAMPTZ DEFAULT now()
);


-- ================================================================================================
-- SEÇÃO 4: TABELA DE EMPREENDIMENTOS
-- ================================================================================================

CREATE TABLE public.empreendimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    total_lotes INT DEFAULT 0,
    bounds JSONB,
    geojson_url TEXT,
    masterplan_url TEXT,
    filial_id UUID NOT NULL REFERENCES public.filiais(id) ON DELETE CASCADE,
    -- Metadados de auditoria
    created_by UUID,
    created_by_email TEXT,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


-- ================================================================================================
-- SEÇÃO 5: TABELA DE LOTES
-- ================================================================================================

CREATE TABLE public.lotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    numero INT,
    status TEXT NOT NULL DEFAULT 'disponivel',
    area_m2 NUMERIC(10, 2),
    perimetro_m NUMERIC(10, 2),
    area_hectares NUMERIC(12, 4),
    valor NUMERIC(12, 2) DEFAULT 0.00,
    geometria JSONB,
    geom extensions.geometry(Polygon, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_lotes_geom ON public.lotes USING gist (geom);


-- ================================================================================================
-- SEÇÃO 6: FUNÇÕES DO BANCO DE DADOS (RPCs) - VERSÃO CORRIGIDA
-- ================================================================================================

-- Remove versões antigas das funções para garantir uma recriação limpa
DROP FUNCTION IF EXISTS public.process_geojson_lotes(uuid, jsonb, text);
DROP FUNCTION IF EXISTS public.update_lote_status(uuid, text);
DROP FUNCTION IF EXISTS public.update_lote_status(uuid, text, text, text, numeric);
DROP FUNCTION IF EXISTS public.update_lote_valor(uuid, numeric);
DROP FUNCTION IF EXISTS public.lotes_geojson(uuid);
DROP FUNCTION IF EXISTS public.get_my_filial_id();
DROP FUNCTION IF EXISTS public.set_user_role_from_profile(); -- Função do novo trigger
DROP FUNCTION IF EXISTS public.approve_empreendimento(uuid, boolean, text);
DROP FUNCTION IF EXISTS public.admin_update_user_role(uuid, text);
DROP FUNCTION IF EXISTS public.get_all_empreendimentos_overview();

-- Função para processar o GeoJSON e criar os lotes
CREATE OR REPLACE FUNCTION public.process_geojson_lotes(p_empreendimento_id uuid, p_geojson jsonb, p_empreendimento_nome text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    feature jsonb;
    lote_nome_original text;
    lote_numero int;
    lote_numero_text text;
    feature_geom geometry;
    a_m2 numeric;
    p_m numeric;
BEGIN
    FOR feature IN SELECT * FROM jsonb_array_elements(p_geojson->'features')
    LOOP
        lote_nome_original := feature->'properties'->>'Name';
        lote_numero_text := COALESCE(
          feature->'properties'->>'Numero',
          feature->'properties'->>'numero',
          feature->'properties'->>'num',
          feature->'properties'->>'Num',
          NULL
        );

        IF lote_numero_text ~ '^[0-9]+$' THEN
          lote_numero := lote_numero_text::int;
        ELSE
          SELECT NULLIF(SUBSTRING(COALESCE(lote_nome_original, '') FROM '\\d+'), '')::int INTO lote_numero;
        END IF;

        feature_geom := st_setsrid(st_geomfromgeojson(feature->>'geometry'), 4326);
        a_m2 := st_area(feature_geom::geography);
        p_m  := st_perimeter(feature_geom::geography);

        INSERT INTO public.lotes (
          empreendimento_id, nome, numero,
          geometria, geom,
          area_m2, perimetro_m, area_hectares, status
        )
        VALUES (
          p_empreendimento_id,
          COALESCE(lote_nome_original, 'Lote ' || COALESCE(lote_numero::text, 's/ nº')) || ' - ' || p_empreendimento_nome,
          lote_numero,
          feature,
          feature_geom,
          a_m2,
          p_m,
          (a_m2 / 10000.0),
          'disponivel'
        );
    END LOOP;
END;
$$;

-- Função para atualizar o status de um lote
CREATE OR REPLACE FUNCTION public.update_lote_status(p_lote_id uuid, p_novo_status text)
RETURNS void AS $$
BEGIN
    UPDATE public.lotes SET status = p_novo_status, updated_at = now() WHERE id = p_lote_id;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar o valor de um lote
CREATE OR REPLACE FUNCTION public.update_lote_valor(p_lote_id uuid, p_novo_valor numeric)
RETURNS void AS $$
BEGIN
    UPDATE public.lotes SET valor = p_novo_valor, updated_at = now() WHERE id = p_lote_id;
END;
$$ LANGUAGE plpgsql;

-- Função para retornar os lotes de um empreendimento como um GeoJSON
CREATE OR REPLACE FUNCTION public.lotes_geojson(p_empreendimento_id uuid)
RETURNS jsonb AS $$
BEGIN
  RETURN (SELECT jsonb_build_object('type', 'FeatureCollection', 'features', jsonb_agg(jsonb_build_object('type', 'Feature', 'id', l.id, 'geometry', l.geometria->'geometry', 'properties', jsonb_build_object('id', l.id, 'Name', l.nome, 'status', l.status)))) FROM public.lotes AS l WHERE l.empreendimento_id = p_empreendimento_id);
END;
$$ LANGUAGE plpgsql;

-- Concede permissão para usuários logados usarem as funções
GRANT EXECUTE ON FUNCTION public.process_geojson_lotes(uuid, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_lote_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_lote_valor(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lotes_geojson(uuid) TO authenticated;

-- Visão geral por filial: KPIs consolidados
DROP FUNCTION IF EXISTS public.get_filiais_overview();
CREATE OR REPLACE FUNCTION public.get_filiais_overview()
RETURNS TABLE (
  filial_id uuid,
  nome text,
  is_active boolean,
  total_empreendimentos int,
  total_lotes int,
  lotes_vendidos int,
  receita_total numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH emp AS (
    SELECT e.id, e.filial_id FROM public.empreendimentos e
  ),
  lot AS (
    SELECT l.empreendimento_id, COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE l.status = 'vendido')::int AS vendidos,
           COALESCE(SUM(CASE WHEN l.status = 'vendido' THEN l.valor END), 0) AS receita
    FROM public.lotes l
    GROUP BY l.empreendimento_id
  )
  SELECT f.id AS filial_id,
         f.nome,
         f.is_active,
         COALESCE(COUNT(DISTINCT emp.id), 0)::int AS total_empreendimentos,
         COALESCE(SUM(lot.total), 0)::int AS total_lotes,
         COALESCE(SUM(lot.vendidos), 0)::int AS lotes_vendidos,
         COALESCE(SUM(lot.receita), 0) AS receita_total
  FROM public.filiais f
  LEFT JOIN emp ON emp.filial_id = f.id
  LEFT JOIN lot ON lot.empreendimento_id = emp.id
  GROUP BY f.id, f.nome, f.is_active
  ORDER BY f.nome;
$$;

GRANT EXECUTE ON FUNCTION public.get_filiais_overview() TO authenticated;

-- Empreendimentos de uma filial com métricas
DROP FUNCTION IF EXISTS public.get_filial_empreendimentos(uuid);
CREATE OR REPLACE FUNCTION public.get_filial_empreendimentos(p_filial_id uuid)
RETURNS TABLE (
  empreendimento_id uuid,
  nome text,
  status text,
  total_lotes int,
  lotes_vendidos int,
  receita_total numeric,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id,
         e.nome,
         e.status,
         COALESCE(t.total,0)::int AS total_lotes,
         COALESCE(v.vendidos,0)::int AS lotes_vendidos,
         COALESCE(r.receita,0) AS receita_total,
         e.created_at
  FROM public.empreendimentos e
  LEFT JOIN (
    SELECT empreendimento_id, COUNT(*)::int AS total
    FROM public.lotes GROUP BY empreendimento_id
  ) t ON t.empreendimento_id = e.id
  LEFT JOIN (
    SELECT empreendimento_id, COUNT(*)::int AS vendidos
    FROM public.lotes WHERE status = 'vendido' GROUP BY empreendimento_id
  ) v ON v.empreendimento_id = e.id
  LEFT JOIN (
    SELECT empreendimento_id, COALESCE(SUM(valor),0) AS receita
    FROM public.lotes WHERE status = 'vendido' GROUP BY empreendimento_id
  ) r ON r.empreendimento_id = e.id
  WHERE e.filial_id = p_filial_id
  ORDER BY e.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_filial_empreendimentos(uuid) TO authenticated;

-- Usuários de uma filial
DROP FUNCTION IF EXISTS public.get_filial_users(uuid);
CREATE OR REPLACE FUNCTION public.get_filial_users(p_filial_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  role text,
  is_active boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.user_id, up.full_name, up.email, up.role, up.is_active
  FROM public.user_profiles up
  WHERE up.filial_id = p_filial_id
  ORDER BY up.full_name NULLS LAST, up.email;
$$;

GRANT EXECUTE ON FUNCTION public.get_filial_users(uuid) TO authenticated;

-- Transferir empreendimento entre filiais
DROP FUNCTION IF EXISTS public.transfer_empreendimento_filial(uuid, uuid);
CREATE OR REPLACE FUNCTION public.transfer_empreendimento_filial(
  p_empreendimento_id uuid,
  p_filial_destino uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.empreendimentos
  SET filial_id = p_filial_destino, updated_at = now()
  WHERE id = p_empreendimento_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.transfer_empreendimento_filial(uuid, uuid) TO authenticated;

-- Ativar/Desativar filial
DROP FUNCTION IF EXISTS public.toggle_filial_active(uuid, boolean);
CREATE OR REPLACE FUNCTION public.toggle_filial_active(p_filial_id uuid, p_active boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.filiais SET is_active = p_active WHERE id = p_filial_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_filial_active(uuid, boolean) TO authenticated;
-- RPC: listar lotes de um empreendimento
DROP FUNCTION IF EXISTS public.get_empreendimento_lotes(uuid);
CREATE OR REPLACE FUNCTION public.get_empreendimento_lotes(p_empreendimento_id uuid)
RETURNS TABLE(
  id uuid,
  nome text,
  numero int,
  status text,
  area_m2 numeric,
  preco numeric,
  comprador_nome text,
  comprador_email text,
  data_venda timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.nome,
    l.numero,
    l.status,
    l.area_m2,
    l.valor AS preco,
    l.comprador_nome,
    l.comprador_email,
    l.data_venda
  FROM public.lotes l
  WHERE l.empreendimento_id = p_empreendimento_id
  ORDER BY l.numero NULLS LAST, l.nome;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_empreendimento_lotes(uuid) TO authenticated;

-- RPC: atualizar status/valor do lote
CREATE OR REPLACE FUNCTION public.update_lote_status(
  p_lote_id uuid,
  p_status text,
  p_comprador_nome text DEFAULT NULL,
  p_comprador_email text DEFAULT NULL,
  p_preco numeric DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.lotes
  SET
    status = p_status,
    valor = COALESCE(p_preco, valor),
    comprador_nome = CASE WHEN p_status = 'vendido' THEN p_comprador_nome ELSE NULL END,
    comprador_email = CASE WHEN p_status = 'vendido' THEN p_comprador_email ELSE NULL END,
    data_venda = CASE WHEN p_status = 'vendido' THEN COALESCE(data_venda, now()) ELSE NULL END,
    updated_at = now()
  WHERE id = p_lote_id;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_lote_status(uuid, text, text, text, numeric) TO authenticated;
 
-- Função para aprovar/rejeitar empreendimento
CREATE OR REPLACE FUNCTION public.approve_empreendimento(
  p_empreendimento_id uuid,
  p_approved boolean,
  p_rejection_reason text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  IF p_approved THEN
    UPDATE public.empreendimentos
      SET status = 'aprovado',
          approved_by = auth.uid(),
          approved_at = now(),
          rejection_reason = NULL,
          updated_at = now()
    WHERE id = p_empreendimento_id;
  ELSE
    UPDATE public.empreendimentos
      SET status = 'rejeitado',
          approved_by = auth.uid(),
          approved_at = now(),
          rejection_reason = COALESCE(p_rejection_reason, 'Sem motivo informado'),
          updated_at = now()
    WHERE id = p_empreendimento_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.approve_empreendimento(uuid, boolean, text) TO authenticated;

-- Função segura para Super Admin atualizar o papel (role) de um usuário
CREATE OR REPLACE FUNCTION public.admin_update_user_role(p_user_id uuid, p_role text)
RETURNS void AS $$
BEGIN
  -- Autoriza apenas quem é superadmin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  UPDATE public.user_profiles
  SET role = p_role,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.admin_update_user_role(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(uuid, text) TO authenticated;

-- Visão geral de todos os empreendimentos (todas as filiais) com métricas e nome da filial
CREATE OR REPLACE FUNCTION public.get_all_empreendimentos_overview()
RETURNS TABLE (
  empreendimento_id uuid,
  nome text,
  status text,
  filial_id uuid,
  filial_nome text,
  total_lotes int,
  lotes_vendidos int,
  receita_total numeric,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id,
         e.nome,
         e.status,
         e.filial_id,
         f.nome AS filial_nome,
         COALESCE(t.total,0)::int AS total_lotes,
         COALESCE(v.vendidos,0)::int AS lotes_vendidos,
         COALESCE(r.receita,0) AS receita_total,
         e.created_at
  FROM public.empreendimentos e
  JOIN public.filiais f ON f.id = e.filial_id
  LEFT JOIN (
    SELECT empreendimento_id, COUNT(*)::int AS total
    FROM public.lotes GROUP BY empreendimento_id
  ) t ON t.empreendimento_id = e.id
  LEFT JOIN (
    SELECT empreendimento_id, COUNT(*)::int AS vendidos
    FROM public.lotes WHERE status = 'vendido' GROUP BY empreendimento_id
  ) v ON v.empreendimento_id = e.id
  LEFT JOIN (
    SELECT empreendimento_id, COALESCE(SUM(valor),0) AS receita
    FROM public.lotes WHERE status = 'vendido' GROUP BY empreendimento_id
  ) r ON r.empreendimento_id = e.id
  ORDER BY e.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_empreendimentos_overview() TO authenticated;

-- ================================================================================================
-- SEÇÃO 7: LÓGICA DE PERMISSÕES (TRIGGERS E RLS)
-- ================================================================================================

-- FUNÇÃO E TRIGGER PARA SINCRONIZAR ROLE COM AUTH.USERS
CREATE OR REPLACE FUNCTION public.set_user_role_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE auth.users
    SET
        raw_app_meta_data = jsonb_set(
            COALESCE(raw_app_meta_data, '{}'::jsonb),
            '{role}',
            to_jsonb(NEW.role)
        )
    WHERE
        id = NEW.user_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_change_set_user_role
    AFTER INSERT OR UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_user_role_from_profile();

-- POLÍTICAS DE ROW LEVEL SECURITY (RLS)
CREATE OR REPLACE FUNCTION get_my_filial_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT filial_id FROM public.user_profiles WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.empreendimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total da filial aos seus empreendimentos" ON public.empreendimentos FOR ALL USING (filial_id = get_my_filial_id()) WITH CHECK (filial_id = get_my_filial_id());
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso da filial aos seus lotes" ON public.lotes FOR ALL USING (empreendimento_id IN (SELECT id FROM public.empreendimentos));


-- ================================================================================================
-- SEÇÃO 8: DADOS INICIAIS
-- ================================================================================================

INSERT INTO public.filiais (nome) VALUES ('Filial Matriz'), ('Filial São Paulo'), ('Filial Rio de Janeiro'), ('Filial Belo Horizonte');


-- ================================================================================================
-- SEÇÃO 9: INSTRUÇÕES PARA CRIAÇÃO DE USUÁRIOS
-- ================================================================================================
-- 1. Crie os usuários normalmente pela interface do Supabase (Authentication -> Users -> Add user).
--    Ex: superadmin@blockurb.com, admin.sp@blockurb.com, corretor.rj@blockurb.com

-- 2. Depois, execute os comandos SQL abaixo para criar seus perfis, associando-os a um cargo e a uma filial.

/*
-- EXEMPLO: Criando o perfil do Super Admin na Filial Matriz
INSERT INTO public.user_profiles (user_id, email, full_name, role, panels, filial_id)
VALUES
(
    (SELECT id FROM auth.users WHERE email = 'superadmin@blockurb.com'),
    'superadmin@blockurb.com',
    'Super Administrador',
    'superadmin',
    '{"superadmin", "adminfilial"}',
    (SELECT id FROM public.filiais WHERE nome = 'Filial Matriz')
);

-- EXEMPLO: Criando o perfil de um Admin da Filial de São Paulo
INSERT INTO public.user_profiles (user_id, email, full_name, role, panels, filial_id)
VALUES
(
    (SELECT id FROM auth.users WHERE email = 'admin.sp@blockurb.com'),
    'admin.sp@blockurb.com',
    'Admin SP',
    'adminfilial',
    '{"adminfilial"}',
    (SELECT id FROM public.filiais WHERE nome = 'Filial São Paulo')
);

-- EXEMPLO: Criando o perfil de um Corretor da Filial do Rio de Janeiro
INSERT INTO public.user_profiles (user_id, email, full_name, role, panels, filial_id)
VALUES
(
    (SELECT id FROM auth.users WHERE email = 'corretor.rj@blockurb.com'),
    'corretor.rj@blockurb.com',
    'Corretor RJ',
    'corretor',
    '{"corretor"}',
    (SELECT id FROM public.filiais WHERE nome = 'Filial Rio de Janeiro')
);
*/
-- ================================================================================================
-- FIM DO SCRIPT
-- ================================================================================================
