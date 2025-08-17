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
create index if not exists idx_emp_created_by on public.empreendimentos(created_by); -- update-empreendimentos-table.sql
create trigger tg_emp_set_defaults before insert or update on public.empreendimentos
    for each row execute function public.empreendimentos_set_defaults(); -- app.final.sql

-- Função para aprovar ou rejeitar empreendimentos
create or replace function public.approve_empreendimento(
  p_empreendimento_id uuid,
  p_approved boolean default true,
  p_rejection_reason text default null
) returns boolean
language plpgsql security definer as $$
declare
  v_user_role text;
begin
  select role into v_user_role
  from public.user_profiles
  where user_id = auth.uid();

  if v_user_role not in ('admin', 'superadmin') then
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
end; $$;

grant execute on function public.approve_empreendimento(uuid, boolean, text) to authenticated;

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

-- Funções para processamento e gerenciamento de lotes
create or replace function public.calculate_polygon_area(coordinates jsonb)
returns numeric as $$
declare
    coords jsonb;
    area numeric := 0;
    i integer;
    lat1 numeric;
    lng1 numeric;
    lat2 numeric;
    lng2 numeric;
begin
    coords := coordinates->0;

    for i in 0..(jsonb_array_length(coords) - 2) loop
        lat1 := (coords->i->1)::numeric;
        lng1 := (coords->i->0)::numeric;
        lat2 := (coords->(i+1)->1)::numeric;
        lng2 := (coords->(i+1)->0)::numeric;

        area := area + (lng1 * lat2 - lng2 * lat1);
    end loop;

    return abs(area) * 111319.9 * 111319.9 / 2;
end;
$$ language plpgsql;

create or replace function public.calculate_polygon_center(coordinates jsonb)
returns jsonb as $$
declare
    coords jsonb;
    lat_sum numeric := 0;
    lng_sum numeric := 0;
    point_count integer;
    i integer;
begin
    coords := coordinates->0;
    point_count := jsonb_array_length(coords);

    for i in 0..(point_count - 1) loop
        lat_sum := lat_sum + (coords->i->1)::numeric;
        lng_sum := lng_sum + (coords->i->0)::numeric;
    end loop;

    return jsonb_build_object(
        'lat', lat_sum / point_count,
        'lng', lng_sum / point_count
    );
end;
$$ language plpgsql;

create or replace function public.process_geojson_lotes(
    p_empreendimento_id uuid,
    p_geojson jsonb,
    p_empreendimento_nome text
) returns table(total_lotes integer, lotes_processados jsonb)
language plpgsql security definer as $$
declare
    feature jsonb;
    lote_nome_original text;
    lote_nome_final text;
    lote_numero integer;
    geometria jsonb;
    coordenadas jsonb;
    area_calculada numeric;
    lote_id uuid;
    lotes_array jsonb := '[]'::jsonb;
    contador integer := 0;
begin
    delete from public.lotes where empreendimento_id = p_empreendimento_id;

    for feature in select jsonb_array_elements(p_geojson->'features')
    loop
        contador := contador + 1;

        lote_nome_original := coalesce(
            feature->'properties'->>'Name',
            feature->'properties'->>'name',
            'Lote ' || contador::text
        );

        lote_nome_final := p_empreendimento_nome || ' - ' || lote_nome_original;

        lote_numero := case
            when lote_nome_original ~ '\\d+' then
                (regexp_match(lote_nome_original, '\\d+'))[1]::integer
            else contador
        end;

        geometria := feature->'geometry'->'coordinates';
        coordenadas := public.calculate_polygon_center(geometria);
        area_calculada := public.calculate_polygon_area(geometria);

        insert into public.lotes(
            empreendimento_id, nome, numero, status, area_m2,
            coordenadas, geometria, properties
        ) values (
            p_empreendimento_id, lote_nome_final, lote_numero, 'disponivel', area_calculada,
            coordenadas, geometria, feature->'properties'
        ) returning id into lote_id;

        lotes_array := lotes_array || jsonb_build_object(
            'id', lote_id,
            'nome', lote_nome_final,
            'numero', lote_numero,
            'area_m2', area_calculada
        );
    end loop;

    return query select contador, lotes_array;
end;
$$;

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
    data_venda timestamptz
) language plpgsql security definer as $$
begin
    return query
    select
        l.id,
        l.nome,
        l.numero,
        l.status,
        l.area_m2,
        l.preco,
        l.coordenadas,
        l.geometria,
        l.comprador_nome,
        l.data_venda
    from public.lotes l
    where l.empreendimento_id = p_empreendimento_id
    order by l.numero;
end;
$$;

create or replace function public.update_lote_status(
    p_lote_id uuid,
    p_status text,
    p_comprador_nome text default null,
    p_comprador_email text default null,
    p_preco numeric default null
) returns boolean
language plpgsql security definer as $$
begin
    update public.lotes
       set status = p_status,
           comprador_nome = case when p_status = 'vendido' then p_comprador_nome else null end,
           comprador_email = case when p_status = 'vendido' then p_comprador_email else null end,
           preco = coalesce(p_preco, preco),
           data_venda = case when p_status = 'vendido' then now() else null end,
           updated_at = now()
     where id = p_lote_id;

    return found;
end;
$$;

create or replace function public.get_vendas_stats(p_empreendimento_id uuid)
returns table(
    total_lotes integer,
    lotes_disponiveis integer,
    lotes_reservados integer,
    lotes_vendidos integer,
    percentual_vendido numeric,
    area_total numeric,
    area_vendida numeric,
    receita_total numeric
) language plpgsql security definer as $$
begin
    return query
    select
        count(*)::integer as total_lotes,
        count(case when status = 'disponivel' then 1 end)::integer as lotes_disponiveis,
        count(case when status = 'reservado' then 1 end)::integer as lotes_reservados,
        count(case when status = 'vendido' then 1 end)::integer as lotes_vendidos,
        round((count(case when status = 'vendido' then 1 end)::numeric / nullif(count(*),0)::numeric) * 100, 2) as percentual_vendido,
        coalesce(sum(area_m2), 0) as area_total,
        coalesce(sum(case when status = 'vendido' then area_m2 end), 0) as area_vendida,
        coalesce(sum(case when status = 'vendido' then preco end), 0) as receita_total
    from public.lotes
    where empreendimento_id = p_empreendimento_id;
end;
$$;

grant execute on function public.process_geojson_lotes(uuid, jsonb, text) to authenticated;
grant execute on function public.process_geojson_lotes(uuid, jsonb, text) to anon;
grant execute on function public.get_empreendimento_lotes(uuid) to authenticated;
grant execute on function public.get_empreendimento_lotes(uuid) to anon;
grant execute on function public.update_lote_status(uuid, text, text, text, numeric) to authenticated;
grant execute on function public.update_lote_status(uuid, text, text, text, numeric) to anon;
grant execute on function public.get_vendas_stats(uuid) to authenticated;
grant execute on function public.get_vendas_stats(uuid) to anon;

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

-- Políticas de Storage (de storage-policies.sql)
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

