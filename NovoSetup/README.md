# 🚀 Setup do Supabase para BlockURB

Este diretório reúne todos os arquivos necessários para configurar o projeto com o Supabase. Siga os passos abaixo para preparar o ambiente e verifique as funcionalidades disponíveis ao final.

## 📋 Pré-requisitos
- Conta no [Supabase](https://supabase.com)
- Projeto já criado e com acesso ao dashboard
- Node.js e npm instalados para executar a aplicação

## 🛠️ Passo a passo de configuração
1. **Acessar o dashboard:**
   - https://supabase.com/dashboard
   - Faça login e selecione o projeto apropriado.
2. **Configurar o banco de dados:**
   - No menu lateral, abra **SQL Editor** → **New Query**.
   - Copie todo o conteúdo de [`sql/sql.final.referenciado.sql`](sql/sql.final.referenciado.sql) e execute.
   - Este script habilita extensões (`pgcrypto`, `postgis`), cria tabelas, funções RPC, políticas de RLS e configurações de storage.
   - As migrações adicionais estão em [`sql/migrations/`](sql/migrations/).
3. **Configurar o Storage:**
   - Ainda no dashboard, clique em **Storage**.
   - Crie o bucket `empreendimentos` marcado como **Public**.
   - As políticas de acesso já estão incluídas no script SQL principal.
4. **Verificar se funcionou:**
   - No SQL Editor, rode:
     ```sql
     SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
     AND table_name IN ('empreendimentos', 'lotes', 'masterplan_overlays');
     ```
   - No Storage, confirme que o bucket `empreendimentos` existe.
5. **Rodar a aplicação localmente:**
   ```bash
   npm install
   npm run dev
   ```
   - Acesse http://localhost:8080 e verifique no console "Supabase conectado".

## 🧱 Estrutura criada
- **Tabelas:** `empreendimentos`, `lotes`, `masterplan_overlays`, `user_profiles`
- **Funções RPC:** `lotes_geojson`, `create_empreendimento_from_geojson`, `add_masterplan_overlay`, `approve_empreendimento`, `get_user_profile`
- **Storage:** bucket `empreendimentos` com políticas de leitura pública e upload autenticado
- **Dados de exemplo:** 1 empreendimento com lotes e diferentes status

## 🔐 Configuração local
O arquivo `.env.local` deve conter:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
Variáveis de login rápido para desenvolvimento podem ser adicionadas seguindo o padrão `VITE_<ROLE>_EMAIL` e `VITE_<ROLE>_PASSWORD`.

## 🧪 Funcionalidades testáveis
- **Autenticação:** criação de contas, login/logout e proteção de rotas
- **Mapa interativo:** visualização de empreendimentos e lotes via RPC
- **Adicionar empreendimento:** upload de GeoJSON e masterplan com salvamento no banco

## 📂 Scripts e SQL
- `scripts/`
  - `supabase-complete-setup.js`
  - `apply-all-fixes.js`
  - `direct-database-fixes.js`
- `sql/`
  - `sql.final.referenciado.sql`
  - `sqlsemreferencia.sql`
  - `migrations/`

## 🧩 Solução de problemas
- **Aparece "Modo Mock":** verifique variáveis de ambiente e se o SQL foi executado.
- **Upload falha:** confira se o bucket foi criado e se as políticas foram aplicadas.
- **Dados não carregam:** reexecute o script SQL e verifique logs no navegador.

## ✅ Checklist final
- [ ] SQL executado sem erros
- [ ] Bucket de storage criado
- [ ] Dados de exemplo disponíveis
- [ ] Aplicação rodando sem avisos de mock
- [ ] Login e cadastro funcionando
- [ ] Mapa carregando empreendimentos
- [ ] Uploads funcionando

## 🎯 Resultado esperado
Ao fim do processo você terá:
- Banco de dados estruturado e populado
- Storage configurado para uploads
- Autenticação real integrada
- Mapa interativo com dados reais
- Formulários salvando no banco

Pronto! O BlockURB estará totalmente funcional com o Supabase. 🚀
