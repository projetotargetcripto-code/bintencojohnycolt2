create table if not exists public.vendas (
    id uuid primary key default gen_random_uuid(),
    lote_id uuid not null references public.lotes(id) on delete cascade,
    filial_id uuid not null references public.filiais(id) on delete cascade,
    corretor_id uuid not null references auth.users(id) on delete cascade,
    valor numeric not null,
    comissao numeric not null,
    created_at timestamptz default now()
);

create index if not exists idx_vendas_filial on public.vendas(filial_id);
create index if not exists idx_vendas_corretor on public.vendas(corretor_id);

alter table public.vendas enable row level security;

create policy vendas_rls on public.vendas for all
  using (
    filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid and
    corretor_id = current_setting('request.jwt.claims.corretor_id', true)::uuid
  )
  with check (
    filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid and
    corretor_id = current_setting('request.jwt.claims.corretor_id', true)::uuid
  );
