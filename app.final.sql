-- ===============================================================
-- BlockURB · app.final.sql
-- Unificação do schema + RPCs usadas pelo app (idempotente)
-- ATENÇÃO: este script NÃO apaga dados. Apenas cria/ajusta objetos.
-- ===============================================================

-- ============== EXTENSIONS ====================
create extension if not exists "pgcrypto";
create extension if not exists "postgis";

-- ============== HELPERS =======================
-- atualiza coluna updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- helper de privilégio admin/superadmin com base em user_profiles
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

-- ============== TABLES ========================
-- FILIAIS (inclui colunas que o app seleciona)
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
  created_at timestamptz not null default now(),
  constraint filiais_nome_key unique (nome)
);
-- colunas que podem não existir ainda
alter table public.filiais add column if not exists kind text;
alter table public.filiais add column if not exists owner_name text;
alter table public.filiais add column if not exists owner_email text;
alter table public.filiais add column if not exists billing_plan text;
alter table public.filiais add column if not exists billing_status text;
alter table public.filiais add column if not exists domain text;
alter table public.filiais add column if not exists is_active boolean not null default true;
alter table public.filiais add column if not exists created_at timestamptz not null default now();
create index if not exists idx_filiais_active on public.filiais(is_active);

-- EMPREENDIMENTOS
create table if not exists public.empreendimentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text null,
  status text not null default 'pendente',
  total_lotes integer null default 0,
  bounds jsonb null,
  geojson_url text null,
  masterplan_url text null,
  filial_id uuid not null,
  created_by uuid null,
  created_by_email text null,
  approved_by uuid null,
  approved_at timestamptz null,
  rejection_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz null default now(),
  constraint empreendimentos_filial_id_fkey foreign key (filial_id) references public.filiais(id) on delete cascade
);
create index if not exists idx_emp_filial on public.empreendimentos(filial_id);
create index if not exists idx_emp_status on public.empreendimentos(status);

-- USER_PROFILES
create table if not exists public.user_profiles (
  user_id uuid primary key,
  email text null,
  full_name text null,
  role text not null,
  panels text[] null,
  is_active boolean not null default true,
  filial_id uuid not null,
  updated_at timestamptz null default now(),
  constraint user_profiles_email_key unique (email),
  constraint user_profiles_filial_id_fkey foreign key (filial_id) references public.filiais(id),
  constraint user_profiles_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade
);
create index if not exists idx_up_filial on public.user_profiles(filial_id);

-- TRIGGER updated_at em user_profiles
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'tg_up_updated_at') then
    create trigger tg_up_updated_at before update on public.user_profiles
    for each row execute function public.set_updated_at();
  end if;
end$$;

-- Lotes (compatível com as páginas Lotes/Mapa/MapView)
create table if not exists public.lotes (
  id uuid primary key default gen_random_uuid(),
  empreendimento_id uuid not null references public.empreendimentos(id) on delete cascade,
  filial_id uuid not null references public.filiais(id),
  nome text not null,
  numero integer null,
  status text not null default 'disponivel',
  area_m2 numeric(10,2) null,
  perimetro_m numeric(10,2) null,
  area_hectares numeric(12,4) null,
  valor numeric(12,2) null default 0.00,     -- usado em Lotes.tsx
  preco numeric(12,2) null,                   -- usado em MapView via RPC (alias para compatibilidade)
  coordenadas jsonb null,
  geometria jsonb null,
  properties jsonb null,
  comprador_nome text null,
  comprador_email text null,
  data_venda timestamptz null,
  observacoes text null,
  geom geometry null,
  created_at timestamptz not null default now(),
  updated_at timestamptz null default now()
);
create index if not exists idx_lotes_emp on public.lotes(empreendimento_id);
create index if not exists idx_lotes_filial on public.lotes(filial_id);
create index if not exists idx_lotes_status on public.lotes(status);
create index if not exists idx_lotes_geom on public.lotes using gist (geom);

-- sincroniza preco/valor (manter compat)
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

create or replace function public.set_lote_filial()
returns trigger language plpgsql as $$
begin
  if new.filial_id is null then
    select filial_id into new.filial_id from public.empreendimentos where id = new.empreendimento_id;
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
  if not exists (select 1 from pg_trigger where tgname = 'tg_lotes_set_filial') then
    create trigger tg_lotes_set_filial
    before insert on public.lotes
    for each row execute function public.set_lote_filial();
  end if;
end$$;

