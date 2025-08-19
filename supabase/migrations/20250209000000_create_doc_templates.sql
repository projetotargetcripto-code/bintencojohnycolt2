create table if not exists public.doc_templates (
    id uuid primary key default gen_random_uuid(),
    filial_id uuid references filiais(id),
    name text not null,
    storage_path text not null,
    created_at timestamp with time zone default now()
);
