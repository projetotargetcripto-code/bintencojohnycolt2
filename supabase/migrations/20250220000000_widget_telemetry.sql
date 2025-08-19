create table if not exists public.widget_telemetry (
    id uuid primary key default gen_random_uuid(),
    widget_id uuid not null,
    evento text not null,
    meta jsonb,
    created_at timestamptz default now()
);

create or replace function public.log_widget_event(widget_id uuid, evento text, meta jsonb)
returns void
language sql
security definer
as $$
  insert into public.widget_telemetry(widget_id, evento, meta)
  values (log_widget_event.widget_id, log_widget_event.evento, log_widget_event.meta);
$$;

grant execute on function public.log_widget_event(uuid, text, jsonb) to anon;

create or replace function public.widget_telemetry_stats()
returns table(evento text, total bigint)
language sql
security definer
as $$
  select evento, count(*) as total
  from public.widget_telemetry
  group by evento;
$$;

grant execute on function public.widget_telemetry_stats() to authenticated;
