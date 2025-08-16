-- =============================================================================
-- SCRIPT SQL ATUALIZADO PARA LOTES INTERATIVOS (v2)
-- Execute este SQL no Supabase Dashboard para atualizar a função dos lotes.
-- =============================================================================

-- 1. AJUSTAR A TABELA DE LOTES
-- Aumenta o tamanho da coluna 'nome' para acomodar nomes compostos e longos.
-- -----------------------------------------------------------------------------
ALTER TABLE lotes ALTER COLUMN nome TYPE VARCHAR(255);


-- 2. REMOVER A FUNÇÃO ANTIGA
-- Remove a função antiga para evitar erros de assinatura com diferentes parâmetros.
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS process_geojson_lotes(p_empreendimento_id uuid, p_geojson jsonb);


-- 3. CRIAR A NOVA FUNÇÃO RPC ATUALIZADA
-- Cria a nova versão da função que aceita o nome do empreendimento como parâmetro
-- e formata o nome de cada lote individualmente antes de salvar.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_geojson_lotes(
    p_empreendimento_id UUID,
    p_geojson JSONB,
    p_empreendimento_nome TEXT
)
RETURNS TABLE(total_lotes INTEGER, lotes_processados JSONB) AS $$
DECLARE
    feature JSONB;
    lote_nome_original TEXT;
    lote_nome_final TEXT;
    lote_numero INTEGER;
    geometria JSONB;
    coordenadas JSONB;
    area_calculada DECIMAL;
    lote_id UUID;
    lotes_array JSONB := '[]'::JSONB;
    contador INTEGER := 0;
BEGIN
    -- Limpa lotes existentes deste empreendimento para evitar duplicatas em caso de re-processamento.
    DELETE FROM lotes WHERE empreendimento_id = p_empreendimento_id;
    
    -- Itera sobre cada 'feature' (lote) dentro do GeoJSON.
    FOR feature IN SELECT jsonb_array_elements(p_geojson->'features')
    LOOP
        contador := contador + 1;
        
        -- Extrai o nome original do lote de dentro das propriedades do GeoJSON.
        lote_nome_original := COALESCE(
            feature->'properties'->>'Name',
            feature->'properties'->>'name',
            'Lote ' || contador::TEXT
        );

        -- Formata o nome final no padrão: "[Nome Empreendimento] - [Nome Lote Original]"
        lote_nome_final := p_empreendimento_nome || ' - ' || lote_nome_original;
        
        -- Tenta extrair um número do nome original do lote; se não encontrar, usa um contador.
        lote_numero := CASE 
            WHEN lote_nome_original ~ '\d+' THEN (regexp_match(lote_nome_original, '\d+'))[1]::INTEGER
            ELSE contador
        END;
        
        -- Extrai e calcula dados geométricos.
        geometria := feature->'geometry'->'coordinates';
        coordenadas := calculate_polygon_center(geometria);
        area_calculada := calculate_polygon_area(geometria);
        
        -- Insere o novo lote no banco de dados com o nome formatado.
        INSERT INTO lotes (
            empreendimento_id, nome, numero, status, area_m2,
            coordenadas, geometria, properties
        ) VALUES (
            p_empreendimento_id, lote_nome_final, lote_numero, 'disponivel', area_calculada,
            coordenadas, geometria, feature->'properties'
        ) RETURNING id INTO lote_id;
        
        -- Adiciona o lote processado a um array JSON para o retorno da função.
        lotes_array := lotes_array || jsonb_build_object(
            'id', lote_id,
            'nome', lote_nome_final,
            'numero', lote_numero,
            'area_m2', area_calculada
        );
    END LOOP;
    
    -- Retorna o total de lotes processados e o array com os detalhes.
    RETURN QUERY SELECT contador, lotes_array;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. GARANTIR PERMISSÕES
-- Concede permissão de execução para a nova assinatura da função.
-- -----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION process_geojson_lotes(uuid, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION process_geojson_lotes(uuid, jsonb, text) TO anon;

-- =============================================================================
-- FIM DO SCRIPT
-- =============================================================================

