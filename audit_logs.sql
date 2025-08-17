-- ================================================================
-- Audit logs and KPI aggregation
-- ================================================================

-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "cron";

-- Table to store audit events
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  filial_id uuid references public.filiais(id) on delete set null,
  action text not null,
  table_name text,
  record_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Enable RLS and policies
alter table public.audit_logs enable row level security;

create policy "allow_insert_auth" on public.audit_logs
  for insert
  with check (auth.role() = 'authenticated');

create policy "superadmin_select" on public.audit_logs
  for select using (
    exists (
      select 1 from public.user_profiles up
      where up.user_id = auth.uid() and up.role = 'superadmin'
    )
  );

-- Aggregated KPIs table
create table if not exists public.kpi_aggregates (
  filial_id uuid references public.filiais(id) on delete cascade,
  total_logins bigint default 0,
  total_criacoes bigint default 0,
  total_atualizacoes bigint default 0,
  calculated_at timestamptz not null default now()
);

-- Function to refresh KPI aggregates
create or replace function public.refresh_kpi_aggregates()
returns void language plpgsql security definer as $$
begin
  truncate table public.kpi_aggregates;
  insert into public.kpi_aggregates (filial_id, total_logins, total_criacoes, total_atualizacoes)
  select
    filial_id,
    count(*) filter (where action = 'login') as total_logins,
    count(*) filter (where action = 'create') as total_criacoes,
    count(*) filter (where action = 'update') as total_atualizacoes
  from public.audit_logs
  group by filial_id;
end;
$$;

-- RPC to fetch aggregates
create or replace function public.get_global_kpis()
returns table (
  filial_id uuid,
  total_logins bigint,
  total_criacoes bigint,
  total_atualizacoes bigint,
  calculated_at timestamptz
) language sql security definer as $$
  select filial_id, total_logins, total_criacoes, total_atualizacoes, calculated_at
  from public.kpi_aggregates;
$$;

-- Schedule periodic refresh every hour
select cron.schedule(
  'refresh_kpi_aggregates',
  '0 * * * *',
  $$select public.refresh_kpi_aggregates()$$
);
