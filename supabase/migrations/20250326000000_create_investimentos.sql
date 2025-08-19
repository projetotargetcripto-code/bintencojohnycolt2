create table if not exists public.investimentos (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    quota numeric not null,
    documento_url text,
    created_at timestamptz not null default now()
);

create index if not exists idx_investimentos_user on public.investimentos(user_id);

alter table public.investimentos enable row level security;

create policy investimentos_rls on public.investimentos for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
