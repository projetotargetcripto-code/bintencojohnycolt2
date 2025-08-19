create table if not exists public.conciliacoes (
    id uuid primary key default gen_random_uuid(),
    tipo text not null,
    referencia text,
    valor numeric,
    status text not null default 'pendente',
    dados jsonb,
    conciliado_em timestamp with time zone,
    created_at timestamp with time zone default now()
);
