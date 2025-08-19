create or replace function public.reservar_lote(
  p_lote_id uuid,
  p_ttl integer default 300
)
returns table(success boolean, expires_at timestamptz)
language plpgsql
as $$
declare
  v_expira timestamptz := now() + make_interval(secs => p_ttl);
begin
  -- lock row to prevent concurrent reservations
  perform 1 from public.lotes where id = p_lote_id and status = 'disponivel' for update;
  if not found then
    success := false;
    expires_at := null;
    return next;
    return;
  end if;

  update public.lotes
     set status = 'reservado',
         reserva_expira_em = v_expira
   where id = p_lote_id;

  success := true;
  expires_at := v_expira;
  return next;
end;
$$;
