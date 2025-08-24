-- Banco de dados unificado gerado a partir dos scripts do repositório

-- INICIO: NovoSetup/sql/sql.final.referenciado.sql
-- Estrutura consolidada com referências aos scripts existentes
-- Base deduzida do código-fonte + ajustes de app.final.sql e outros

-- Extensões necessárias
create extension if not exists unaccent;
create extension if not exists postgis;
create extension if not exists pgcrypto;

-- Cria papeis de aplicação caso ainda não existam
do $$
declare
  r text;
begin
  for r in select unnest(array[
    'superadmin','adminfilial','urbanista','juridico','contabilidade',
    'marketing','comercial','imobiliaria','corretor','obras',
    'investidor','terrenista'])
  loop
    if not exists (select 1 from pg_roles where rolname = r) then
      execute format('create role %I', r);
    end if;
  end loop;
end;
$$ language plpgsql;

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

-- Preenche user_profiles ao criar um novo usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'investidor');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Auditoria de mudanças de cargo/painéis
create table if not exists public.audit_role_changes (
    changed_at timestamptz default now(),
    actor_id uuid,
    target_user uuid,
    old_role text,
    new_role text,
    old_panels text[],
    new_panels text[]
);

create or replace function public.log_role_change()
returns trigger language plpgsql as $$
begin
  if (old.role is distinct from new.role) or (old.panels is distinct from new.panels) then
    insert into public.audit_role_changes(actor_id, target_user, old_role, new_role, old_panels, new_panels)
    values (auth.uid(), new.user_id, old.role, new.role, old.panels, new.panels);
  end if;
  return new;
end;
$$;

create trigger tg_audit_role_changes
after update on public.user_profiles
for each row execute function public.log_role_change();

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
    lotes_vendidos integer default 0,
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
create index if not exists idx_empreendimentos_created_by on public.empreendimentos(created_by);
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

create trigger tg_lotes_sync_valor_preco before insert or update on public.lotes
    for each row execute function public.sync_valor_preco(); -- app.final.sql
create trigger tg_lotes_updated_at before update on public.lotes
    for each row execute function public.set_updated_at(); -- app.final.sql

-- Funções de geometria para lotes interativos
create or replace function public.calculate_polygon_area(coordinates jsonb)
returns decimal as $$
declare
    coords jsonb;
    area decimal := 0;
    i integer;
    lat1 decimal;
    lng1 decimal;
    lat2 decimal;
    lng2 decimal;
begin
    -- Pega o primeiro array de coordenadas (exterior ring)
    coords := coordinates->0;

    -- Calcula área usando fórmula do shoelace (aproximada)
    for i in 0..(jsonb_array_length(coords) - 2) loop
        lat1 := (coords->i->1)::decimal;
        lng1 := (coords->i->0)::decimal;
        lat2 := (coords->(i+1)->1)::decimal;
        lng2 := (coords->(i+1)->0)::decimal;

        area := area + (lng1 * lat2 - lng2 * lat1);
    end loop;

    -- Retorna área absoluta em metros quadrados aproximados
    return abs(area) * 111319.9 * 111319.9 / 2;
end;
$$ language plpgsql;

create or replace function public.calculate_polygon_center(coordinates jsonb)
returns jsonb as $$
declare
    coords jsonb;
    lat_sum decimal := 0;
    lng_sum decimal := 0;
    point_count integer;
    i integer;
begin
    coords := coordinates->0;
    point_count := jsonb_array_length(coords);

    -- Calcula centroide simples (média das coordenadas)
    for i in 0..(point_count - 1) loop
        lat_sum := lat_sum + (coords->i->1)::decimal;
        lng_sum := lng_sum + (coords->i->0)::decimal;
    end loop;

    return jsonb_build_object(
        'lat', lat_sum / point_count,
        'lng', lng_sum / point_count
    );
end;
$$ language plpgsql;

-- Função para processar GeoJSON de lotes
create or replace function public.process_geojson_lotes(
    p_empreendimento_id uuid,
    p_geojson jsonb,
    p_empreendimento_nome text
)
returns table(total_lotes integer, lotes_processados jsonb) as $$
declare
    feature jsonb;
    lote_nome_original text;
    lote_nome_final text;
    lote_numero integer;
    geometria jsonb;
    coordenadas jsonb;
    area_calculada decimal;
    lote_id uuid;
    lotes_array jsonb := '[]'::jsonb;
    contador integer := 0;
begin
    -- Limpa lotes existentes deste empreendimento para evitar duplicatas
    delete from public.lotes where empreendimento_id = p_empreendimento_id;

    -- Itera sobre cada feature do GeoJSON
    for feature in select jsonb_array_elements(p_geojson->'features')
    loop
        contador := contador + 1;

        -- Nome original do lote
        lote_nome_original := coalesce(
            feature->'properties'->>'Name',
            feature->'properties'->>'name',
            'Lote ' || contador::text
        );

        -- Nome final formatado
        lote_nome_final := p_empreendimento_nome || ' - ' || lote_nome_original;

        -- Número do lote (extraído do nome, se possível)
        lote_numero := case
            when lote_nome_original ~ '\\d+' then
                (regexp_match(lote_nome_original, '\\d+'))[1]::integer
            else contador
        end;

        -- Dados geométricos
        geometria := feature->'geometry'->'coordinates';
        coordenadas := public.calculate_polygon_center(geometria);
        area_calculada := public.calculate_polygon_area(geometria);

        -- Inserção do lote
        insert into public.lotes (
            empreendimento_id, nome, numero, status, area_m2,
            coordenadas, geometria, properties
        ) values (
            p_empreendimento_id, lote_nome_final, lote_numero, 'disponivel', area_calculada,
            coordenadas, geometria, feature->'properties'
        ) returning id into lote_id;

        -- Adiciona ao array de retorno
        lotes_array := lotes_array || jsonb_build_object(
            'id', lote_id,
            'nome', lote_nome_final,
            'numero', lote_numero,
            'area_m2', area_calculada
        );
    end loop;

    -- Retorna resultado
    return query select contador, lotes_array;
end;
$$ language plpgsql security definer;

grant execute on function public.process_geojson_lotes(uuid, jsonb, text) to authenticated;
grant execute on function public.process_geojson_lotes(uuid, jsonb, text) to anon;

-- Função de aprovação de empreendimentos
create or replace function public.approve_empreendimento(
    p_empreendimento_id uuid,
    p_approved boolean default true,
    p_rejection_reason text default null
)
returns boolean
language plpgsql
security definer
as $$
declare
    v_user_role text;