-- MASTERPLAN OVERLAYS
create table if not exists public.masterplan_overlays (
  id uuid primary key default gen_random_uuid(),
  empreendimento_id uuid not null references public.empreendimentos(id) on delete cascade,
  filial_id uuid not null references public.filiais(id),
  image_path text not null,
  bounds jsonb not null,       -- GeoJSON Polygon
  opacity numeric(4,2) not null default 0.5,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz null default now()
);
create index if not exists idx_mpo_emp on public.masterplan_overlays(empreendimento_id);
create index if not exists idx_mpo_filial on public.masterplan_overlays(filial_id);
create index if not exists idx_mpo_is_active on public.masterplan_overlays(is_active);

create or replace function public.set_mpo_filial()
returns trigger language plpgsql as $$
begin
  if new.filial_id is null then
    select filial_id into new.filial_id from public.empreendimentos where id = new.empreendimento_id;
  end if;
  return new;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'tg_mpo_updated_at') then
    create trigger tg_mpo_updated_at
    before update on public.masterplan_overlays
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'tg_mpo_set_filial') then
    create trigger tg_mpo_set_filial
    before insert on public.masterplan_overlays
    for each row execute function public.set_mpo_filial();
  end if;
end$$;

-- Filial Allowed Panels (whitelist de painéis)
create table if not exists public.filial_allowed_panels (
  filial_id uuid not null references public.filiais(id) on delete cascade,
  panel text not null,
  created_at timestamptz not null default now(),
  constraint filial_allowed_panels_pk primary key (filial_id, panel)
);

-- ============== RLS ===========================
alter table public.filiais enable row level security;
alter table public.empreendimentos enable row level security;
alter table public.user_profiles enable row level security;
alter table public.lotes enable row level security;
alter table public.masterplan_overlays enable row level security;
alter table public.filial_allowed_panels enable row level security;

-- políticas básicas (por filial) + admins têm acesso total
-- FILIAIS
create policy if not exists filiais_select on public.filiais
for select to authenticated
using (public.is_admin() or exists (
  select 1 from public.user_profiles up where up.user_id = auth.uid() and up.is_active and up.filial_id = filiais.id
));
create policy if not exists filiais_admin_write on public.filiais
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- EMPREENDIMENTOS (por filial)
create policy if not exists emp_select on public.empreendimentos
for select to authenticated
using (public.is_admin() or exists (
  select 1 from public.user_profiles up where up.user_id = auth.uid() and up.is_active and up.filial_id = empreendimentos.filial_id
));
create policy if not exists emp_write on public.empreendimentos
for insert to authenticated with check (
  public.is_admin() or exists (
    select 1 from public.user_profiles up where up.user_id = auth.uid() and up.is_active and up.filial_id = empreendimentos.filial_id
  )
);
create policy if not exists emp_update on public.empreendimentos
for update to authenticated
using (public.is_admin() or exists (
  select 1 from public.user_profiles up where up.user_id = auth.uid() and up.is_active and up.filial_id = empreendimentos.filial_id
))
with check (public.is_admin() or exists (
  select 1 from public.user_profiles up where up.user_id = auth.uid() and up.is_active and up.filial_id = empreendimentos.filial_id
));

-- USER_PROFILES (self + admins)
create policy if not exists up_self_read on public.user_profiles
for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy if not exists up_self_insert on public.user_profiles
for insert to authenticated with check (public.is_admin() or user_id = auth.uid());
create policy if not exists up_self_update on public.user_profiles
for update to authenticated using (public.is_admin() or user_id = auth.uid()) with check (public.is_admin() or user_id = auth.uid());

-- LOTES (por filial)
create policy if not exists lotes_select on public.lotes
for select to authenticated
using (public.is_admin() or exists (
  select 1 from public.user_profiles up
  where up.user_id = auth.uid() and up.is_active and up.filial_id = public.lotes.filial_id
));
create policy if not exists lotes_write on public.lotes
for insert to authenticated with check (public.is_admin() or exists (
  select 1 from public.user_profiles up
  where up.user_id = auth.uid() and up.is_active and up.filial_id = public.lotes.filial_id
));
create policy if not exists lotes_update on public.lotes
for update to authenticated
using (public.is_admin() or exists (
  select 1 from public.user_profiles up
  where up.user_id = auth.uid() and up.is_active and up.filial_id = public.lotes.filial_id
))
with check (public.is_admin() or exists (
  select 1 from public.user_profiles up
  where up.user_id = auth.uid() and up.is_active and up.filial_id = public.lotes.filial_id
));

