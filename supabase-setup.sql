-- ============================================
-- SETUP COMPLETO DO SUPABASE PARA BLOCKURB
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================

-- 1. CRIAR TABELAS
-- ===============

-- Tabela principal de empreendimentos
CREATE TABLE IF NOT EXISTS empreendimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  total_lotes INTEGER DEFAULT 0,
  lotes_vendidos INTEGER DEFAULT 0,
  bounds TEXT, -- JSON string: {"sw": {"lat": -23, "lng": -46}, "ne": {...}}
  geojson_url TEXT,
  masterplan_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de lotes individuais
CREATE TABLE IF NOT EXISTS lotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empreendimento_id UUID REFERENCES empreendimentos(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  status TEXT DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'reservado', 'vendido')),
  preco DECIMAL(12,2),
  area_m2 DECIMAL(10,2),
  geometry JSONB, -- GeoJSON geometry
  properties JSONB, -- Propriedades extras
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de overlays do masterplan
CREATE TABLE IF NOT EXISTS masterplan_overlays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empreendimento_id UUID REFERENCES empreendimentos(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  bounds JSONB NOT NULL, -- GeoJSON Polygon
  opacity DECIMAL(3,2) DEFAULT 0.7,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- =================================

CREATE INDEX IF NOT EXISTS idx_lotes_empreendimento ON lotes(empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_lotes_status ON lotes(status);
CREATE INDEX IF NOT EXISTS idx_overlays_empreendimento ON masterplan_overlays(empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_overlays_active ON masterplan_overlays(is_active);

-- 3. FUNÇÕES RPC
-- =============

-- Função para retornar GeoJSON dos lotes de um empreendimento
CREATE OR REPLACE FUNCTION lotes_geojson(p_empreendimento UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(json_agg(
      json_build_object(
        'type', 'Feature',
        'properties', json_build_object(
          'codigo', codigo,
          'status', status,
          'preco', preco,
          'area_m2', area_m2
        ) || COALESCE(properties, '{}'::jsonb),
        'geometry', geometry
      )
    ), '[]'::json)
  ) INTO result
  FROM lotes 
  WHERE empreendimento_id = p_empreendimento;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para criar empreendimento a partir de GeoJSON
CREATE OR REPLACE FUNCTION create_empreendimento_from_geojson(
  p_nome TEXT,
  p_descricao TEXT DEFAULT NULL,
  p_sw_lat DECIMAL DEFAULT NULL,
  p_sw_lng DECIMAL DEFAULT NULL,
  p_ne_lat DECIMAL DEFAULT NULL,
  p_ne_lng DECIMAL DEFAULT NULL,
  p_geojson JSONB DEFAULT NULL,
  p_overlay_path TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  novo_id UUID;
  feature JSONB;
  total_lotes INTEGER := 0;
  bounds_json TEXT;
BEGIN
  -- Criar bounds JSON se coordenadas fornecidas
  IF p_sw_lat IS NOT NULL AND p_sw_lng IS NOT NULL AND p_ne_lat IS NOT NULL AND p_ne_lng IS NOT NULL THEN
    bounds_json := json_build_object(
      'sw', json_build_object('lat', p_sw_lat, 'lng', p_sw_lng),
      'ne', json_build_object('lat', p_ne_lat, 'lng', p_ne_lng)
    )::text;
  END IF;
  
  -- Inserir empreendimento
  INSERT INTO empreendimentos (nome, descricao, bounds)
  VALUES (p_nome, p_descricao, bounds_json)
  RETURNING id INTO novo_id;
  
  -- Processar GeoJSON se fornecido
  IF p_geojson IS NOT NULL AND p_geojson ? 'features' THEN
    FOR feature IN SELECT jsonb_array_elements(p_geojson->'features')
    LOOP
      INSERT INTO lotes (
        empreendimento_id,
        codigo,
        status,
        preco,
        area_m2,
        geometry,
        properties
      ) VALUES (
        novo_id,
        COALESCE(feature->'properties'->>'codigo', 'LOTE-' || (total_lotes + 1)),
        COALESCE(feature->'properties'->>'status', 'disponivel'),
        COALESCE((feature->'properties'->>'preco')::DECIMAL, NULL),
        COALESCE((feature->'properties'->>'area_m2')::DECIMAL, NULL),
        feature->'geometry',
        feature->'properties'
      );
      total_lotes := total_lotes + 1;
    END LOOP;
    
    -- Atualizar total de lotes
    UPDATE empreendimentos SET total_lotes = total_lotes WHERE id = novo_id;
  END IF;
  
  -- Adicionar overlay se fornecido
  IF p_overlay_path IS NOT NULL AND bounds_json IS NOT NULL THEN
    INSERT INTO masterplan_overlays (empreendimento_id, image_path, bounds)
    VALUES (
      novo_id, 
      p_overlay_path,
      json_build_object(
        'type', 'Polygon',
        'coordinates', json_build_array(json_build_array(
          json_build_array(p_sw_lng, p_sw_lat),
          json_build_array(p_ne_lng, p_sw_lat),
          json_build_array(p_ne_lng, p_ne_lat),
          json_build_array(p_sw_lng, p_ne_lat),
          json_build_array(p_sw_lng, p_sw_lat)
        ))
      )::jsonb
    );
  END IF;
  
  RETURN novo_id;
END;
$$ LANGUAGE plpgsql;

-- Função para adicionar overlay de masterplan
CREATE OR REPLACE FUNCTION add_masterplan_overlay(
  p_empreendimento UUID,
  p_image_path TEXT,
  p_opacity DECIMAL DEFAULT 0.7
)
RETURNS BOOLEAN AS $$
DECLARE
  emp_bounds TEXT;
  bounds_geom JSONB;
BEGIN
  -- Buscar bounds do empreendimento
  SELECT bounds INTO emp_bounds FROM empreendimentos WHERE id = p_empreendimento;
  
  IF emp_bounds IS NOT NULL THEN
    -- Converter bounds para geometria
    bounds_geom := json_build_object(
      'type', 'Polygon',
      'coordinates', json_build_array(json_build_array(
        json_build_array((emp_bounds::json->'sw'->>'lng')::decimal, (emp_bounds::json->'sw'->>'lat')::decimal),
        json_build_array((emp_bounds::json->'ne'->>'lng')::decimal, (emp_bounds::json->'sw'->>'lat')::decimal),
        json_build_array((emp_bounds::json->'ne'->>'lng')::decimal, (emp_bounds::json->'ne'->>'lat')::decimal),
        json_build_array((emp_bounds::json->'sw'->>'lng')::decimal, (emp_bounds::json->'ne'->>'lat')::decimal),
        json_build_array((emp_bounds::json->'sw'->>'lng')::decimal, (emp_bounds::json->'sw'->>'lat')::decimal)
      ))
    );
    
    -- Desativar overlays anteriores
    UPDATE masterplan_overlays SET is_active = FALSE WHERE empreendimento_id = p_empreendimento;
    
    -- Inserir novo overlay
    INSERT INTO masterplan_overlays (empreendimento_id, image_path, bounds, opacity)
    VALUES (p_empreendimento, p_image_path, bounds_geom, p_opacity);
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 4. DADOS DE EXEMPLO
-- ===================

-- Inserir empreendimento de exemplo com lotes
SELECT create_empreendimento_from_geojson(
  'Residencial BlockURB Demo',
  'Empreendimento de demonstração criado automaticamente',
  -23.5500,  -- sw_lat
  -46.6400,  -- sw_lng  
  -23.5480,  -- ne_lat
  -46.6380,  -- ne_lng
  '{
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {"codigo": "A01", "status": "disponivel", "preco": 250000, "area_m2": 300},
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-46.6400, -23.5500], [-46.6395, -23.5500], 
            [-46.6395, -23.5495], [-46.6400, -23.5495], 
            [-46.6400, -23.5500]
          ]]
        }
      },
      {
        "type": "Feature", 
        "properties": {"codigo": "A02", "status": "reservado", "preco": 280000, "area_m2": 320},
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-46.6395, -23.5500], [-46.6390, -23.5500],
            [-46.6390, -23.5495], [-46.6395, -23.5495],
            [-46.6395, -23.5500]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": {"codigo": "A03", "status": "vendido", "preco": 270000, "area_m2": 310},
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-46.6390, -23.5500], [-46.6385, -23.5500],
            [-46.6385, -23.5495], [-46.6390, -23.5495],
            [-46.6390, -23.5500]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": {"codigo": "B01", "status": "disponivel", "preco": 245000, "area_m2": 290},
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-46.6400, -23.5495], [-46.6395, -23.5495],
            [-46.6395, -23.5490], [-46.6400, -23.5490],
            [-46.6400, -23.5495]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": {"codigo": "B02", "status": "disponivel", "preco": 265000, "area_m2": 315},
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-46.6395, -23.5495], [-46.6390, -23.5495],
            [-46.6390, -23.5490], [-46.6395, -23.5490],
            [-46.6395, -23.5495]
          ]]
        }
      }
    ]
  }'::jsonb
);

