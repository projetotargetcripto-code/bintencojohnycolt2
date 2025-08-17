# ✅ População automática de user_profiles

## 🗄️ Alterações
- Função `handle_new_user` e trigger `on_auth_user_created` preenchem `user_profiles` com `role` padrão `investidor` sempre que um novo usuário é criado.

### Executar
- Rodar `NovoSetup/sql/sql.final.referenciado.sql` ou a migration `NovoSetup/sql/migrations/20250816120000_user_profile_trigger.sql` no Supabase.

## 🧪 Testar
1. Acesse `/signup` e cadastre um usuário.
2. Verifique na tabela `user_profiles` se o registro foi criado com `role = 'investidor'.`
