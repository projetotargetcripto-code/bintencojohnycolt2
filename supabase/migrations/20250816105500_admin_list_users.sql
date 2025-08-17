-- Add admin_list_users function
create or replace function public.admin_list_users()
returns setof auth.users
language plpgsql
security definer
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin required';
  end if;
  return query select * from auth.users;
end $$;

grant execute on function public.admin_list_users() to authenticated;
