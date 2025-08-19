create table if not exists public.doc_templates (
    id uuid primary key default gen_random_uuid(),
    filial_id uuid references public.filiais(id) on delete cascade,
    name text not null,
    storage_path text not null,
    created_at timestamp with time zone default now()
);

create index if not exists idx_doc_templates_filial on public.doc_templates(filial_id);

alter table public.doc_templates enable row level security;
create policy doc_templates_filial_policy on public.doc_templates
  using (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid)
  with check (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid);
