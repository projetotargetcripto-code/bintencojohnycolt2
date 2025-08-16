-- =============================================================================
-- ESTRUTURA COMPLETA PARA LOTES INTERATIVOS
-- Execute este SQL no Supabase Dashboard
-- =============================================================================

-- 1. MELHORAR TABELA LOTES
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS lotes CASCADE;

CREATE TABLE lotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empreendimento_id UUID REFERENCES empreendimentos(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    numero INTEGER,
    status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'reservado', 'vendido')),
    area_m2 DECIMAL(10,2),
    preco DECIMAL(12,2),
    coordenadas JSONB, -- Centro do polígono {lat, lng}
    geometria JSONB, -- Coordenadas completas do polígono
    properties JSONB, -- Propriedades originais do GeoJSON
    comprador_nome VARCHAR(200),
    comprador_email VARCHAR(200),
    data_venda TIMESTAMP,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_lotes_empreendimento ON lotes(empreendimento_id);
CREATE INDEX idx_lotes_status ON lotes(status);
CREATE INDEX idx_lotes_numero ON lotes(empreendimento_id, numero);

-- 2. FUNÇÃO PARA CALCULAR ÁREA DE POLÍGONO (GEOMÉTRICA SIMPLES)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_polygon_area(coordinates JSONB)
RETURNS DECIMAL AS $$
DECLARE
    coords JSONB;
    area DECIMAL := 0;
    i INTEGER;
    lat1 DECIMAL;
    lng1 DECIMAL;
    lat2 DECIMAL;
    lng2 DECIMAL;
BEGIN
    -- Pega o primeiro array de coordenadas (exterior ring)
    coords := coordinates->0;
    
    -- Calcula área usando fórmula do shoelace (aproximada)
    FOR i IN 0..(JSONB_ARRAY_LENGTH(coords) - 2) LOOP
        lat1 := (coords->i->1)::DECIMAL;
        lng1 := (coords->i->0)::DECIMAL;
        lat2 := (coords->(i+1)->1)::DECIMAL;
        lng2 := (coords->(i+1)->0)::DECIMAL;
        
        area := area + (lng1 * lat2 - lng2 * lat1);
    END LOOP;
    
    -- Retorna área absoluta em metros quadrados aproximados
    RETURN ABS(area) * 111319.9 * 111319.9 / 2;
END;
$$ LANGUAGE plpgsql;

-- 3. FUNÇÃO PARA CALCULAR CENTRO DE POLÍGONO
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_polygon_center(coordinates JSONB)
RETURNS JSONB AS $$
DECLARE
    coords JSONB;
    lat_sum DECIMAL := 0;
    lng_sum DECIMAL := 0;
    point_count INTEGER;
BEGIN
    coords := coordinates->0;
    point_count := JSONB_ARRAY_LENGTH(coords);
    
    -- Calcula centroide simples (média das coordenadas)
    FOR i IN 0..(point_count - 1) LOOP
        lat_sum := lat_sum + (coords->i->1)::DECIMAL;
        lng_sum := lng_sum + (coords->i->0)::DECIMAL;
    END LOOP;
    
    RETURN JSONB_BUILD_OBJECT(
        'lat', lat_sum / point_count,
        'lng', lng_sum / point_count
    );
END;
$$ LANGUAGE plpgsql;

-- 4. RPC PARA PROCESSAR E SALVAR LOTES DO GEOJSON
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_geojson_lotes(
    p_empreendimento_id UUID,
    p_geojson JSONB
)
RETURNS TABLE(
    total_lotes INTEGER,
    lotes_processados JSONB
) AS $$
DECLARE
    feature JSONB;
    lote_nome VARCHAR(100);
    lote_numero INTEGER;
    geometria JSONB;
    coordenadas JSONB;
    area_calculada DECIMAL;
    lote_id UUID;
    lotes_array JSONB := '[]'::JSONB;
    contador INTEGER := 0;
