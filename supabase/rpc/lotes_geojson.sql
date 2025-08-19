create or replace function public.lotes_geojson(p_empreendimento_id uuid)
returns jsonb
language sql
stable
as $$
  with feats as (
    select jsonb_build_object(
      'type','Feature',
      'geometry', coalesce(l.geometria, to_jsonb(st_asgeojson(l.geom)::json)),
      'properties', jsonb_build_object(
        'id', l.id,
        'nome', l.nome,
        'numero', l.numero,
        'status', l.status,
        'preco', coalesce(l.preco, l.valor),
        'area_m2', l.area_m2
      )
    ) as f
    from public.lotes l
    where l.empreendimento_id = p_empreendimento_id
      and coalesce(l.liberado, false)
  )
  select jsonb_build_object('type','FeatureCollection','features', coalesce(jsonb_agg(f), '[]'::jsonb))
  from feats;
$$;
