-- Estrutura deduzida a partir do código fonte (sem consultar scripts SQL existentes)

create table filiais (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    created_at timestamptz default now(),
    kind text,
    owner_name text,
    owner_email text,
    billing_plan text,
    billing_status text,
    domain text,
    is_active boolean default true,
    status text
);

create table user_profiles (
    user_id uuid primary key references auth.users(id),
    email text,
    full_name text,
    role text,
    filial_id uuid references filiais(id),
    panels text[],
    is_active boolean default true,
    created_at timestamptz default now()
);

create table filial_allowed_panels (
    filial_id uuid references filiais(id) on delete cascade,
    panel text not null,
    primary key (filial_id, panel)
);

create table empreendimentos (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    descricao text,
    total_lotes integer,
    bounds jsonb,
    geojson_url text,
    masterplan_url text,
    filial_id uuid references filiais(id),
    status text default 'pendente',
    created_by uuid references auth.users(id),
    created_by_email text,
    approved_by uuid references auth.users(id),
    approved_at timestamptz,
    rejection_reason text,
    created_at timestamptz default now()
);

create table lotes (
    id uuid primary key default gen_random_uuid(),
    empreendimento_id uuid references empreendimentos(id) on delete cascade,
    nome text,
    numero integer,
    status text default 'disponivel',
    area_m2 numeric,
    perimetro_m numeric,
    area_hectares numeric,
    valor numeric,
    preco numeric,
    comprador_nome text,
    comprador_email text,
    observacoes text,
    codigo text
);

create table masterplan_overlays (
    id uuid primary key default gen_random_uuid(),
    empreendimento_id uuid references empreendimentos(id) on delete cascade,
    image_path text not null,
    bounds jsonb not null,
    opacity numeric,
    is_active boolean default true
);

create table testemunhos (
    id serial primary key,
    quote text,
    name text,
    role text
);

