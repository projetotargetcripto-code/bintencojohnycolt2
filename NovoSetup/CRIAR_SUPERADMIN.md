# 👑 Criando o primeiro usuário superadmin

Para registrar o primeiro superadministrador e vinculá-lo a uma filial "Matriz" no Supabase:

1. **Criar a Filial Matriz**
   - No **SQL Editor**, execute:
     ```sql
     INSERT INTO filiais (nome, is_active)
     VALUES ('Matriz', true)
     RETURNING id;
     ```
   - Guarde o `id` retornado para usar no próximo passo.

2. **Criar o usuário no Auth do Supabase**
   - No dashboard do Supabase vá em **Authentication → Users** e adicione um usuário (por exemplo `superadmin@blockurb.com`).
   - Defina a senha desejada e marque o e-mail como confirmado.

3. **Inserir o perfil com a role `superadmin`**
   - No **SQL Editor**, execute:
     ```sql
     INSERT INTO user_profiles (user_id, email, full_name, role, panels, is_active, filial_id)
     VALUES (
       '<ID do usuário recém-criado>',
       'superadmin@blockurb.com',
       'Super Administrador',
       'superadmin',
       ARRAY['superadmin','adminfilial','urbanista','juridico','contabilidade','marketing','comercial','imobiliaria','corretor','obras','investidor','terrenista'],
       true,
       '<ID da filial Matriz>'
     );
     ```
    - Substitua `<ID do usuário recém-criado>` pelo `id` exibido no Auth e `<ID da filial Matriz>` pelo valor retornado no passo 1.

4. **Opcional: definir o papel no `app_metadata`**
   - Para garantir que o login reconheça o superadmin mesmo se a RPC falhar, adicione o papel ao `app_metadata`:
     ```ts
     import { supabase } from '@/lib/dataClient';

     await supabase.auth.admin.updateUserById('<ID do usuário recém-criado>', {
       app_metadata: { role: 'superadmin' }
     });
     ```
   - Faça logout e login novamente para que o JWT inclua o papel `superadmin`.

Após esses passos, o usuário poderá autenticar-se normalmente e terá acesso a todos os painéis do sistema como superadministrador, já vinculado à Filial Matriz.
