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

-- Function to link user to filial atomically
create or replace function link_user_to_filial(p_user_id uuid, p_filial_id uuid)
returns void
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

  insert into audit_logs(actor, action, target, metadata)
  values (auth.uid(), 'link_user_filial', p_user_id::text, jsonb_build_object('filial_id', p_filial_id));
end;
$$;
