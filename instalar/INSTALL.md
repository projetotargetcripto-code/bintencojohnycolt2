## Passo a passo de instalação

1. Crie um projeto no [Supabase](https://supabase.com/).
2. No **SQL Editor**, importe o conteúdo de `install.sql`. Esse script habilita extensões, cria tabelas e funções necessárias e aplica políticas.
3. Em **Storage**, crie um bucket chamado `empreendimentos`, marque-o como **Public** e adicione os MIME types permitidos (`application/json`, `application/geo+json`, `image/jpeg`, `image/png`, `image/gif`, `image/webp`).
4. Defina as variáveis de ambiente no arquivo `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_SERVICE_ROLE_KEY` (opcional para scripts e edge functions)
5. Execute os comandos do arquivo `cli.md` para autenticar no Supabase, definir segredos, publicar as edge functions e iniciar o projeto.
6. No painel **Authentication → Users**, crie um usuário `superadmin` e outros conforme necessário. Insira o perfil correspondente na tabela `user_profiles`, associando `filial_id` quando não for `superadmin`.
7. Após esses passos, o projeto estará pronto para uso.
