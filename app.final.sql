-- ===============================================================
-- BlockURB · app.final.sql (CORRIGIDO v4 - compat com schema atual)
-- Compatibilidade com seu estado atual de 'empreendimentos' (slug/published/bbox).
-- Garante colunas que faltam (ex.: filial_id) e políticas que funcionam
-- mesmo se ainda não houver user_profiles/filiais.
-- ===============================================================

-- ============== EXTENSIONS ====================
create extension if not exists "pgcrypto";
create extension if not exists "postgis";
create extension if not exists "unaccent";

-- ============== HELPERS =======================
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
  if new.bounds is not null then
    begin
      new.bbox := ST_MakeEnvelope(
        (new.bounds->'sw'->>1)::double precision,
        (new.bounds->'sw'->>0)::double precision,
        (new.bounds->'ne'->>1)::double precision,
        (new.bounds->'ne'->>0)::double precision,
        4326
      );
    exception when others then
      new.bbox := null;
    end;
  end if;
  return new;
end;
$$;

-- ============== TABLES ========================
-- FILIAIS
create table if not exists public.filiais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  kind text null,
  owner_name text null,
  owner_email text null,
  billing_plan text null,
  billing_status text null,
  domain text null,
  is_active boolean not null default true,
  status text not null default 'provisionando',
  created_at timestamptz not null default now()
);
alter table public.filiais add column if not exists kind text;
alter table public.filiais add column if not exists owner_name text;
alter table public.filiais add column if not exists owner_email text;
alter table public.filiais add column if not exists billing_plan text;
alter table public.filiais add column if not exists billing_status text;
alter table public.filiais add column if not exists domain text;
alter table public.filiais add column if not exists is_active boolean not null default true;
alter table public.filiais add column if not exists status text not null default 'provisionando';
alter table public.filiais add column if not exists created_at timestamptz not null default now();
create index if not exists idx_filiais_active on public.filiais(is_active);
create index if not exists idx_filiais_domain on public.filiais(domain);

-- EMPREENDIMENTOS (compat: mantemos suas colunas e adicionamos as novas)
create table if not exists public.empreendimentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null,
  published boolean not null default false,
  bbox geometry(Polygon,4326),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- adiciona colunas usadas pelo app, sem quebrar seu schema atual
alter table public.empreendimentos add column if not exists descricao text;
alter table public.empreendimentos add column if not exists status text not null default 'pendente';
alter table public.empreendimentos add column if not exists total_lotes integer default 0;
alter table public.empreendimentos add column if not exists bounds jsonb;
alter table public.empreendimentos add column if not exists geojson_url text;
alter table public.empreendimentos add column if not exists masterplan_url text;
alter table public.empreendimentos add column if not exists filial_id uuid;
alter table public.empreendimentos add column if not exists created_by uuid;
alter table public.empreendimentos add column if not exists created_by_email text;
alter table public.empreendimentos add column if not exists approved_by uuid;
alter table public.empreendimentos add column if not exists approved_at timestamptz;
alter table public.empreendimentos add column if not exists rejection_reason text;
-- FK condicional
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'empreendimentos_filial_id_fkey'
      and conrelid = 'public.empreendimentos'::regclass
  ) then
    alter table public.empreendimentos
      add constraint empreendimentos_filial_id_fkey
      foreign key (filial_id) references public.filiais(id) on delete cascade;
  end if;
end $$;
create index if not exists idx_emp_filial on public.empreendimentos(filial_id);
create index if not exists idx_emp_status on public.empreendimentos(status);
create index if not exists idx_emp_published on public.empreendimentos(published);
create unique index if not exists idx_emp_slug on public.empreendimentos(slug);
create index if not exists idx_emp_bbox on public.empreendimentos using gist (bbox);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'tg_emp_set_defaults') then
    create trigger tg_emp_set_defaults
    before insert or update on public.empreendimentos
    for each row execute function public.empreendimentos_set_defaults();
  end if;
end $$;

