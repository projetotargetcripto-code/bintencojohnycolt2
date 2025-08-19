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
