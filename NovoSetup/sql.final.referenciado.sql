-- Estrutura consolidada com referências aos scripts existentes
-- Base deduzida do código-fonte + ajustes de app.final.sql e outros

-- Funções utilitárias (de app.final.sql)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create or replace function public.slugify(text)
returns text language sql immutable as $$
  select coalesce(nullif(regexp_replace(lower(unaccent($1)), '[^a-z0-9]+', '-', 'g'), ''), 'n-a');
$$;

create or replace function public.empreendimentos_set_defaults()
returns trigger language plpgsql as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := public.slugify(new.nome);
  end if;
  new.published := coalesce(new.status, '') = 'aprovado';
  return new;
end $$;

-- Tabela de filiais (estrutura deduzida + detalhes de app.final.sql)
create table if not exists public.filiais (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    kind text,
    owner_name text,
    owner_email text,
    billing_plan text,
    billing_status text,
    domain text,
    is_active boolean not null default true,
    status text not null default 'provisionando', -- app.final.sql
    created_at timestamptz not null default now()
);
create index if not exists idx_filiais_active on public.filiais(is_active); -- app.final.sql
create index if not exists idx_filiais_domain on public.filiais(domain); -- app.final.sql

-- Perfis de usuário (base deduzida + app.final.sql)
create table if not exists public.user_profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    email text,
    full_name text,
    role text not null,
    panels text[],
    is_active boolean not null default true,
    filial_id uuid references public.filiais(id),
    updated_at timestamptz default now()
);
create unique index if not exists user_profiles_email_key on public.user_profiles(email); -- app.final.sql
create index if not exists idx_up_filial on public.user_profiles(filial_id); -- app.final.sql
create trigger tg_up_updated_at before update on public.user_profiles
    for each row execute function public.set_updated_at(); -- app.final.sql

-- Controle de painéis permitidos por filial
create table if not exists public.filial_allowed_panels (
    filial_id uuid not null references public.filiais(id) on delete cascade,
    panel text not null,
    created_at timestamptz not null default now(), -- app.final.sql
    constraint filial_allowed_panels_pk primary key (filial_id, panel)
);

-- Empreendimentos (base deduzida + extras de app.final.sql)
create table if not exists public.empreendimentos (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    slug text not null,
    published boolean not null default false,
    bbox geometry(Polygon,4326),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    descricao text,
    status text not null default 'pendente',
    total_lotes integer default 0,
    bounds jsonb,
    geojson_url text,
    masterplan_url text,
    filial_id uuid references public.filiais(id),
    created_by uuid references auth.users(id),
    created_by_email text,
    approved_by uuid references auth.users(id),
    approved_at timestamptz,
    rejection_reason text
);
create index if not exists idx_emp_filial on public.empreendimentos(filial_id); -- app.final.sql
create index if not exists idx_emp_status on public.empreendimentos(status); -- app.final.sql
create index if not exists idx_emp_published on public.empreendimentos(published); -- app.final.sql
create unique index if not exists idx_emp_slug on public.empreendimentos(slug); -- app.final.sql
create index if not exists idx_emp_bbox on public.empreendimentos using gist (bbox); -- app.final.sql
create trigger tg_emp_set_defaults before insert or update on public.empreendimentos
    for each row execute function public.empreendimentos_set_defaults(); -- app.final.sql

-- Lotes (base deduzida + app.final.sql)
create table if not exists public.lotes (
    id uuid primary key default gen_random_uuid(),
    empreendimento_id uuid not null references public.empreendimentos(id) on delete cascade,
    filial_id uuid references public.filiais(id) on delete cascade,
    nome text,
    numero integer,
    status text default 'disponivel',
    area_m2 numeric,
    perimetro_m numeric,
    area_hectares numeric,
    valor numeric default 0.00,
    preco numeric,
    coordenadas jsonb,
    geometria jsonb,
    properties jsonb,
    comprador_nome text,
    comprador_email text,
    data_venda timestamptz,
    observacoes text,
    geom geometry,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    codigo text
);
create index if not exists idx_lotes_emp on public.lotes(empreendimento_id); -- app.final.sql
create index if not exists idx_lotes_status on public.lotes(status); -- app.final.sql
create index if not exists idx_lotes_filial on public.lotes(filial_id); -- app.final.sql
create index if not exists idx_lotes_geom on public.lotes using gist (geom); -- app.final.sql
create trigger tg_lotes_sync_valor_preco before insert or update on public.lotes
    for each row execute function public.sync_valor_preco(); -- app.final.sql