-- 5. POLÍTICAS DE SEGURANÇA (Row Level Security)
-- ==============================================

-- Habilitar RLS nas tabelas
ALTER TABLE empreendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE masterplan_overlays ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir leitura pública (todos podem ver)
CREATE POLICY "Public read access" ON empreendimentos FOR SELECT USING (true);
CREATE POLICY "Public read access" ON lotes FOR SELECT USING (true);
CREATE POLICY "Public read access" ON masterplan_overlays FOR SELECT USING (true);

-- Políticas para permitir escrita apenas para usuários autenticados
CREATE POLICY "Authenticated users can insert" ON empreendimentos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON empreendimentos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete" ON empreendimentos FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert" ON lotes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON lotes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete" ON lotes FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert" ON masterplan_overlays FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON masterplan_overlays FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete" ON masterplan_overlays FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- SETUP CONCLUÍDO!
-- ============================================

-- Verificar se tudo foi criado corretamente
SELECT 'TABELAS CRIADAS:' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('empreendimentos', 'lotes', 'masterplan_overlays');

SELECT 'FUNÇÕES CRIADAS:' as status;
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('lotes_geojson', 'create_empreendimento_from_geojson', 'add_masterplan_overlay');

SELECT 'DADOS DE EXEMPLO:' as status;
SELECT id, nome, total_lotes FROM empreendimentos;

SELECT 'SETUP CONCLUÍDO COM SUCESSO!' as status;