begin
    -- Verificar se o usuário é adminfilial ou superadmin
    select role into v_user_role
    from public.user_profiles
    where user_id = auth.uid();

    if v_user_role not in ('adminfilial', 'superadmin') then
        raise exception 'Apenas administradores podem aprovar empreendimentos';
    end if;

    if p_approved then
        update public.empreendimentos
           set status = 'aprovado',
               approved_by = auth.uid(),
               approved_at = now(),
               rejection_reason = null
         where id = p_empreendimento_id;
    else
        update public.empreendimentos
           set status = 'rejeitado',
               approved_by = auth.uid(),
               approved_at = now(),
               rejection_reason = p_rejection_reason
         where id = p_empreendimento_id;
    end if;

    return true;
end;
$$;

grant execute on function public.approve_empreendimento(uuid, boolean, text) to authenticated;

-- Função para obter o perfil do usuário autenticado
create or replace function public.get_my_profile()
returns table(
    user_id uuid,
    email text,
    full_name text,
    role text,
    panels jsonb,
    is_active boolean,
    filial_id uuid,
    updated_at timestamptz
)
language plpgsql
security definer
as $$
begin
  return query
  select up.user_id,
         up.email,
         up.full_name,
         up.role,
         to_jsonb(up.panels) as panels,
         up.is_active,
         up.filial_id,
         up.updated_at
  from public.user_profiles up
  where up.user_id = auth.uid();
end;
$$;

grant execute on function public.get_my_profile() to authenticated;

-- RPCs de lotes
create or replace function public.lotes_geojson(p_empreendimento_id uuid)
returns jsonb
language sql
stable
as $$
  with feats as (
    select jsonb_build_object(
      'type','Feature',
      'geometry', coalesce(l.geometria, to_jsonb(st_asgeojson(l.geom)::json)),
      'properties', jsonb_build_object(
        'id', l.id,
        'nome', l.nome,
        'numero', l.numero,
        'status', l.status,
        'preco', coalesce(l.preco, l.valor),
        'area_m2', l.area_m2
      )
    ) as f
    from public.lotes l
    where l.empreendimento_id = p_empreendimento_id
  )
  select jsonb_build_object('type','FeatureCollection','features', coalesce(jsonb_agg(f), '[]'::jsonb))
  from feats;
$$;
grant execute on function public.lotes_geojson(uuid) to anon, authenticated;

create or replace function public.get_empreendimento_lotes(p_empreendimento_id uuid)
returns table(
  id uuid,
  nome text,
  numero integer,
  status text,
  area_m2 numeric,
  preco numeric,
  coordenadas jsonb,
  geometria jsonb,
  comprador_nome text,
  comprador_email text,
  data_venda timestamptz
)
language sql
stable
as $$
  select l.id, l.nome, l.numero, l.status,
         l.area_m2, coalesce(l.preco, l.valor) as preco, l.coordenadas, l.geometria,
         l.comprador_nome, l.comprador_email, l.data_venda
  from public.lotes l
  where l.empreendimento_id = p_empreendimento_id;
$$;
grant execute on function public.get_empreendimento_lotes(uuid) to authenticated;

create or replace function public.get_vendas_stats(p_empreendimento_id uuid)
returns table(
  total_lotes int,
  lotes_disponiveis int,
  lotes_reservados int,
  lotes_vendidos int,
  receita_total numeric,
  percentual_vendido numeric
)
language sql
stable
as $$
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
grant execute on function public.get_vendas_stats(uuid) to authenticated;

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

-- Políticas de Storage para o bucket empreendimentos
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
alter table public.audit_role_changes enable row level security;

create policy filiais_rls on public.filiais for all
  using (id = current_setting('request.jwt.claims.filial_id', true)::uuid)
  with check (id = current_setting('request.jwt.claims.filial_id', true)::uuid); -- app.final.sql

drop policy if exists empreendimentos_rls on public.empreendimentos;

create policy "Public read approved empreendimentos" on public.empreendimentos
  for select using (status = 'aprovado');

create policy "Authenticated users can create" on public.empreendimentos
  for insert with check (
    auth.role() = 'authenticated' and
    created_by = auth.uid() and
    status = 'pendente'
  );

create policy "Adminfilial or owner can update" on public.empreendimentos
  for update using (
    auth.uid() = created_by or
    exists (
      select 1 from public.user_profiles
      where user_profiles.user_id = auth.uid()
        and user_profiles.role in ('adminfilial', 'superadmin')
    )
  );

create policy "Adminfilial can delete" on public.empreendimentos
  for delete using (
    exists (
      select 1 from public.user_profiles
      where user_profiles.user_id = auth.uid()
        and user_profiles.role in ('adminfilial', 'superadmin')
    )
  );

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

create policy audit_role_changes_read on public.audit_role_changes for select
  using (
    exists (
      select 1 from public.user_profiles up
      where up.user_id = auth.uid() and up.role = 'superadmin'
    )
  );


-- FIM: NovoSetup/sql/sql.final.referenciado.sql

-- INICIO: NovoSetup/sql/migrations/20250816105500_admin_list_users.sql
-- Add admin_list_users function
create or replace function public.admin_list_users()
returns setof auth.users
language plpgsql
security definer
as $$
begin
  if not exists (
      select 1 from public.user_profiles
      where user_id = auth.uid()
        and role in ('adminfilial', 'superadmin')
    ) then
    raise exception 'adminfilial required';
  end if;
  return query select * from auth.users;
end $$;

grant execute on function public.admin_list_users() to authenticated;

-- FIM: NovoSetup/sql/migrations/20250816105500_admin_list_users.sql

-- INICIO: NovoSetup/sql/migrations/20250816120000_user_profile_trigger.sql
-- Popula automaticamente user_profiles ao cadastrar usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'investidor');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


-- FIM: NovoSetup/sql/migrations/20250816120000_user_profile_trigger.sql

-- INICIO: NovoSetup/sql/migrations/20250816130000_audit_logs_and_link_user_to_filial.sql
-- Create table for audit logs
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid not null,
  action text not null,
  target text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table audit_logs enable row level security;
create policy "select_audit_logs_superadmin" on audit_logs
for select using (
  exists (select 1 from user_profiles up where up.user_id = auth.uid() and up.role = 'superadmin')
);

-- FIM: NovoSetup/sql/migrations/20250816130000_audit_logs_and_link_user_to_filial.sql

-- INICIO: NovoSetup/sql/migrations/20250816131000_add_ip_user_agent_to_audit_logs.sql
-- Add ip_address and user_agent columns to audit_logs
alter table audit_logs
  add column ip_address text,
  add column user_agent text;

