create table if not exists public.reservas (
    id uuid primary key default gen_random_uuid(),
    lote_id uuid not null references public.lotes(id) on delete cascade,
    filial_id uuid not null references public.filiais(id) on delete cascade,
    nome text,
    email text,
    telefone text,
    expires_at timestamptz not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_reservas_lote on public.reservas(lote_id);
create index if not exists idx_reservas_filial on public.reservas(filial_id);

create or replace function public.reservas_set_filial()
returns trigger language plpgsql as $$
begin
  select filial_id into new.filial_id from public.lotes where id = new.lote_id;
  return new;
end $$;

create trigger tg_reservas_set_filial before insert on public.reservas
    for each row execute function public.reservas_set_filial();

create trigger tg_reservas_updated_at before update on public.reservas
    for each row execute function public.set_updated_at();

alter table public.reservas enable row level security;

create policy reservas_rls on public.reservas for all
  using (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid)
  with check (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid);
