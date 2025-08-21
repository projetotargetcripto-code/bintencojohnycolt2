## Manual de configuração do Supabase

### 1. Criar e preparar o projeto
1. Crie um projeto no [Supabase](https://supabase.com/).
2. No **SQL Editor**, importe o conteúdo completo de `instalar/banco.sql`. Esse script habilita extensões (`pgcrypto`, `postgis`), cria as tabelas e funções necessárias e já aplica políticas de storage e RLS.

### 2. Configurar o Storage
1. No painel do Supabase, acesse **Storage → Create new bucket**.
2. Nomeie o bucket como `empreendimentos`, marque-o como **Public** e adicione os MIME types permitidos: `application/json`, `application/geo+json`, `image/jpeg`, `image/png`, `image/gif`, `image/webp`.
3. As políticas de acesso do bucket já estão incluídas em `instalar/banco.sql`.

### 3. Variáveis de ambiente da aplicação
Crie um arquivo `.env.local` no projeto com:
```
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<chave-anon>
# opcional para scripts/edge functions
VITE_SUPABASE_SERVICE_ROLE_KEY=<chave-service-role>
```
A aplicação depende dessas variáveis para inicializar o cliente do Supabase.

### 4. Função Edge `create-admin-filial`
1. Instale o [Supabase CLI](https://supabase.com/docs/guides/cli).
2. Autentique-se com `supabase login`.
3. Defina os segredos do projeto:
```
supabase secrets set \
  SUPABASE_URL=https://<seu-projeto>.supabase.co \
  SUPABASE_ANON_KEY=<chave-anon> \
  SUPABASE_SERVICE_ROLE_KEY=<chave-service-role> \
  --project-ref <seu-project-ref>
```
4. Faça o deploy:
```
supabase functions deploy create-admin-filial --project-ref <seu-project-ref>
```
A função depende das variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` para criar usuários administradores de filial com privilégios adequados.

### 5. Criar usuários iniciais
1. No painel **Authentication → Users**, crie ao menos um usuário `superadmin` e, se necessário, usuários `adminfilial`.
2. Para cada usuário criado, insira o perfil correspondente:
```
INSERT INTO user_profiles (user_id, email, full_name, role, is_active)
VALUES ('<id-do-user>', 'superadmin@exemplo.com', 'Super Admin', 'superadmin', true);
```
Associe `filial_id` para perfis que não sejam superadmin.

### 6. Executar o projeto local
1. Instale as dependências: `npm install`
2. Inicie o ambiente de desenvolvimento: `npm run dev`

Após esses passos o projeto estará pronto para uso, com banco de dados, storage, funções e perfis configurados.