-- Update link_user_to_filial function to store ip and user agent
create or replace function link_user_to_filial(
  p_user_id uuid,
  p_filial_id uuid,
  p_ip_address text,
  p_user_agent text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_role text;
  v_name text;
  v_email text;
begin
  select role into v_actor_role from user_profiles where user_id = auth.uid();
  if v_actor_role <> 'superadmin' then
    raise exception 'Acesso negado';
  end if;

  select full_name, email into v_name, v_email from user_profiles where user_id = p_user_id;

  update filiais
    set owner_name = v_name,
        owner_email = v_email
    where id = p_filial_id;

  update user_profiles
    set filial_id = p_filial_id
    where user_id = p_user_id;

  insert into audit_logs(actor, action, target, metadata, ip_address, user_agent)
  values (
    auth.uid(),
    'link_user_filial',
    p_user_id::text,
    jsonb_build_object('filial_id', p_filial_id),
    p_ip_address,
    p_user_agent
  );
end;
$$;

grant execute on function link_user_to_filial(uuid, uuid, text, text) to authenticated;

-- FIM: NovoSetup/sql/migrations/20250816131000_add_ip_user_agent_to_audit_logs.sql

-- INICIO: NovoSetup/sql/migrations/20250816140000_app_settings.sql
-- Tabela de configurações de aplicação e RPCs de acesso
create table if not exists app_settings (
  key text primary key,
  value text not null
);

alter table app_settings enable row level security;
create policy "select_app_settings_superadmin" on app_settings
for select using (
  exists (select 1 from user_profiles up where up.user_id = auth.uid() and up.role = 'superadmin')
);

create or replace function admin_get_setting(p_key text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_value text;
begin
  select role into v_role from user_profiles where user_id = auth.uid();
  if v_role <> 'superadmin' then
    raise exception 'Acesso negado';
  end if;

  select value into v_value from app_settings where key = p_key;
  return v_value;
end;
$$;
grant execute on function admin_get_setting(text) to authenticated;

create or replace function admin_set_setting(p_key text, p_value text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role from user_profiles where user_id = auth.uid();
  if v_role <> 'superadmin' then
    raise exception 'Acesso negado';
  end if;

  insert into app_settings(key, value)
  values (p_key, p_value)
  on conflict(key) do update set value = excluded.value;

  insert into audit_logs(actor, action, target, metadata)
  values (auth.uid(), 'set_setting', p_key, jsonb_build_object('value', p_value));
end;
$$;
grant execute on function admin_set_setting(text, text) to authenticated;

-- FIM: NovoSetup/sql/migrations/20250816140000_app_settings.sql

-- INICIO: NovoSetup/sql/migrations/20250816140000_impersonate_user.sql
-- Function to impersonate users
create or replace function impersonate_user(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_access_token text;
  v_refresh_token text;
begin
  select role into v_role from user_profiles where user_id = auth.uid();
  if v_role <> 'superadmin' then
    raise exception 'Acesso negado';
  end if;

  v_access_token := auth.sign_jwt(json_build_object('sub', p_user_id, 'role', 'authenticated'));
  v_refresh_token := auth.sign_jwt(json_build_object('sub', p_user_id, 'role', 'authenticated', 'type', 'refresh'));

  insert into audit_logs(actor, action, target)
  values (auth.uid(), 'impersonate_user', p_user_id::text);

  return json_build_object('access_token', v_access_token, 'refresh_token', v_refresh_token);
end;
$$;

grant execute on function impersonate_user(uuid) to authenticated;

-- FIM: NovoSetup/sql/migrations/20250816140000_impersonate_user.sql

-- INICIO: supabase/migrations/20250208000000_create_pendencias.sql
create table if not exists public.pendencias (
    id uuid primary key default gen_random_uuid(),
    tipo text not null,
    entidade_id uuid not null,
    status text not null default 'pendente',
    dados jsonb,
    rejection_reason text,
    created_at timestamp with time zone default now()
);

-- FIM: supabase/migrations/20250208000000_create_pendencias.sql

-- INICIO: supabase/migrations/20250209000000_create_reservas.sql
create table if not exists public.reservas (
    id uuid primary key default gen_random_uuid(),
    lote_id uuid not null references public.lotes(id) on delete cascade,
    filial_id uuid not null references public.filiais(id) on delete cascade,
    nome text,
    email text,
    telefone text,
    expires_at timestamptz not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_reservas_lote on public.reservas(lote_id);
create index if not exists idx_reservas_filial on public.reservas(filial_id);

create or replace function public.reservas_set_filial()
returns trigger language plpgsql as $$
begin
  select filial_id into new.filial_id from public.lotes where id = new.lote_id;
  return new;
end $$;

create trigger tg_reservas_set_filial before insert on public.reservas
    for each row execute function public.reservas_set_filial();

create trigger tg_reservas_updated_at before update on public.reservas
    for each row execute function public.set_updated_at();

alter table public.reservas enable row level security;

create policy reservas_rls on public.reservas for all
  using (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid)
  with check (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid);

-- FIM: supabase/migrations/20250209000000_create_reservas.sql

-- INICIO: supabase/migrations/20250209000000_audit_reservas.sql
create table if not exists public.audit_reservas (
    id uuid primary key default gen_random_uuid(),
    reserva_id uuid not null,
    action text not null,
    actor uuid,
    old_row jsonb,
    new_row jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz not null default now()
);

create or replace function public.log_reserva_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_headers json;
  v_ip text;
  v_ua text;
begin
  v_headers := current_setting('request.headers', true)::json;
  v_ip := coalesce(v_headers->>'x-forwarded-for', v_headers->>'x-real-ip');
  v_ua := v_headers->>'user-agent';

  if TG_OP = 'INSERT' then
    insert into public.audit_reservas(reserva_id, action, actor, new_row, ip_address, user_agent)
    values (new.id, TG_OP, auth.uid(), to_jsonb(new), v_ip, v_ua);
    return new;
  elsif TG_OP = 'UPDATE' then
    insert into public.audit_reservas(reserva_id, action, actor, old_row, new_row, ip_address, user_agent)
    values (new.id, TG_OP, auth.uid(), to_jsonb(old), to_jsonb(new), v_ip, v_ua);
    return new;
  elsif TG_OP = 'DELETE' then
    insert into public.audit_reservas(reserva_id, action, actor, old_row, ip_address, user_agent)
    values (old.id, TG_OP, auth.uid(), to_jsonb(old), v_ip, v_ua);
    return old;
  end if;
end;
$$;

drop trigger if exists log_reserva_change on public.reservas;
create trigger log_reserva_change
after insert or update or delete on public.reservas
for each row execute function public.log_reserva_change();

-- FIM: supabase/migrations/20250209000000_audit_reservas.sql

-- INICIO: supabase/migrations/20250325000000_add_reserva_expira_em_to_lotes.sql
alter table public.lotes add column if not exists reserva_expira_em timestamptz;

-- FIM: supabase/migrations/20250325000000_add_reserva_expira_em_to_lotes.sql

-- INICIO: supabase/migrations/20250326000000_create_conciliacoes.sql
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

-- FIM: supabase/migrations/20250326000000_create_conciliacoes.sql

-- INICIO: supabase/migrations/20250326000000_create_etapas_obras.sql
alter table public.lotes add column if not exists liberado boolean default false;

create table if not exists public.etapas_obras (
    id uuid primary key default gen_random_uuid(),
    empreendimento_id uuid not null references public.empreendimentos(id) on delete cascade,
    nome text not null,
    ordem int,
    concluida boolean not null default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create trigger tg_etapas_obras_updated_at before update on public.etapas_obras
    for each row execute function public.set_updated_at();

create or replace function public.liberar_lotes_se_todas_etapas_concluidas()
returns trigger language plpgsql as $$
begin
  if (select bool_and(concluida) from public.etapas_obras where empreendimento_id = new.empreendimento_id) then
    update public.lotes set liberado = true where empreendimento_id = new.empreendimento_id;
  end if;
  return new;
end;
$$;

create trigger tg_liberar_lotes after insert or update on public.etapas_obras
    for each row execute function public.liberar_lotes_se_todas_etapas_concluidas();

-- FIM: supabase/migrations/20250326000000_create_etapas_obras.sql

-- INICIO: supabase/migrations/20250327000000_create_renegociacoes.sql
create table if not exists public.renegociacoes (
    id uuid primary key default gen_random_uuid(),
    reserva_id uuid not null references public.reservas(id) on delete cascade,
    email text not null,
    status text not null default 'pending',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create trigger tg_renegociacoes_updated_at before update on public.renegociacoes
    for each row execute function public.set_updated_at();

alter table public.renegociacoes enable row level security;

create policy renegociacoes_rls on public.renegociacoes for all
  using (true) with check (true);

create table if not exists public.audit_renegociacoes (
    id uuid primary key default gen_random_uuid(),
    renegociacao_id uuid not null,
    action text not null,
    actor uuid,
    old_row jsonb,
    new_row jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz not null default now()
);

create or replace function public.log_renegociacao_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_headers json;
  v_ip text;
  v_ua text;
begin
  v_headers := current_setting('request.headers', true)::json;
  v_ip := coalesce(v_headers->>'x-forwarded-for', v_headers->>'x-real-ip');
  v_ua := v_headers->>'user-agent';

  if TG_OP = 'INSERT' then
    insert into public.audit_renegociacoes(renegociacao_id, action, actor, new_row, ip_address, user_agent)
    values (new.id, TG_OP, auth.uid(), to_jsonb(new), v_ip, v_ua);
    return new;
  elsif TG_OP = 'UPDATE' then
    insert into public.audit_renegociacoes(renegociacao_id, action, actor, old_row, new_row, ip_address, user_agent)
    values (new.id, TG_OP, auth.uid(), to_jsonb(old), to_jsonb(new), v_ip, v_ua);
    return new;
  elsif TG_OP = 'DELETE' then
    insert into public.audit_renegociacoes(renegociacao_id, action, actor, old_row, ip_address, user_agent)
    values (old.id, TG_OP, auth.uid(), to_jsonb(old), v_ip, v_ua);
    return old;
  end if;
end;
$$;

drop trigger if exists log_renegociacao_change on public.renegociacoes;
create trigger log_renegociacao_change
after insert or update or delete on public.renegociacoes
for each row execute function public.log_renegociacao_change();

-- FIM: supabase/migrations/20250327000000_create_renegociacoes.sql

-- INICIO: supabase/migrations/20250601000000_create_vendas.sql
create table if not exists public.vendas (
    id uuid primary key default gen_random_uuid(),
    lote_id uuid not null references public.lotes(id) on delete cascade,
    filial_id uuid not null references public.filiais(id) on delete cascade,
    corretor_id uuid not null references auth.users(id) on delete cascade,
    valor numeric(12,2) not null,
    comissao numeric(12,2) not null,
    created_at timestamptz default now()
);

create index if not exists idx_vendas_filial on public.vendas(filial_id);
create index if not exists idx_vendas_corretor on public.vendas(corretor_id);

alter table public.vendas enable row level security;

create policy vendas_rls on public.vendas for all
  using (
    filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid and
    corretor_id = current_setting('request.jwt.claims.corretor_id', true)::uuid
  )
  with check (
    filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid and
    corretor_id = current_setting('request.jwt.claims.corretor_id', true)::uuid
  );

-- FIM: supabase/migrations/20250601000000_create_vendas.sql

-- INICIO: supabase/migrations/20250701000000_create_mv_kpis_heatmap.sql
-- Create materialized views for BI

create materialized view if not exists public.mv_kpis_filial as
  select
    f.id as filial_id,
    count(distinct e.id) as empreendimentos,
    count(distinct u.user_id) filter (where u.role <> 'superadmin') as usuarios,
    count(l.id) filter (where l.status = 'disponivel') as lotes_disponiveis,
    count(l.id) filter (where l.status = 'reservado') as lotes_reservados,
    count(l.id) filter (where l.status = 'vendido') as lotes_vendidos,
    count(l.id) as total_lotes
  from public.filiais f
  left join public.empreendimentos e on e.filial_id = f.id
  left join public.user_profiles u on u.filial_id = f.id
  left join public.lotes l on l.filial_id = f.id
  group by f.id;

create unique index if not exists idx_mv_kpis_filial_filial on public.mv_kpis_filial(filial_id);

create materialized view if not exists public.mv_heatmap_lotes as
  select
    filial_id,
    st_x(geom) as longitude,
    st_y(geom) as latitude,
    status
  from public.lotes
  where geom is not null;

create index if not exists idx_mv_heatmap_lotes_filial on public.mv_heatmap_lotes(filial_id);

-- Restrict read permissions
revoke all on public.mv_kpis_filial from public;
revoke all on public.mv_heatmap_lotes from public;
grant select on public.mv_kpis_filial to adminfilial, superadmin;
grant select on public.mv_heatmap_lotes to adminfilial, superadmin;

-- Function to refresh materialized views
create or replace function public.refresh_bi()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view public.mv_kpis_filial;
  refresh materialized view public.mv_heatmap_lotes;
end;
$$;

grant execute on function public.refresh_bi() to adminfilial, superadmin;

-- FIM: supabase/migrations/20250701000000_create_mv_kpis_heatmap.sql

-- INICIO: supabase/migrations/20250801000000_widget_telemetry.sql
-- Create table for widget telemetry
create table if not exists public.widget_telemetry (
  id uuid primary key default gen_random_uuid(),
  widget_id uuid not null,
  evento text not null,
  meta jsonb,
  created_at timestamptz default now()
);

-- Function to log widget events
create or replace function public.log_widget_event(
  widget_id uuid,
  evento text,
  meta jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.widget_telemetry(widget_id, evento, meta)
  values (widget_id, evento, meta);
end;
$$;

grant execute on function public.log_widget_event(uuid, text, jsonb) to anon;

-- FIM: supabase/migrations/20250801000000_widget_telemetry.sql

-- INICIO: supabase/migrations/20250802000000_create_doc_templates.sql
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

-- FIM: supabase/migrations/20250802000000_create_doc_templates.sql

-- INICIO: supabase/migrations/20250803000000_create_cobrancas.sql
create table if not exists public.cobrancas (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    filial_id uuid not null references public.filiais(id) on delete cascade,
    valor numeric(12,2) not null,
    status text not null default 'pendente',
    created_at timestamptz default now(),
    constraint cobrancas_status_check check (status in ('pendente','pago','cancelado'))
);

create index if not exists idx_cobrancas_user on public.cobrancas(user_id);
create index if not exists idx_cobrancas_filial on public.cobrancas(filial_id);

alter table public.cobrancas enable row level security;

create policy cobrancas_rls on public.cobrancas for all
  using (
    filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid
    or auth.uid() = user_id
  )
  with check (
    filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid
    or auth.uid() = user_id
  );

-- FIM: supabase/migrations/20250803000000_create_cobrancas.sql

-- INICIO: supabase/migrations/20250804000000_create_vw_comissoes.sql
create or replace view public.vw_comissoes as
select
  v.corretor_id,
  l.status,
  sum(v.comissao) as total_comissao
from public.vendas v
join public.lotes l on l.id = v.lote_id
group by v.corretor_id, l.status;

grant select on public.vw_comissoes to adminfilial, comercial, superadmin;

-- FIM: supabase/migrations/20250804000000_create_vw_comissoes.sql

-- INICIO: supabase/migrations/20250805000000_create_investimentos.sql
create table if not exists public.investimentos (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    quota numeric not null,
    doc_url text,
    created_at timestamptz default now()
);

create index if not exists idx_investimentos_user on public.investimentos(user_id);

alter table public.investimentos enable row level security;

create policy investimentos_rls on public.investimentos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- FIM: supabase/migrations/20250805000000_create_investimentos.sql

-- INICIO: supabase/migrations/20250901000000_create_terrenistas_repasses.sql
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

-- FIM: supabase/migrations/20250901000000_create_terrenistas_repasses.sql


-- INICIO: supabase/migrations/20250903000000_reservar_lote_security.sql
-- Ensure reservar_lote uses security definer and has execute privileges

create or replace function public.reservar_lote(
  p_lote_id uuid,
  p_ttl integer default 300
)
returns table(success boolean, expires_at timestamptz)
language plpgsql
security definer
as $$
declare
  v_expira timestamptz := now() + make_interval(secs => p_ttl);
begin
  -- lock row to prevent concurrent reservations
  perform 1 from public.lotes where id = p_lote_id and status = 'disponivel' for update;
  if not found then
    success := false;
    expires_at := null;
    return next;
    return;
  end if;

  begin
    update public.lotes
       set status = 'reservado',
           reserva_expira_em = v_expira
     where id = p_lote_id;
  exception
    when others then
      -- rollback on error and rethrow
      raise;
  end;

  success := true;
  expires_at := v_expira;
  return next;
exception
  when others then
    success := false;
    expires_at := null;
    return next;
end;
$$;

grant execute on function public.reservar_lote(uuid, integer) to authenticated;

-- FIM: supabase/migrations/20250903000000_reservar_lote_security.sql

-- INICIO: supabase/rpc/buscar_cobrancas_por_user_id.sql
create or replace function public.buscar_cobrancas_por_user_id(
  p_user_id uuid
)
returns setof public.cobrancas
language sql
as $$
  select *
  from public.cobrancas
  where user_id = p_user_id;
$$;
grant execute on function public.buscar_cobrancas_por_user_id(uuid) to authenticated;

-- FIM: supabase/rpc/buscar_cobrancas_por_user_id.sql

-- INICIO: supabase/rpc/mv_kpis_filial.sql
create or replace function mv_kpis_filial()
returns setof mv_kpis_filial
language sql
security definer
as $$
  select * from mv_kpis_filial;
$$;
grant execute on function mv_kpis_filial() to adminfilial, superadmin;

-- FIM: supabase/rpc/mv_kpis_filial.sql

-- INICIO: supabase/rpc/superadmin_reports.sql
create or replace function superadmin_reports(
  filial_ids uuid[] default null,
  from_date date default null,
  to_date date default null
)
returns table (
  day date,
  filial_id uuid,
  empreendimentos integer,
  usuarios integer,
  lotes_vendidos integer,
  ocupacao numeric
)
language plpgsql
as $$
declare
  f_ids uuid[];
begin
  -- assume all filiais when none specified
  if filial_ids is null then
    select array_agg(id) into f_ids from filiais;
  else
    f_ids := filial_ids;
  end if;

  return query
  with days as (
    select generate_series(
      coalesce(from_date, current_date - interval '30 day'),
      coalesce(to_date, current_date),
      interval '1 day'
    )::date as day
  ),
  empreendimentos_cte as (
    select date_trunc('day', created_at)::date as day, filial_id, count(*) as cnt
    from empreendimentos
    where filial_id = any(f_ids)
      and created_at::date between coalesce(from_date, current_date - interval '30 day') and coalesce(to_date, current_date)
    group by 1,2
  ),
  usuarios_cte as (
    select date_trunc('day', created_at)::date as day, filial_id, count(*) as cnt
    from user_profiles
    where filial_id = any(f_ids)
      and role <> 'superadmin'
      and created_at::date between coalesce(from_date, current_date - interval '30 day') and coalesce(to_date, current_date)
    group by 1,2
  ),
  lotes_cte as (
    select date_trunc('day', sold_at)::date as day, filial_id, count(*) as cnt
    from lotes
    where filial_id = any(f_ids)
      and status = 'vendido'
      and sold_at::date between coalesce(from_date, current_date - interval '30 day') and coalesce(to_date, current_date)
    group by 1,2
  ),
  lotes_total as (
    select filial_id, count(*) as total
    from lotes
    where filial_id = any(f_ids)
    group by filial_id
  )
  select d.day,
         f.id as filial_id,
         coalesce(e.cnt, 0) as empreendimentos,
         coalesce(u.cnt, 0) as usuarios,
         coalesce(l.cnt, 0) as lotes_vendidos,
         coalesce((l.cnt::numeric / nullif(t.total,0)) * 100, 0) as ocupacao
  from (select unnest(f_ids) as id) f
  cross join days d
  left join empreendimentos_cte e on e.day = d.day and e.filial_id = f.id
  left join usuarios_cte u on u.day = d.day and u.filial_id = f.id
  left join lotes_cte l on l.day = d.day and l.filial_id = f.id
  left join lotes_total t on t.filial_id = f.id
  order by d.day, f.id;
end;
$$;
grant execute on function superadmin_reports(uuid[], date, date) to authenticated;

-- FIM: supabase/rpc/superadmin_reports.sql
-- INICIO: supabase/rpc/admin_update_user_role.sql
create or replace function public.admin_update_user_role(
  p_user_id uuid,
  p_role text
)
returns void
language sql
security definer
as $$
  update public.user_profiles
     set role = p_role
   where user_id = p_user_id;
$$;
grant execute on function public.admin_update_user_role(uuid, text) to authenticated;
-- FIM: supabase/rpc/admin_update_user_role.sql

-- INICIO: supabase/rpc/admin_set_user_filial.sql
create or replace function public.admin_set_user_filial(
  p_user_id uuid,
  p_filial_id uuid
)
returns void
language sql
security definer
as $$
  update public.user_profiles
     set filial_id = p_filial_id
   where user_id = p_user_id;
$$;
grant execute on function public.admin_set_user_filial(uuid, uuid) to authenticated;
-- FIM: supabase/rpc/admin_set_user_filial.sql

-- INICIO: supabase/rpc/admin_set_user_panels.sql
create or replace function public.admin_set_user_panels(
  p_user_id uuid,
  p_panels text[]
)
returns void
language sql
security definer
as $$
  update public.user_profiles
     set panels = p_panels
   where user_id = p_user_id;
$$;
grant execute on function public.admin_set_user_panels(uuid, text[]) to authenticated;
-- FIM: supabase/rpc/admin_set_user_panels.sql

-- INICIO: supabase/rpc/get_filial_empreendimentos.sql
create or replace function public.get_filial_empreendimentos(
  p_filial_id uuid
)
returns table(
  empreendimento_id uuid,
  nome text,
  status text,
  total_lotes bigint,
  lotes_vendidos bigint
)
language sql
security definer
as $$
  select e.id as empreendimento_id,
         e.nome,
         e.status,
         count(l.*) as total_lotes,
         count(l.*) filter (where l.status = 'vendido') as lotes_vendidos
    from public.empreendimentos e
    left join public.lotes l on l.empreendimento_id = e.id
   where e.filial_id = p_filial_id
   group by e.id, e.nome, e.status;
$$;
grant execute on function public.get_filial_empreendimentos(uuid) to authenticated;
-- FIM: supabase/rpc/get_filial_empreendimentos.sql

-- INICIO: supabase/rpc/set_filial_allowed_panels.sql
create or replace function public.set_filial_allowed_panels(
  p_filial_id uuid,
  p_panels text[]
)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.filial_allowed_panels where filial_id = p_filial_id;
  if p_panels is not null then
    insert into public.filial_allowed_panels(filial_id, panel)
      select p_filial_id, unnest(p_panels);
  end if;
end;
$$;
grant execute on function public.set_filial_allowed_panels(uuid, text[]) to authenticated;
-- FIM: supabase/rpc/set_filial_allowed_panels.sql

-- INICIO: supabase/rpc/get_all_empreendimentos_overview.sql
create or replace function public.get_all_empreendimentos_overview()
returns table(
  empreendimento_id uuid,
  nome text,
  status text,
  filial_id uuid,
  filial_nome text,
  total_lotes bigint,
  lotes_vendidos bigint
)
language sql
security definer
as $$
  select e.id as empreendimento_id,
         e.nome,
         e.status,
         e.filial_id,
         f.nome as filial_nome,
         count(l.*) as total_lotes,
         count(l.*) filter (where l.status = 'vendido') as lotes_vendidos
    from public.empreendimentos e
    left join public.filiais f on f.id = e.filial_id
    left join public.lotes l on l.empreendimento_id = e.id
   group by e.id, e.nome, e.status, e.filial_id, f.nome;
$$;
grant execute on function public.get_all_empreendimentos_overview() to authenticated;
-- FIM: supabase/rpc/get_all_empreendimentos_overview.sql

-- INICIO: supabase/rpc/update_lote_status.sql
create or replace function public.update_lote_status(
  p_lote_id uuid,
  p_novo_status text
)
returns public.lotes
language sql
security definer
as $$
  update public.lotes
     set status = p_novo_status
   where id = p_lote_id
   returning *;
$$;
grant execute on function public.update_lote_status(uuid, text) to authenticated;
-- FIM: supabase/rpc/update_lote_status.sql

-- INICIO: supabase/rpc/update_lote_valor.sql
create or replace function public.update_lote_valor(
  p_lote_id uuid,
  p_novo_valor numeric
)
returns void
language sql
security definer
as $$
  update public.lotes
     set valor = p_novo_valor
   where id = p_lote_id;
$$;
grant execute on function public.update_lote_valor(uuid, numeric) to authenticated;
-- FIM: supabase/rpc/update_lote_valor.sql
-- Função para provisionar filiais diretamente via SQL
-- Para aplicar após carregar `banco.sql`:
--   psql < provision_filial.sql

create or replace function public.provision_filial(
    p_nome text,
    p_kind text default 'interna',
    p_owner_name text default null,
    p_owner_email text default null,
    p_billing_plan text default null,
    p_billing_status text default null,
    p_domain text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_filial_id uuid;
  v_role text;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;
  select role into v_role from public.user_profiles where user_id = v_user_id;
  if v_role is distinct from 'superadmin' then
    raise exception 'Forbidden';
  end if;
  insert into public.filiais (
    nome, kind, owner_name, owner_email, billing_plan, billing_status, domain, status
  ) values (
    p_nome, p_kind, p_owner_name, p_owner_email, p_billing_plan, p_billing_status, p_domain, 'provisionando'
  ) returning id into v_filial_id;
  begin
    if p_billing_plan is not null or p_billing_status is not null then
      insert into public.billing (filial_id, plan, status)
      values (v_filial_id, p_billing_plan, p_billing_status);
    end if;
  exception when undefined_table then
    -- ignora se tabela billing não existir
  end;
  begin
    if p_domain is not null then
      insert into public.domains (filial_id, domain)
      values (v_filial_id, p_domain);
    end if;
  exception when undefined_table then
    -- ignora se tabela domains não existir
  end;
  begin
    insert into public.audit_logs (actor, action, target, metadata)
    values (v_user_id, 'provision-filial', v_filial_id,
            jsonb_build_object('nome', p_nome, 'kind', p_kind));
  exception when undefined_table then
    -- ignora se tabela audit_logs não existir
  end;
  return v_filial_id;
end;
$$;

grant execute on function public.provision_filial(
  text, text, text, text, text, text, text
) to authenticated;
create table if not exists public.pendencias (
    id uuid primary key default gen_random_uuid(),
    tipo text not null,
    entidade_id uuid not null,
    status text not null default 'pendente',
    dados jsonb,
    rejection_reason text,
    created_at timestamp with time zone default now()
);
create table if not exists public.audit_reservas (
    id uuid primary key default gen_random_uuid(),
    reserva_id uuid not null,
    action text not null,
    actor uuid,
    old_row jsonb,
    new_row jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz not null default now()
);

create or replace function public.log_reserva_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_headers json;
  v_ip text;
  v_ua text;
begin
  v_headers := current_setting('request.headers', true)::json;
  v_ip := coalesce(v_headers->>'x-forwarded-for', v_headers->>'x-real-ip');
  v_ua := v_headers->>'user-agent';

  if TG_OP = 'INSERT' then
    insert into public.audit_reservas(reserva_id, action, actor, new_row, ip_address, user_agent)
    values (new.id, TG_OP, auth.uid(), to_jsonb(new), v_ip, v_ua);
    return new;
  elsif TG_OP = 'UPDATE' then
    insert into public.audit_reservas(reserva_id, action, actor, old_row, new_row, ip_address, user_agent)
    values (new.id, TG_OP, auth.uid(), to_jsonb(old), to_jsonb(new), v_ip, v_ua);
    return new;
  elsif TG_OP = 'DELETE' then
    insert into public.audit_reservas(reserva_id, action, actor, old_row, ip_address, user_agent)
    values (old.id, TG_OP, auth.uid(), to_jsonb(old), v_ip, v_ua);
    return old;
  end if;
end;
$$;

drop trigger if exists log_reserva_change on public.reservas;
create trigger log_reserva_change
after insert or update or delete on public.reservas
for each row execute function public.log_reserva_change();
create table if not exists public.reservas (
    id uuid primary key default gen_random_uuid(),
    lote_id uuid not null references public.lotes(id) on delete cascade,
    filial_id uuid not null references public.filiais(id) on delete cascade,
    nome text,
    email text,
    telefone text,
    expires_at timestamptz not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_reservas_lote on public.reservas(lote_id);
create index if not exists idx_reservas_filial on public.reservas(filial_id);

create or replace function public.reservas_set_filial()
returns trigger language plpgsql as $$
begin
  select filial_id into new.filial_id from public.lotes where id = new.lote_id;
  return new;
end $$;

create trigger tg_reservas_set_filial before insert on public.reservas
    for each row execute function public.reservas_set_filial();

create trigger tg_reservas_updated_at before update on public.reservas
    for each row execute function public.set_updated_at();

alter table public.reservas enable row level security;

create policy reservas_rls on public.reservas for all
  using (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid)
  with check (filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid);
alter table public.lotes add column if not exists reserva_expira_em timestamptz;
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
alter table public.lotes add column if not exists liberado boolean default false;

create table if not exists public.etapas_obras (
    id uuid primary key default gen_random_uuid(),
    empreendimento_id uuid not null references public.empreendimentos(id) on delete cascade,
    nome text not null,
    ordem int,
    concluida boolean not null default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create trigger tg_etapas_obras_updated_at before update on public.etapas_obras
    for each row execute function public.set_updated_at();

create or replace function public.liberar_lotes_se_todas_etapas_concluidas()
returns trigger language plpgsql as $$
begin
  if (select bool_and(concluida) from public.etapas_obras where empreendimento_id = new.empreendimento_id) then
    update public.lotes set liberado = true where empreendimento_id = new.empreendimento_id;
  end if;
  return new;
end;
$$;

create trigger tg_liberar_lotes after insert or update on public.etapas_obras
    for each row execute function public.liberar_lotes_se_todas_etapas_concluidas();
create table if not exists public.renegociacoes (
    id uuid primary key default gen_random_uuid(),
    reserva_id uuid not null references public.reservas(id) on delete cascade,
    email text not null,
    status text not null default 'pending',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create trigger tg_renegociacoes_updated_at before update on public.renegociacoes
    for each row execute function public.set_updated_at();

alter table public.renegociacoes enable row level security;

create policy renegociacoes_rls on public.renegociacoes for all
  using (true) with check (true);

create table if not exists public.audit_renegociacoes (
    id uuid primary key default gen_random_uuid(),
    renegociacao_id uuid not null,
    action text not null,
    actor uuid,
    old_row jsonb,
    new_row jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz not null default now()
);

create or replace function public.log_renegociacao_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_headers json;
  v_ip text;
  v_ua text;
begin
  v_headers := current_setting('request.headers', true)::json;
  v_ip := coalesce(v_headers->>'x-forwarded-for', v_headers->>'x-real-ip');
  v_ua := v_headers->>'user-agent';

  if TG_OP = 'INSERT' then
    insert into public.audit_renegociacoes(renegociacao_id, action, actor, new_row, ip_address, user_agent)
    values (new.id, TG_OP, auth.uid(), to_jsonb(new), v_ip, v_ua);
    return new;
  elsif TG_OP = 'UPDATE' then
    insert into public.audit_renegociacoes(renegociacao_id, action, actor, old_row, new_row, ip_address, user_agent)
    values (new.id, TG_OP, auth.uid(), to_jsonb(old), to_jsonb(new), v_ip, v_ua);
    return new;
  elsif TG_OP = 'DELETE' then
    insert into public.audit_renegociacoes(renegociacao_id, action, actor, old_row, ip_address, user_agent)
    values (old.id, TG_OP, auth.uid(), to_jsonb(old), v_ip, v_ua);
    return old;
  end if;
end;
$$;

drop trigger if exists log_renegociacao_change on public.renegociacoes;
create trigger log_renegociacao_change
after insert or update or delete on public.renegociacoes
for each row execute function public.log_renegociacao_change();
create table if not exists public.vendas (
    id uuid primary key default gen_random_uuid(),
    lote_id uuid not null references public.lotes(id) on delete cascade,
    filial_id uuid not null references public.filiais(id) on delete cascade,
    corretor_id uuid not null references auth.users(id) on delete cascade,
    valor numeric(12,2) not null,
    comissao numeric(12,2) not null,
    created_at timestamptz default now()
);

create index if not exists idx_vendas_filial on public.vendas(filial_id);
create index if not exists idx_vendas_corretor on public.vendas(corretor_id);

alter table public.vendas enable row level security;

create policy vendas_rls on public.vendas for all
  using (
    filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid and
    corretor_id = current_setting('request.jwt.claims.corretor_id', true)::uuid
  )
  with check (
    filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid and
    corretor_id = current_setting('request.jwt.claims.corretor_id', true)::uuid
  );
-- Create materialized views for BI

create materialized view if not exists public.mv_kpis_filial as
  select
    f.id as filial_id,
    count(distinct e.id) as empreendimentos,
    count(distinct u.user_id) filter (where u.role <> 'superadmin') as usuarios,
    count(l.id) filter (where l.status = 'disponivel') as lotes_disponiveis,
    count(l.id) filter (where l.status = 'reservado') as lotes_reservados,
    count(l.id) filter (where l.status = 'vendido') as lotes_vendidos,
    count(l.id) as total_lotes
  from public.filiais f
  left join public.empreendimentos e on e.filial_id = f.id
  left join public.user_profiles u on u.filial_id = f.id
  left join public.lotes l on l.filial_id = f.id
  group by f.id;

create unique index if not exists idx_mv_kpis_filial_filial on public.mv_kpis_filial(filial_id);

create materialized view if not exists public.mv_heatmap_lotes as
  select
    filial_id,
    st_x(geom) as longitude,
    st_y(geom) as latitude,
    status
  from public.lotes
  where geom is not null;

create index if not exists idx_mv_heatmap_lotes_filial on public.mv_heatmap_lotes(filial_id);

-- Restrict read permissions
revoke all on public.mv_kpis_filial from public;
revoke all on public.mv_heatmap_lotes from public;
grant select on public.mv_kpis_filial to adminfilial, superadmin;
grant select on public.mv_heatmap_lotes to adminfilial, superadmin;

-- Function to refresh materialized views
create or replace function public.refresh_bi()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view public.mv_kpis_filial;
  refresh materialized view public.mv_heatmap_lotes;
end;
$$;

grant execute on function public.refresh_bi() to adminfilial, superadmin;
-- Create table for widget telemetry
create table if not exists public.widget_telemetry (
  id uuid primary key default gen_random_uuid(),
  widget_id uuid not null,
  evento text not null,
  meta jsonb,
  created_at timestamptz default now()
);

-- Function to log widget events
create or replace function public.log_widget_event(
  widget_id uuid,
  evento text,
  meta jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.widget_telemetry(widget_id, evento, meta)
  values (widget_id, evento, meta);
end;
$$;

grant execute on function public.log_widget_event(uuid, text, jsonb) to anon;
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
create table if not exists public.cobrancas (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    filial_id uuid not null references public.filiais(id) on delete cascade,
    valor numeric(12,2) not null,
    status text not null default 'pendente',
    created_at timestamptz default now(),
    constraint cobrancas_status_check check (status in ('pendente','pago','cancelado'))
);

create index if not exists idx_cobrancas_user on public.cobrancas(user_id);
create index if not exists idx_cobrancas_filial on public.cobrancas(filial_id);

alter table public.cobrancas enable row level security;

create policy cobrancas_rls on public.cobrancas for all
  using (
    filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid
    or auth.uid() = user_id
  )
  with check (
    filial_id = current_setting('request.jwt.claims.filial_id', true)::uuid
    or auth.uid() = user_id
  );
create or replace view public.vw_comissoes as
select
  v.corretor_id,
  l.status,
  sum(v.comissao) as total_comissao
from public.vendas v
join public.lotes l on l.id = v.lote_id
group by v.corretor_id, l.status;

grant select on public.vw_comissoes to adminfilial, comercial, superadmin;
create table if not exists public.investimentos (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    quota numeric not null,
    doc_url text,
    created_at timestamptz default now()
);

create index if not exists idx_investimentos_user on public.investimentos(user_id);

alter table public.investimentos enable row level security;

create policy investimentos_rls on public.investimentos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
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
-- Adjust numeric precision and enforce status constraint

-- Round existing values to two decimal places
update public.vendas set valor = round(valor::numeric, 2), comissao = round(comissao::numeric, 2);
update public.cobrancas set valor = round(valor::numeric, 2);

-- Normalize status values
update public.cobrancas set status = 'pendente' where status not in ('pendente','pago','cancelado');

-- Alter column types to numeric(12,2)
alter table public.vendas
  alter column valor type numeric(12,2),
  alter column comissao type numeric(12,2);

alter table public.cobrancas
  alter column valor type numeric(12,2);

-- Add check constraint for status
alter table public.cobrancas
  drop constraint if exists cobrancas_status_check;

alter table public.cobrancas
  add constraint cobrancas_status_check check (status in ('pendente','pago','cancelado'));
-- Ensure reservar_lote uses security definer and has execute privileges

create or replace function public.reservar_lote(
  p_lote_id uuid,
  p_ttl integer default 300
)
returns table(success boolean, expires_at timestamptz)
language plpgsql
security definer
as $$
declare
  v_expira timestamptz := now() + make_interval(secs => p_ttl);
begin
  -- lock row to prevent concurrent reservations
  perform 1 from public.lotes where id = p_lote_id and status = 'disponivel' for update;
  if not found then
    success := false;
    expires_at := null;
    return next;
    return;
  end if;

  begin
    update public.lotes
       set status = 'reservado',
           reserva_expira_em = v_expira
     where id = p_lote_id;
  exception
    when others then
      -- rollback on error and rethrow
      raise;
  end;

  success := true;
  expires_at := v_expira;
  return next;
exception
  when others then
    success := false;
    expires_at := null;
    return next;
end;
$$;

grant execute on function public.reservar_lote(uuid, integer) to authenticated;
