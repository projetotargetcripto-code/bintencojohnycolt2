# 👥 Usuários e Credenciais do BlockURB

## 🔐 Sistema de Autenticação Configurado

### ✅ Status do Banco
- **Tabelas**: Criadas e funcionais
- **Storage**: Bucket `empreendimentos` configurado
- **Usuários**: 12 perfis criados
- **RPC Functions**: Sistema de permissões implementado

## 👑 Super Administrador
**Email:** `superadmin@blockurb.com`  
**Senha:** `BlockUrb2024!`  
**Acesso:** Todos os painéis (*)  
**Descrição:** Acesso completo ao sistema

## 🏢 Painéis Administrativos

### Administrador Filial
**Email:** `admin@blockurb.com`  
**Senha:** `Admin2024!`  
**Painel:** `/adminfilial` ou `/admin`  
**Funcionalidades:** Gestão geral da filial

### Urbanista
**Email:** `urbanista@blockurb.com`  
**Senha:** `Urban2024!`  
**Painel:** `/urbanista`  
**Funcionalidades:** Projetos urbanos e mapas

### Jurídico
**Email:** `juridico@blockurb.com`  
**Senha:** `Legal2024!`  
**Painel:** `/juridico`  
**Funcionalidades:** Contratos e processos

### Contabilidade
**Email:** `contabilidade@blockurb.com`  
**Senha:** `Conta2024!`  
**Painel:** `/contabilidade`  
**Funcionalidades:** Financeiro e fiscal

### Marketing
**Email:** `marketing@blockurb.com`  
**Senha:** `Market2024!`  
**Painel:** `/marketing`  
**Funcionalidades:** Campanhas e materiais

### Comercial
**Email:** `comercial@blockurb.com`  
**Senha:** `Venda2024!`  
**Painel:** `/comercial`  
**Funcionalidades:** Leads e propostas

### Imobiliária
**Email:** `imobiliaria@blockurb.com`  
**Senha:** `Imob2024!`  
**Painel:** `/imobiliaria`  
**Funcionalidades:** Corretores e leads

### Corretor
**Email:** `corretor@blockurb.com`  
**Senha:** `Corret2024!`  
**Painel:** `/corretor`  
**Funcionalidades:** Leads e vendas

### Obras
**Email:** `obras@blockurb.com`  
**Senha:** `Obras2024!`  
**Painel:** `/obras`  
**Funcionalidades:** Cronograma e andamento

### Investidor
**Email:** `investidor@blockurb.com`  
**Senha:** `Invest2024!`  
**Painel:** `/investidor`  
**Funcionalidades:** Carteira e suporte

### Terrenista
**Email:** `terrenista@blockurb.com`
**Senha:** `Terra2024!`
**Painel:** `/terrenista`
**Funcionalidades:** Status e pagamentos

## 🔐 Criação de Contas Privilegiadas

- O formulário de cadastro cria **sempre** usuários com o cargo `investidor`.
- Para atribuir cargos elevados (ex.: `admin`, `superadmin`), um **superadmin** deve utilizar a função protegida `admin_update_user_role`.
- Recomendação:
  1. Solicitar que o novo usuário realize o cadastro comum.
  2. Confirmar o e-mail do usuário.
  3. Executar, autenticado como superadmin, a chamada RPC `admin_update_user_role` informando `p_user_id` e o cargo desejado.

Assim evitamos que links de cadastro definam privilégios de forma insegura.

## 🗺️ Funcionalidades Especiais

### Mapa Interativo
- **URL:** `/admin/mapa`
- **Acesso:** Usuários admin e superadmin
- **Funcionalidades:**
  - Visualizar empreendimentos
  - Carregar lotes via GeoJSON
  - Filtros e busca
  - Overlay de masterplan

### Adicionar Empreendimento
- **URL:** `/admin/empreendimentos/novo`
- **Acesso:** Usuários admin e superadmin
- **Funcionalidades:**
  - Upload de GeoJSON
  - Upload de masterplan
  - Salvamento no Supabase
  - Pré-visualização no mapa

## 🔧 Configuração Técnica

### Supabase
- **URL:** `https://epsuxumkgakpqykvteij.supabase.co`
- **Anon Key:** Configurada no `.env.local`
- **Tabelas:** `empreendimentos`, `lotes`, `masterplan_overlays`, `user_profiles`
- **Storage:** Bucket `empreendimentos` para uploads

### Sistema de Permissões
- **RPC:** `get_user_profile(user_email)` - Busca perfil do usuário
- **RPC:** `check_user_panel_access(user_email, panel_key)` - Verifica permissões
- **Metadata:** Cada usuário tem role e full_name nos metadados

## 🚀 Como Testar

1. **Acesse:** http://localhost:8081
2. **Faça login** com qualquer usuário acima
3. **Navegue** para o painel correspondente
4. **Teste funcionalidades:**
   - Mapa interativo
   - Upload de arquivos
   - Dados persistentes

## 🛡️ Segurança

- **RLS (Row Level Security)** habilitado
- **Políticas** configuradas por tipo de usuário
- **Storage** com políticas de acesso
- **Senhas** seguras para todos os usuários
- **Email confirmado** automaticamente

## 📊 Dados de Exemplo

O sistema inclui dados de demonstração:
- 1 empreendimento modelo
- 8 lotes com diferentes status
- Coordenadas reais de São Paulo
- Preços e áreas realistas

## 🔍 Troubleshooting

### Se o login falhar:
1. Verificar se o servidor está rodando (`npm run dev`)
2. Verificar credenciais na tabela acima
3. Verificar console do browser para erros

### Se dados não carregarem:
1. Verificar se Supabase está acessível
2. Ver se tabelas foram criadas
3. Verificar permissões do usuário

### Se upload falhar:
1. Verificar se bucket existe
2. Verificar políticas de Storage
3. Testar com arquivos pequenos primeiro

## ✅ Sistema Completo

O BlockURB está 100% funcional com:
- ✅ 12 usuários de teste criados
- ✅ Sistema de permissões implementado
- ✅ Banco de dados estruturado
- ✅ Storage configurado
- ✅ Mapa interativo funcionando
- ✅ Upload de arquivos operacional
- ✅ Dados persistentes

**🎉 Pronto para demonstração e desenvolvimento!**

