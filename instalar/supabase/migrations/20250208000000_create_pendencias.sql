create table if not exists public.pendencias (
    id uuid primary key default gen_random_uuid(),
    tipo text not null,
    entidade_id uuid not null,
    status text not null default 'pendente',
    dados jsonb,
    rejection_reason text,
    created_at timestamp with time zone default now()
);