BEGIN
    -- Limpar lotes existentes do empreendimento
    DELETE FROM lotes WHERE empreendimento_id = p_empreendimento_id;
    
    -- Processar cada feature do GeoJSON
    FOR feature IN SELECT JSONB_ARRAY_ELEMENTS(p_geojson->'features')
    LOOP
        contador := contador + 1;
        
        -- Extrair nome do lote
        lote_nome := COALESCE(
            feature->'properties'->>'Name',
            feature->'properties'->>'name',
            'Lote ' || contador::TEXT
        );
        
        -- Extrair número do lote (tentar do nome)
        lote_numero := CASE 
            WHEN lote_nome ~ '\d+' THEN 
                (regexp_match(lote_nome, '\d+'))[1]::INTEGER
            ELSE contador
        END;
        
        -- Extrair geometria
        geometria := feature->'geometry'->'coordinates';
        
        -- Calcular coordenadas do centro
        coordenadas := calculate_polygon_center(geometria);
        
        -- Calcular área
        area_calculada := calculate_polygon_area(geometria);
        
        -- Inserir lote
        INSERT INTO lotes (
            empreendimento_id,
            nome,
            numero,
            status,
            area_m2,
            coordenadas,
            geometria,
            properties
        ) VALUES (
            p_empreendimento_id,
            lote_nome,
            lote_numero,
            'disponivel',
            area_calculada,
            coordenadas,
            geometria,
            feature->'properties'
        ) RETURNING id INTO lote_id;
        
        -- Adicionar ao array de retorno
        lotes_array := lotes_array || JSONB_BUILD_OBJECT(
            'id', lote_id,
            'nome', lote_nome,
            'numero', lote_numero,
            'area_m2', area_calculada,
            'coordenadas', coordenadas
        );
    END LOOP;
    
    -- Retornar resultado
    RETURN QUERY SELECT contador, lotes_array;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC PARA BUSCAR LOTES DE UM EMPREENDIMENTO
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_empreendimento_lotes(p_empreendimento_id UUID)
RETURNS TABLE(
    id UUID,
    nome VARCHAR,
    numero INTEGER,
    status VARCHAR,
    area_m2 DECIMAL,
    preco DECIMAL,
    coordenadas JSONB,
    geometria JSONB,
    comprador_nome VARCHAR,
    data_venda TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.nome,
        l.numero,
        l.status,
        l.area_m2,
        l.preco,
        l.coordenadas,
        l.geometria,
        l.comprador_nome,
        l.data_venda
    FROM lotes l
    WHERE l.empreendimento_id = p_empreendimento_id
    ORDER BY l.numero;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC PARA ATUALIZAR STATUS DO LOTE
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_lote_status(
    p_lote_id UUID,
    p_status VARCHAR,
    p_comprador_nome VARCHAR DEFAULT NULL,
    p_comprador_email VARCHAR DEFAULT NULL,
    p_preco DECIMAL DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE lotes 
    SET 
        status = p_status,
        comprador_nome = CASE WHEN p_status = 'vendido' THEN p_comprador_nome ELSE NULL END,
        comprador_email = CASE WHEN p_status = 'vendido' THEN p_comprador_email ELSE NULL END,
        preco = COALESCE(p_preco, preco),
        data_venda = CASE WHEN p_status = 'vendido' THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_lote_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC PARA ESTATÍSTICAS DE VENDAS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_vendas_stats(p_empreendimento_id UUID)
RETURNS TABLE(
    total_lotes INTEGER,
    lotes_disponiveis INTEGER,
    lotes_reservados INTEGER,
    lotes_vendidos INTEGER,
    percentual_vendido DECIMAL,
    area_total DECIMAL,
    area_vendida DECIMAL,
    receita_total DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_lotes,
        COUNT(CASE WHEN status = 'disponivel' THEN 1 END)::INTEGER as lotes_disponiveis,
        COUNT(CASE WHEN status = 'reservado' THEN 1 END)::INTEGER as lotes_reservados,
        COUNT(CASE WHEN status = 'vendido' THEN 1 END)::INTEGER as lotes_vendidos,
        ROUND(
            (COUNT(CASE WHEN status = 'vendido' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100), 2
        ) as percentual_vendido,
        COALESCE(SUM(area_m2), 0) as area_total,
        COALESCE(SUM(CASE WHEN status = 'vendido' THEN area_m2 END), 0) as area_vendida,
        COALESCE(SUM(CASE WHEN status = 'vendido' THEN preco END), 0) as receita_total
    FROM lotes 
    WHERE empreendimento_id = p_empreendimento_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. PERMISSÕES
-- -----------------------------------------------------------------------------
GRANT ALL ON lotes TO authenticated;
GRANT ALL ON lotes TO anon;

GRANT EXECUTE ON FUNCTION process_geojson_lotes TO authenticated;
GRANT EXECUTE ON FUNCTION process_geojson_lotes TO anon;

GRANT EXECUTE ON FUNCTION get_empreendimento_lotes TO authenticated;
GRANT EXECUTE ON FUNCTION get_empreendimento_lotes TO anon;

GRANT EXECUTE ON FUNCTION update_lote_status TO authenticated;
GRANT EXECUTE ON FUNCTION update_lote_status TO anon;

GRANT EXECUTE ON FUNCTION get_vendas_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendas_stats TO anon;

-- 9. POLÍTICAS RLS
-- -----------------------------------------------------------------------------
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on lotes" ON lotes FOR ALL USING (true);

-- =============================================================================
-- FIM DO SCRIPT - Execute no Supabase Dashboard
-- =============================================================================

