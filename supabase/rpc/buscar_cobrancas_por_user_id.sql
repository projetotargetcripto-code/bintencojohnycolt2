create or replace function public.buscar_cobrancas_por_user_id(
  p_user_id uuid
)
returns setof public.cobrancas
language sql
as $$
  select *
  from public.cobrancas
  where user_id = p_user_id;
$$;
