create or replace function mv_kpis_filial()
returns setof mv_kpis_filial
language sql
security definer
as $$
  select * from mv_kpis_filial;
$$;