-- USER_PROFILES
create table if not exists public.user_profiles (
  user_id uuid primary key,
  email text,
  full_name text,
  role text not null,
  panels text[],
  is_active boolean not null default true,
  filial_id uuid,
  updated_at timestamptz default now()
);
alter table public.user_profiles add column if not exists email text;
alter table public.user_profiles add column if not exists full_name text;
alter table public.user_profiles add column if not exists role text;
alter table public.user_profiles alter column role set not null;
alter table public.user_profiles add column if not exists panels text[];
alter table public.user_profiles add column if not exists is_active boolean not null default true;
alter table public.user_profiles add column if not exists filial_id uuid;
alter table public.user_profiles add column if not exists updated_at timestamptz default now();
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_profiles_user_id_fkey'
      and conrelid = 'public.user_profiles'::regclass
  ) then
    alter table public.user_profiles
      add constraint user_profiles_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_profiles_filial_id_fkey'
      and conrelid = 'public.user_profiles'::regclass
  ) then
    alter table public.user_profiles
      add constraint user_profiles_filial_id_fkey
      foreign key (filial_id) references public.filiais(id);
  end if;
end $$;
create unique index if not exists user_profiles_email_key on public.user_profiles(email);
create index if not exists idx_up_filial on public.user_profiles(filial_id);

-- TRIGGER updated_at em user_profiles
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'tg_up_updated_at') then
    create trigger tg_up_updated_at before update on public.user_profiles
    for each row execute function public.set_updated_at();
  end if;
end$$;

-- LOTES
create table if not exists public.lotes (
  id uuid primary key default gen_random_uuid(),
  empreendimento_id uuid not null references public.empreendimentos(id) on delete cascade,
  filial_id uuid references public.filiais(id) on delete cascade,
  nome text not null,
  numero integer,
  status text not null default 'disponivel',
  area_m2 numeric(10,2),
  perimetro_m numeric(10,2),
  area_hectares numeric(12,4),
  valor numeric(12,2) default 0.00,
  preco numeric(12,2),
  coordenadas jsonb,
  geometria jsonb,
  properties jsonb,
  comprador_nome text,
  comprador_email text,
  data_venda timestamptz,
  observacoes text,
  geom geometry,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);
-- ==== Compat: garante colunas requeridas em LOTES (caso a tabela preexista sem elas)
alter table public.lotes add column if not exists nome text;
alter table public.lotes add column if not exists numero integer;
alter table public.lotes add column if not exists status text;
alter table public.lotes alter column status drop not null;
alter table public.lotes alter column status set default 'disponivel';
alter table public.lotes add column if not exists area_m2 numeric(10,2);
alter table public.lotes add column if not exists perimetro_m numeric(10,2);
alter table public.lotes add column if not exists area_hectares numeric(12,4);
alter table public.lotes add column if not exists valor numeric(12,2) default 0.00;
alter table public.lotes add column if not exists preco numeric(12,2);
alter table public.lotes add column if not exists coordenadas jsonb;
alter table public.lotes add column if not exists geometria jsonb;
alter table public.lotes add column if not exists properties jsonb;
alter table public.lotes add column if not exists comprador_nome text;
alter table public.lotes add column if not exists comprador_email text;
alter table public.lotes add column if not exists data_venda timestamptz;
alter table public.lotes add column if not exists filial_id uuid;
alter table public.lotes add column if not exists geom geometry;
alter table public.lotes add column if not exists created_at timestamptz default now();
alter table public.lotes add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'lotes_filial_id_fkey'
      and conrelid = 'public.lotes'::regclass
  ) then
    alter table public.lotes
      add constraint lotes_filial_id_fkey
      foreign key (filial_id) references public.filiais(id) on delete cascade;
  end if;
end $$;

create index if not exists idx_lotes_filial on public.lotes(filial_id);
update public.lotes l
  set filial_id = e.filial_id
  from public.empreendimentos e
  where l.empreendimento_id = e.id and l.filial_id is null;

create index if not exists idx_lotes_emp on public.lotes(empreendimento_id);
create index if not exists idx_lotes_status on public.lotes(status);
create index if not exists idx_lotes_geom on public.lotes using gist (geom);

-- triggers dos lotes
create or replace function public.sync_valor_preco()
returns trigger language plpgsql as $$
begin
  if new.preco is not null and (new.valor is null or TG_OP = 'INSERT') then
    new.valor := new.preco;
  elsif new.valor is not null and (new.preco is null or TG_OP = 'INSERT') then
    new.preco := new.valor;
  end if;
  return new;
