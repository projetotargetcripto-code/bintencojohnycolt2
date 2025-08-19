-- View aggregating lot sales by broker and status
-- Relies on RLS policies defined on public.lotes

drop view if exists public.vw_comissoes;

create view public.vw_comissoes as
select
  l.filial_id,
  (l.properties->>'corretor_id')::uuid as corretor_id,
  up.full_name as corretor_nome,
  l.status,
  count(*) as total_lotes,
  coalesce(sum(coalesce(l.preco, l.valor)), 0) as valor_total
from public.lotes l
left join public.user_profiles up on up.user_id = (l.properties->>'corretor_id')::uuid
where (l.properties->>'corretor_id') is not null
group by l.filial_id, corretor_id, up.full_name, l.status;

alter view public.vw_comissoes set (security_invoker = on);
