-- Define default role 'investidor' for new users and restrict role assignments

-- Trigger to create a profile and assign default role after user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.user_profiles (user_id, email, full_name, role, is_active)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'investidor', true);
  update auth.users
     set raw_app_meta_data = jsonb_set(coalesce(raw_app_meta_data, '{}'::jsonb), '{role}', to_jsonb('investidor'), true)
   where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper functions to detect superadmin
create or replace function public.is_superadmin(uid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.user_profiles up
    where up.user_id = uid and up.is_active and lower(up.role) = 'superadmin'
  );
$$;

create or replace function public.is_superadmin()
returns boolean language sql stable as $$
  select public.is_superadmin(auth.uid());
$$;

-- Only superadmin may assign roles other than the default 'investidor'
create or replace function public.admin_update_user_role(p_user_id uuid, p_role text)
returns void language plpgsql as $$
begin
  if lower(p_role) <> 'investidor' then
    if not public.is_superadmin(auth.uid()) then
      raise exception 'superadmin required';
    end if;
  else
    if not public.is_admin(auth.uid()) then
      raise exception 'admin required';
    end if;
  end if;
  update public.user_profiles
    set role = p_role,
        updated_at = now()
    where user_id = p_user_id;
end;
$$;
