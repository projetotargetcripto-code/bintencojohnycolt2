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
