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
