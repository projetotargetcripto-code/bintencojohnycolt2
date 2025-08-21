-- Create table for widget telemetry
create table if not exists public.widget_telemetry (
  id uuid primary key default gen_random_uuid(),
  widget_id uuid not null,
  evento text not null,
  meta jsonb,
  created_at timestamptz default now()
);

-- Function to log widget events
create or replace function public.log_widget_event(
  widget_id uuid,
  evento text,
  meta jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.widget_telemetry(widget_id, evento, meta)
  values (widget_id, evento, meta);
end;
$$;

grant execute on function public.log_widget_event(uuid, text, jsonb) to anon;
