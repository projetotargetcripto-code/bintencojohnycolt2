create table if not exists public.renegociacoes (
    id uuid primary key default gen_random_uuid(),
    reserva_id uuid not null references public.reservas(id) on delete cascade,
    email text not null,
    status text not null default 'pending',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create trigger tg_renegociacoes_updated_at before update on public.renegociacoes
    for each row execute function public.set_updated_at();

alter table public.renegociacoes enable row level security;

create policy renegociacoes_rls on public.renegociacoes for all
  using (true) with check (true);

create table if not exists public.audit_renegociacoes (
    id uuid primary key default gen_random_uuid(),
    renegociacao_id uuid not null,
    action text not null,
    actor uuid,
    old_row jsonb,
    new_row jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz not null default now()
);

create or replace function public.log_renegociacao_change()
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
    insert into public.audit_renegociacoes(renegociacao_id, action, actor, new_row, ip_address, user_agent)
    values (new.id, TG_OP, auth.uid(), to_jsonb(new), v_ip, v_ua);
    return new;
  elsif TG_OP = 'UPDATE' then
    insert into public.audit_renegociacoes(renegociacao_id, action, actor, old_row, new_row, ip_address, user_agent)
    values (new.id, TG_OP, auth.uid(), to_jsonb(old), to_jsonb(new), v_ip, v_ua);
    return new;
  elsif TG_OP = 'DELETE' then
    insert into public.audit_renegociacoes(renegociacao_id, action, actor, old_row, ip_address, user_agent)
    values (old.id, TG_OP, auth.uid(), to_jsonb(old), v_ip, v_ua);
    return old;
  end if;
end;
$$;

drop trigger if exists log_renegociacao_change on public.renegociacoes;
create trigger log_renegociacao_change
after insert or update or delete on public.renegociacoes
for each row execute function public.log_renegociacao_change();