end $$;
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'tg_lotes_sync_valor_preco') then
    create trigger tg_lotes_sync_valor_preco
    before insert or update on public.lotes
    for each row execute function public.sync_valor_preco();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'tg_lotes_updated_at') then
    create trigger tg_lotes_updated_at
    before update on public.lotes
    for each row execute function public.set_updated_at();
  end if;
end$$;

-- MASTERPLAN OVERLAYS
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
create index if not exists idx_mpo_emp on public.masterplan_overlays(empreendimento_id);
create index if not exists idx_mpo_is_active on public.masterplan_overlays(is_active);
alter table public.masterplan_overlays add column if not exists filial_id uuid;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'masterplan_overlays_filial_id_fkey'
      and conrelid = 'public.masterplan_overlays'::regclass
  ) then
    alter table public.masterplan_overlays
      add constraint masterplan_overlays_filial_id_fkey
      foreign key (filial_id) references public.filiais(id) on delete cascade;
  end if;
end $$;
create index if not exists idx_mpo_filial on public.masterplan_overlays(filial_id);
update public.masterplan_overlays mpo
  set filial_id = e.filial_id
  from public.empreendimentos e
  where mpo.empreendimento_id = e.id and mpo.filial_id is null;
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'tg_mpo_updated_at') then
    create trigger tg_mpo_updated_at
    before update on public.masterplan_overlays
    for each row execute function public.set_updated_at();
  end if;
end$$;

-- Filial Allowed Panels
create table if not exists public.filial_allowed_panels (
  filial_id uuid not null references public.filiais(id) on delete cascade,
  panel text not null,
  created_at timestamptz not null default now(),
  constraint filial_allowed_panels_pk primary key (filial_id, panel)
);

-- ============== SEED / COMPAT ================
-- Cria uma filial "Default" e associa empreendimentos sem filial_id a ela
do $$
declare fid uuid;
begin
  if not exists (select 1 from public.filiais) then
    insert into public.filiais (nome, is_active) values ('Default', true) returning id into fid;
  else
    select id into fid from public.filiais order by created_at asc limit 1;
  end if;
  update public.empreendimentos set filial_id = coalesce(filial_id, fid);
end $$;

-- ============== FUNÇÕES ADMIN ================
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.user_profiles up
    where up.user_id = uid and up.is_active and lower(up.role) in ('admin','superadmin')
  );
$$;
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select public.is_admin(auth.uid());
$$;

-- ============== RLS ===========================
alter table public.filiais enable row level security;
alter table public.empreendimentos enable row level security;
alter table public.user_profiles enable row level security;
alter table public.lotes enable row level security;
alter table public.masterplan_overlays enable row level security;
alter table public.filial_allowed_panels enable row level security;

-- FILIAIS
drop policy if exists filiais_rls on public.filiais;
create policy filiais_rls on public.filiais
for all using (id = current_setting('request.jwt.claims.filial_id', true)::uuid)
with check (id = current_setting('request.jwt.claims.filial_id', true)::uuid);

-- EMPREENDIMENTOS (libera público se published=true)
drop policy if exists empreendimentos_rls on public.empreendimentos;
create policy empreendimentos_rls on public.empreendimentos
for all using (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid)
with check (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid);

-- USER_PROFILES
drop policy if exists user_profiles_rls on public.user_profiles;
create policy user_profiles_rls on public.user_profiles
for all using (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid)
with check (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid);

-- LOTES (libera público via published do empreendimento)
drop policy if exists lotes_rls on public.lotes;
create policy lotes_rls on public.lotes
for all using (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid)
with check (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid);

-- MASTERPLAN_OVERLAYS (segue a mesma lógica)
drop policy if exists masterplan_overlays_rls on public.masterplan_overlays;
create policy masterplan_overlays_rls on public.masterplan_overlays
for all using (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid)
with check (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid);

-- FILIAL_ALLOWED_PANELS
drop policy if exists filial_allowed_panels_rls on public.filial_allowed_panels;
create policy filial_allowed_panels_rls on public.filial_allowed_panels
for all using (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid)
with check (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid);

-- ============== RPCs ==========================
create or replace function public.get_my_allowed_panels()
returns text[] language sql stable as $$
  with me as (
    select role, filial_id
    from public.user_profiles
    where user_id = auth.uid() and is_active
    limit 1
  ), panels as (
    select panel from public.filial_allowed_panels fap
    join me on me.filial_id = fap.filial_id
    union
    select 'adminfilial' as panel from me where me.role = 'adminfilial'
  )
  select coalesce(array_agg(panel order by panel), array[]::text[])
  from panels;
