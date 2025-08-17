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
    -- Verificar se o usuário é admin ou superadmin
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
end;
$$;

grant execute on function public.approve_empreendimento(uuid, boolean, text) to authenticated;

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

create policy "Admin or owner can update" on public.empreendimentos
  for update using (
    auth.uid() = created_by or
    exists (
      select 1 from public.user_profiles
      where user_profiles.user_id = auth.uid()
        and user_profiles.role in ('admin', 'superadmin')
    )
  );

create policy "Admin can delete" on public.empreendimentos
  for delete using (
    exists (
      select 1 from public.user_profiles
      where user_profiles.user_id = auth.uid()
        and user_profiles.role in ('admin', 'superadmin')
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

