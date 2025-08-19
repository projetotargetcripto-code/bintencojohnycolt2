create table if not exists public.cobrancas (
    id uuid primary key default gen_random_uuid(),
    filial_id uuid not null references public.filiais(id) on delete cascade,
    valor numeric not null,
    descricao text,
    status text not null default 'pendente',
    vencimento date,
    created_at timestamp with time zone default now()
);
