create or replace function superadmin_reports(
  filial_ids uuid[] default null,
  from_date date default null,
  to_date date default null
)
returns table (
  day date,
  filial_id uuid,
  empreendimentos integer,
  usuarios integer,
  lotes_vendidos integer,
  ocupacao numeric
)
language plpgsql
as $$
declare
  f_ids uuid[];
begin
  -- assume all filiais when none specified
  if filial_ids is null then
    select array_agg(id) into f_ids from filiais;
  else
    f_ids := filial_ids;
  end if;

  return query
  with days as (
    select generate_series(
      coalesce(from_date, current_date - interval '30 day'),
      coalesce(to_date, current_date),
      interval '1 day'
    )::date as day
  ),
  empreendimentos_cte as (
    select date_trunc('day', created_at)::date as day, filial_id, count(*) as cnt
    from empreendimentos
    where filial_id = any(f_ids)
      and created_at::date between coalesce(from_date, current_date - interval '30 day') and coalesce(to_date, current_date)
    group by 1,2
  ),
  usuarios_cte as (
    select date_trunc('day', created_at)::date as day, filial_id, count(*) as cnt
    from user_profiles
    where filial_id = any(f_ids)
      and role <> 'superadmin'
      and created_at::date between coalesce(from_date, current_date - interval '30 day') and coalesce(to_date, current_date)
    group by 1,2
  ),
  lotes_cte as (
    select date_trunc('day', sold_at)::date as day, filial_id, count(*) as cnt
    from lotes
    where filial_id = any(f_ids)
      and status = 'vendido'
      and sold_at::date between coalesce(from_date, current_date - interval '30 day') and coalesce(to_date, current_date)
    group by 1,2
  ),
  lotes_total as (
    select filial_id, count(*) as total
    from lotes
    where filial_id = any(f_ids)
    group by filial_id
  )
  select d.day,
         f.id as filial_id,
         coalesce(e.cnt, 0) as empreendimentos,
         coalesce(u.cnt, 0) as usuarios,
         coalesce(l.cnt, 0) as lotes_vendidos,
         coalesce((l.cnt::numeric / nullif(t.total,0)) * 100, 0) as ocupacao
  from (select unnest(f_ids) as id) f
  cross join days d
  left join empreendimentos_cte e on e.day = d.day and e.filial_id = f.id
  left join usuarios_cte u on u.day = d.day and u.filial_id = f.id
  left join lotes_cte l on l.day = d.day and l.filial_id = f.id
  left join lotes_total t on t.filial_id = f.id
  order by d.day, f.id;
end;
$$;
