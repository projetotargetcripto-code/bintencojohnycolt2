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
