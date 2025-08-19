-- Add filial_id FK to terrenistas and repasses and enforce RLS

alter table if exists public.terrenistas
  add column if not exists filial_id uuid references public.filiais(id) on delete cascade;

create index if not exists idx_terrenistas_filial on public.terrenistas(filial_id);

alter table if exists public.repasses
  add column if not exists filial_id uuid references public.filiais(id) on delete cascade;

create index if not exists idx_repasses_filial on public.repasses(filial_id);

-- Ensure tables have RLS enabled
alter table if exists public.terrenistas enable row level security;
alter table if exists public.repasses enable row level security;

-- Terrenistas: owner access only within same filial
create policy if not exists terrenistas_owner
  on public.terrenistas for all
  using (user_id = auth.uid() and filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid)
  with check (user_id = auth.uid() and filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid);

-- Repasses: owner access only via terrenista relationship and filial match
create policy if not exists repasses_owner
  on public.repasses for all
  using (
    filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid
    and terrenista_id in (select id from public.terrenistas where user_id = auth.uid())
  )
  with check (
    filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid
    and terrenista_id in (select id from public.terrenistas where user_id = auth.uid())
  );