create trigger tg_lotes_updated_at before update on public.lotes
    for each row execute function public.set_updated_at(); -- app.final.sql

create or replace function public.sync_valor_preco()
returns trigger language plpgsql as $$
begin
  if new.preco is not null and (new.valor is null or TG_OP = 'INSERT') then
    new.valor := new.preco;
  elsif new.valor is not null and (new.preco is null or TG_OP = 'INSERT') then
    new.preco := new.valor;
  end if;
  return new;
end $$; -- app.final.sql

-- Overlays de masterplan (base deduzida + app.final.sql)
create table if not exists public.masterplan_overlays (
    id uuid primary key default gen_random_uuid(),
    empreendimento_id uuid not null references public.empreendimentos(id) on delete cascade,
    filial_id uuid references public.filiais(id) on delete cascade,
    image_path text not null,
    bounds jsonb not null,
    opacity numeric(4,2) not null default 0.5,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz default now()
);
create index if not exists idx_mpo_emp on public.masterplan_overlays(empreendimento_id); -- app.final.sql
create index if not exists idx_mpo_is_active on public.masterplan_overlays(is_active); -- app.final.sql
create index if not exists idx_mpo_filial on public.masterplan_overlays(filial_id); -- app.final.sql
create trigger tg_mpo_updated_at before update on public.masterplan_overlays
    for each row execute function public.set_updated_at(); -- app.final.sql

-- Testemunhos (deduzido do código, sem referência externa)
create table if not exists public.testemunhos (
    id serial primary key,
    quote text,
    name text,
    role text
);

-- Políticas de Storage
-- Esta seção é a fonte de verdade para as políticas do bucket 'empreendimentos'
create policy "Authenticated users can upload files"
  on storage.objects for insert
  with check (bucket_id = 'empreendimentos' and auth.role() = 'authenticated');

create policy "Public can view files"
  on storage.objects for select
  using (bucket_id = 'empreendimentos');

create policy "Authenticated users can update files"
  on storage.objects for update
  using (bucket_id = 'empreendimentos' and auth.role() = 'authenticated');

create policy "Authenticated users can delete files"
  on storage.objects for delete
  using (bucket_id = 'empreendimentos' and auth.role() = 'authenticated');

-- Políticas RLS padrão (de app.final.sql)
alter table public.filiais enable row level security;
alter table public.empreendimentos enable row level security;
alter table public.user_profiles enable row level security;
alter table public.lotes enable row level security;
alter table public.masterplan_overlays enable row level security;
alter table public.filial_allowed_panels enable row level security;

create policy filiais_rls on public.filiais for all
  using (id = current_setting('request.jwt.claims.filial_id', true)::uuid)
  with check (id = current_setting('request.jwt.claims.filial_id', true)::uuid); -- app.final.sql

create policy empreendimentos_rls on public.empreendimentos for all
  using (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid)
  with check (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid); -- app.final.sql

create policy user_profiles_rls on public.user_profiles for all
  using (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid)
  with check (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid); -- app.final.sql

create policy lotes_rls on public.lotes for all
  using (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid)
  with check (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid); -- app.final.sql

create policy masterplan_overlays_rls on public.masterplan_overlays for all
  using (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid)
  with check (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid); -- app.final.sql

create policy filial_allowed_panels_rls on public.filial_allowed_panels for all
  using (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid)
  with check (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid); -- app.final.sql

