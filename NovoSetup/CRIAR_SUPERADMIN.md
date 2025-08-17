# 👑 Criando o primeiro usuário superadmin

Para registrar o primeiro superadministrador no Supabase:

1. **Criar o usuário no Auth do Supabase**
   - No dashboard do Supabase vá em **Authentication → Users** e adicione um usuário (por exemplo `superadmin@blockurb.com`).
   - Defina a senha desejada e marque o e-mail como confirmado.

2. **Inserir o perfil com a role `superadmin`**
   - No **SQL Editor**, execute:
     ```sql
     INSERT INTO user_profiles (user_id, email, full_name, role, panels, is_active)
     VALUES (
       '<ID do usuário recém-criado>',
       'superadmin@blockurb.com',
       'Super Administrador',
       'superadmin',
       ARRAY['superadmin','adminfilial','urbanista','juridico','contabilidade','marketing','comercial','imobiliaria','corretor','obras','investidor','terrenista'],
       true
     );
     ```
   - Substitua `<ID do usuário recém-criado>` pelo `id` exibido no Auth.

Após esses passos, o usuário poderá autenticar-se normalmente e terá acesso a todos os painéis do sistema como superadministrador.
