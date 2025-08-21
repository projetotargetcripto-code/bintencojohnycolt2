-- Create materialized views for BI

create materialized view if not exists public.mv_kpis_filial as
  select
    f.id as filial_id,
    count(distinct e.id) as empreendimentos,
    count(distinct u.user_id) filter (where u.role <> 'superadmin') as usuarios,
    count(l.id) filter (where l.status = 'disponivel') as lotes_disponiveis,
    count(l.id) filter (where l.status = 'reservado') as lotes_reservados,
    count(l.id) filter (where l.status = 'vendido') as lotes_vendidos,
    count(l.id) as total_lotes
  from public.filiais f
  left join public.empreendimentos e on e.filial_id = f.id
  left join public.user_profiles u on u.filial_id = f.id
  left join public.lotes l on l.filial_id = f.id
  group by f.id;

create unique index if not exists idx_mv_kpis_filial_filial on public.mv_kpis_filial(filial_id);

create materialized view if not exists public.mv_heatmap_lotes as
  select
    filial_id,
    st_x(geom) as longitude,
    st_y(geom) as latitude,
    status
  from public.lotes
  where geom is not null;

create index if not exists idx_mv_heatmap_lotes_filial on public.mv_heatmap_lotes(filial_id);

-- Restrict read permissions
revoke all on public.mv_kpis_filial from public;
revoke all on public.mv_heatmap_lotes from public;
grant select on public.mv_kpis_filial to adminfilial, superadmin;
grant select on public.mv_heatmap_lotes to adminfilial, superadmin;

-- Function to refresh materialized views
create or replace function public.refresh_bi()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view public.mv_kpis_filial;
  refresh materialized view public.mv_heatmap_lotes;
end;
$$;

grant execute on function public.refresh_bi() to adminfilial, superadmin;