$$;

create or replace function public.get_my_profile()
returns table(role text, filial_id uuid, is_active boolean, panels text[]) language sql stable as $$
  with up as (
    select role, filial_id, is_active, panels
    from public.user_profiles
    where user_id = auth.uid()
    limit 1
  ),
  allowed as (
    select array_agg(panel) as panels
    from public.filial_allowed_panels
    where filial_id = (select filial_id from up)
  ),
  merged as (
    select array_agg(distinct panel) as panels from (
      select unnest(coalesce((select panels from up), array[]::text[])) as panel
      union
      select unnest(coalesce((select panels from allowed), array[]::text[])) as panel
      union
      select 'adminfilial' as panel where (select role from up) = 'adminfilial'
    ) s
  )
  select
    coalesce(auth.jwt()->>'role', (select role from up), 'user') as role,
    (select filial_id from up) as filial_id,
    coalesce((select is_active from up), true) as is_active,
    coalesce((select panels from merged), array[]::text[]) as panels;
$$;

create or replace function public.set_filial_allowed_panels(p_filial_id uuid, p_panels text[])
returns void language plpgsql as $$
begin
  delete from public.filial_allowed_panels where filial_id = p_filial_id;
  insert into public.filial_allowed_panels (filial_id, panel)
  select p_filial_id, unnest(p_panels);
end $$;

create or replace function public.update_lote_status(p_lote_id uuid, p_novo_status text)
returns boolean language plpgsql as $$
begin
  update public.lotes
     set status = p_novo_status,
         data_venda = case when lower(p_novo_status) = 'vendido' then now() else null end
   where id = p_lote_id;
  return found;
end $$;

create or replace function public.update_lote_valor(p_lote_id uuid, p_novo_valor numeric)
returns boolean language plpgsql as $$
begin
  update public.lotes set valor = p_novo_valor, preco = p_novo_valor where id = p_lote_id;
  return found;
end $$;

create or replace function public.lotes_geojson(p_empreendimento_id uuid)
returns jsonb language sql stable as $$
  with feats as (
    select jsonb_build_object(
      'type','Feature',
      'geometry', coalesce(l.geometria, to_jsonb(st_asgeojson(l.geom)::json)),
      'properties', jsonb_build_object(
        'id', l.id,
        'nome', l.nome,
        'numero', l.numero,
        'status', l.status,
        'valor', l.valor,
        'preco', l.valor,
        'area_m2', l.area_m2
      )
    ) as f
    from public.lotes l
    where l.empreendimento_id = p_empreendimento_id
  )
  select jsonb_build_object('type','FeatureCollection','features', coalesce(jsonb_agg(f), '[]'::jsonb))
  from feats;
$$;

create or replace function public.get_filial_empreendimentos(p_filial_id uuid)
returns table(empreendimento_id uuid) language sql stable as $$
  select e.id as empreendimento_id
  from public.empreendimentos e
  where e.filial_id = p_filial_id;
$$;

create or replace function public.get_empreendimento_lotes(p_empreendimento_id uuid)
returns table(
  id uuid, nome text, numero integer, status text,
  area_m2 numeric, preco numeric, coordenadas jsonb, geometria jsonb,
  comprador_nome text, comprador_email text, data_venda timestamptz
) language sql stable as $$
  select l.id, l.nome, l.numero, l.status,
         l.area_m2, coalesce(l.preco, l.valor) as preco, l.coordenadas, l.geometria,
         l.comprador_nome, l.comprador_email, l.data_venda
  from public.lotes l
  where l.empreendimento_id = p_empreendimento_id;
$$;

create or replace function public.get_all_empreendimentos_overview()
returns table(empreendimento_id uuid) language sql stable as $$
  select id as empreendimento_id from public.empreendimentos;
$$;

create or replace function public.approve_empreendimento(p_empreendimento_id uuid, p_approved boolean, p_reason text default null)
returns void language plpgsql as $$
begin
  if p_approved then
    update public.empreendimentos
       set status = 'aprovado', approved_by = auth.uid(), approved_at = now(), rejection_reason = null
     where id = p_empreendimento_id;
  else
    update public.empreendimentos
       set status = 'rejeitado', approved_by = auth.uid(), approved_at = now(), rejection_reason = coalesce(p_reason, 'rejeitado')
     where id = p_empreendimento_id;
  end if;
