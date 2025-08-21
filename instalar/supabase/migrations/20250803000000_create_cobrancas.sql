create table if not exists public.cobrancas (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    filial_id uuid not null references public.filiais(id) on delete cascade,
    valor numeric(12,2) not null,
    status text not null default 'pendente',
    created_at timestamptz default now(),
    constraint cobrancas_status_check check (status in ('pendente','pago','cancelado'))
);

create index if not exists idx_cobrancas_user on public.cobrancas(user_id);
create index if not exists idx_cobrancas_filial on public.cobrancas(filial_id);

alter table public.cobrancas enable row level security;

create policy cobrancas_rls on public.cobrancas for all
  using (
    filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid
    or auth.uid() = user_id
  )
  with check (
    filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid
    or auth.uid() = user_id
  );
