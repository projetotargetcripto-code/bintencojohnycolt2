create table if not exists public.terrenistas (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    filial_id uuid not null references public.filiais(id) on delete cascade,
    created_at timestamptz default now()
);

create index if not exists idx_terrenistas_user on public.terrenistas(user_id);
create index if not exists idx_terrenistas_filial on public.terrenistas(filial_id);

alter table public.terrenistas enable row level security;

create policy terrenistas_rls on public.terrenistas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.repasses (
    id uuid primary key default gen_random_uuid(),
    terrenista_id uuid not null references public.terrenistas(id) on delete cascade,
    filial_id uuid not null references public.filiais(id) on delete cascade,
    valor numeric not null,
    doc_url text,
    created_at timestamptz default now()
);

create index if not exists idx_repasses_terrenista on public.repasses(terrenista_id);
create index if not exists idx_repasses_filial on public.repasses(filial_id);

alter table public.repasses enable row level security;

create policy repasses_rls on public.repasses for all
  using (
    exists (
      select 1 from public.terrenistas t
      where t.id = terrenista_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.terrenistas t
      where t.id = terrenista_id and t.user_id = auth.uid()
    )
  );
