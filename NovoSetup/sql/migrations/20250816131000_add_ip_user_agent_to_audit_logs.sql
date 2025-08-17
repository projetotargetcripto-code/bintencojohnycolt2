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
