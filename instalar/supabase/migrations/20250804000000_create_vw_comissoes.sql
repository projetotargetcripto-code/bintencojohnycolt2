create or replace view public.vw_comissoes as
select
  v.corretor_id,
  l.status,
  sum(v.comissao) as total_comissao
from public.vendas v
join public.lotes l on l.id = v.lote_id
group by v.corretor_id, l.status;

grant select on public.vw_comissoes to adminfilial, comercial, superadmin;