-- MASTERPLAN_OVERLAYS (mesma regra por filial)
create policy if not exists mpo_select on public.masterplan_overlays
for select to authenticated
using (public.is_admin() or exists (
  select 1 from public.user_profiles up
  where up.user_id = auth.uid() and up.is_active and up.filial_id = public.masterplan_overlays.filial_id
));
create policy if not exists mpo_write on public.masterplan_overlays
for insert to authenticated with check (public.is_admin() or exists (
  select 1 from public.user_profiles up
  where up.user_id = auth.uid() and up.is_active and up.filial_id = public.masterplan_overlays.filial_id
));
create policy if not exists mpo_update on public.masterplan_overlays
for update to authenticated using (public.is_admin() or exists (
  select 1 from public.user_profiles up
  where up.user_id = auth.uid() and up.is_active and up.filial_id = public.masterplan_overlays.filial_id
)) with check (public.is_admin() or exists (
  select 1 from public.user_profiles up
  where up.user_id = auth.uid() and up.is_active and up.filial_id = public.masterplan_overlays.filial_id
));

-- FILIAL_ALLOWED_PANELS
create policy if not exists fap_select on public.filial_allowed_panels
for select to authenticated using (public.is_admin() or exists (
  select 1 from public.user_profiles up
  where up.user_id = auth.uid() and up.is_active and up.filial_id = filial_allowed_panels.filial_id
));
create policy if not exists fap_write on public.filial_allowed_panels
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============== STORAGE =======================
-- Buckets privados, com select e insert para autenticados
do $$ begin
  if not exists (select 1 from storage.buckets where id = 'empreendimentos') then
    perform storage.create_bucket('empreendimentos', false, null);
  end if;
  if not exists (select 1 from storage.buckets where id = 'masterplans') then
    perform storage.create_bucket('masterplans', false, null);
  end if;
end $$;

-- Policies de acesso
create policy if not exists "auth select empreendimentos"
on storage.objects for select to authenticated
using (bucket_id = 'empreendimentos');
create policy if not exists "auth insert empreendimentos"
on storage.objects for insert to authenticated
with check (bucket_id = 'empreendimentos');

create policy if not exists "auth select masterplans"
on storage.objects for select to authenticated
using (bucket_id = 'masterplans');
create policy if not exists "auth insert masterplans"
on storage.objects for insert to authenticated
with check (bucket_id = 'masterplans');

-- ============== RPCs ==========================

-- 1) get_my_allowed_panels: retorna whitelist da filial do usuário
create or replace function public.get_my_allowed_panels()
returns text[] language sql stable as $$
  with me as (
    select filial_id from public.user_profiles where user_id = auth.uid() and is_active limit 1
  )
  select coalesce(array_agg(panel order by panel), array[]::text[])
  from public.filial_allowed_panels fap
  join me on me.filial_id = fap.filial_id;
$$;

-- 2) set_filial_allowed_panels: sobrescreve a whitelist
create or replace function public.set_filial_allowed_panels(p_filial_id uuid, p_panels text[])
returns void language plpgsql as $$
begin
  delete from public.filial_allowed_panels where filial_id = p_filial_id;
  insert into public.filial_allowed_panels (filial_id, panel)
  select p_filial_id, unnest(p_panels);
end $$;

-- 3) update_lote_status (assinatura usada no app: p_novo_status)
create or replace function public.update_lote_status(p_lote_id uuid, p_novo_status text)
returns boolean language plpgsql as $$
begin
  update public.lotes
     set status = p_novo_status,
         data_venda = case when lower(p_novo_status) = 'vendido' then now() else null end
   where id = p_lote_id;
  return found;
end $$;

-- 4) update_lote_valor (assinatura usada no app: p_novo_valor)
create or replace function public.update_lote_valor(p_lote_id uuid, p_novo_valor numeric)
returns boolean language plpgsql as $$
begin
  update public.lotes set valor = p_novo_valor, preco = p_novo_valor where id = p_lote_id;
  return found;
end $$;

-- 5) lotes_geojson: FeatureCollection para Leaflet
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

-- 6) get_filial_empreendimentos: devolve apenas ids (o app busca detalhes depois)
create or replace function public.get_filial_empreendimentos(p_filial_id uuid)
returns table(empreendimento_id uuid) language sql stable as $$
  select e.id as empreendimento_id
  from public.empreendimentos e
  where e.filial_id = p_filial_id;
$$;

-- 7) get_empreendimento_lotes: usado pelo MapView/Mapas
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

-- 8) get_all_empreendimentos_overview: ids (usado no mapa superadmin)
create or replace function public.get_all_empreendimentos_overview()
returns table(empreendimento_id uuid) language sql stable as $$
  select id as empreendimento_id from public.empreendimentos;
$$;

-- 9) approve_empreendimento (aprova/rejeita)
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

-- 10) Vendas stats por empreendimento (Mapa Interativo)
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

-- 11) Admin helpers
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

-- 12) Processar GeoJSON de lotes (conforme usado em EmpreendimentoNovo)
-- OBS: versão enxuta – remove lotes do empreendimento e insere novos
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

    -- extrai numero se existir
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