end $$;

create or replace function public.get_vendas_stats(p_empreendimento_id uuid)
returns table(
  total_lotes int,
  lotes_disponiveis int,
  lotes_reservados int,
  lotes_vendidos int,
  receita_total numeric,
  percentual_vendido numeric
) language sql stable as $$
  with base as (
    select
      count(*)::int as total_lotes,
      count(*) filter (where status = 'disponivel')::int as lotes_disponiveis,
      count(*) filter (where status = 'reservado')::int as lotes_reservados,
      count(*) filter (where status = 'vendido')::int as lotes_vendidos,
      coalesce(sum(case when status = 'vendido' then coalesce(preco, valor) end),0)::numeric as receita_total
    from public.lotes
    where empreendimento_id = p_empreendimento_id
  )
  select
    b.total_lotes,
    b.lotes_disponiveis,
    b.lotes_reservados,
    b.lotes_vendidos,
    b.receita_total,
    case when b.total_lotes > 0 then round((b.lotes_vendidos::numeric / b.total_lotes::numeric) * 100, 2) else 0 end as percentual_vendido
  from base b;
$$;

create or replace function public.admin_update_user_role(p_user_id uuid, p_role text)
returns void language plpgsql as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'admin required'; end if;
  update public.user_profiles set role = p_role, updated_at = now() where user_id = p_user_id;
end $$;

create or replace function public.admin_set_user_filial(p_user_id uuid, p_filial_id uuid)
returns void language plpgsql as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'admin required'; end if;
  update public.user_profiles set filial_id = p_filial_id, updated_at = now() where user_id = p_user_id;
end $$;

create or replace function public.admin_set_user_panels(p_user_id uuid, p_panels text[])
returns void language plpgsql as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'admin required'; end if;
  update public.user_profiles set panels = p_panels, updated_at = now() where user_id = p_user_id;
end $$;

create or replace function public.admin_update_filial_info(
  p_filial_id uuid,
  p_kind text,
  p_owner_name text default null,
  p_owner_email text default null,
  p_billing_plan text default null,
  p_billing_status text default null,
  p_domain text default null
)
returns void language plpgsql as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'admin required'; end if;
  update public.filiais
     set kind = p_kind,
         owner_name = p_owner_name,
         owner_email = p_owner_email,
         billing_plan = p_billing_plan,
         billing_status = p_billing_status,
         domain = p_domain
   where id = p_filial_id;
end $$;

create or replace function public.admin_list_users()
returns setof auth.users
language plpgsql
security definer
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin required';
  end if;
  return query select * from auth.users;
end $$;
grant execute on function public.admin_list_users() to authenticated;

create or replace function public.process_geojson_lotes(
  p_empreendimento_id uuid,
  p_geojson jsonb,
  p_empreendimento_nome text
) returns void language plpgsql security definer as $$
declare
  feature jsonb;
  lote_nome_original text;
  lote_nome_final text;
  lote_numero int;
  geom_json jsonb;
  coords jsonb;
begin
  delete from public.lotes where empreendimento_id = p_empreendimento_id;

  for feature in select jsonb_array_elements(p_geojson->'features')
  loop
    lote_nome_original := coalesce(
      feature->'properties'->>'Name',
      feature->'properties'->>'name',
      'Lote'
    );
    lote_nome_final := p_empreendimento_nome || ' - ' || lote_nome_original;

    begin
      lote_numero := (regexp_match(lote_nome_original, '\d+'))[1]::int;
    exception when others then
      lote_numero := null;
    end;

    geom_json := feature->'geometry';
    coords := case
      when geom_json ? 'coordinates' then
        to_jsonb(jsonb_build_object('lat', (geom_json->'coordinates'->0->0->1), 'lng', (geom_json->'coordinates'->0->0->0)))
      else null end;

    insert into public.lotes(empreendimento_id, nome, numero, status, area_m2, preco, valor, coordenadas, geometria, geom)
    values (
      p_empreendimento_id,
      lote_nome_final,
      lote_numero,
      'disponivel',
      null,
      null,
      null,
      coords,
      geom_json,
      case when geom_json is not null then st_geomfromgeojson(geom_json::text) else null end
    );
  end loop;
end $$;
