# Manual RLS Access Tests

These steps verify that row level security policies based on `filial_id` prevent cross-branch access.

1. **Setup filiais**
   - Create two filiais `filial_a` and `filial_b`.
   - Insert at least one `empreendimento` and `lote` for each filial.
2. **Create users**
   - Create user `user_a` in `filial_a` and user `user_b` in `filial_b`.
   - Ensure each user's JWT includes `filial_id` claim via `auth.updateUser`.
3. **Read isolation**
   - Authenticate as `user_a` and run `select * from empreendimentos;`.
   - Confirm only rows with `filial_id = filial_a` are returned.
   - Repeat for `user_b` and verify only `filial_b` rows appear.
4. **Write isolation**
   - Authenticated as `user_a`, attempt `insert into empreendimentos (filial_id, nome) values (filial_b, 'X');`.
   - Expect `permission denied` due to RLS.
   - Authenticated as `user_b`, attempt to `update` a row belonging to `filial_a` and confirm it fails.
5. **Masterplan overlays and lotes**
   - Repeat similar `select` and `insert` tests on `lotes` and `masterplan_overlays` ensuring cross-filial access is denied.
6. **Reservas e concorrência**
   - Confirme que as tabelas `lotes` e `reservas` têm RLS habilitado com políticas usando `filial_id` do JWT.
   - A função `reservar_lote` roda como `security definer`, mas depende dessas políticas para restringir acesso entre filiais.
   - Para validar, tente reservar o mesmo `lote_id` simultaneamente em duas sessões; apenas uma deve obter `success = true`.

Document the observed results for future reference.
