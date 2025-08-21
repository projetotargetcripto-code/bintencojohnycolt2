create table if not exists public.audit_reservas (
    id uuid primary key default gen_random_uuid(),
    reserva_id uuid not null,
    action text not null,
    actor uuid,
    old_row jsonb,
    new_row jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz not null default now()
);

create or replace function public.log_reserva_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_headers json;
  v_ip text;
  v_ua text;
begin
  v_headers := current_setting('request.headers', true)::json;
  v_ip := coalesce(v_headers->>'x-forwarded-for', v_headers->>'x-real-ip');
  v_ua := v_headers->>'user-agent';

  if TG_OP = 'INSERT' then
    insert into public.audit_reservas(reserva_id, action, actor, new_row, ip_address, user_agent)
    values (new.id, TG_OP, auth.uid(), to_jsonb(new), v_ip, v_ua);
    return new;
  elsif TG_OP = 'UPDATE' then
    insert into public.audit_reservas(reserva_id, action, actor, old_row, new_row, ip_address, user_agent)
    values (new.id, TG_OP, auth.uid(), to_jsonb(old), to_jsonb(new), v_ip, v_ua);
    return new;
  elsif TG_OP = 'DELETE' then
    insert into public.audit_reservas(reserva_id, action, actor, old_row, ip_address, user_agent)
    values (old.id, TG_OP, auth.uid(), to_jsonb(old), v_ip, v_ua);
    return old;
  end if;
end;
$$;

drop trigger if exists log_reserva_change on public.reservas;
create trigger log_reserva_change
after insert or update or delete on public.reservas
for each row execute function public.log_reserva_change();
