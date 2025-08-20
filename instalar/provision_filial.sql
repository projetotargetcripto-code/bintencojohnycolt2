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
