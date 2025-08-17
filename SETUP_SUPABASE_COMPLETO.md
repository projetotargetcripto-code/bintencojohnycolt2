# 🚀 Setup Completo do Supabase para BlockURB

## 📋 Passos para Executar

### 1. **Acessar o Supabase Dashboard**
- Vá para: https://supabase.com/dashboard
- Faça login na sua conta
- Selecione o projeto: `udprxokzunffwsxjvdch`

### 2. **Configurar o Banco de Dados**
1. No dashboard, clique em **"SQL Editor"** na barra lateral
2. Clique em **"New Query"**
3. Copie TODO o conteúdo de `NovoSetup/sql.final.referenciado.sql`
4. Cole no editor SQL
5. Clique em **"Run"** (ou Ctrl+Enter)
6. ✅ Aguarde a execução (pode demorar 30-60 segundos)

### 3. **Configurar Storage**
1. Na barra lateral, clique em **"Storage"**
2. Clique em **"Create a new bucket"**
3. Nome do bucket: `empreendimentos`
4. Marque **"Public bucket"** ✅
5. Clique em **"Create bucket"**
6. As políticas de acesso já estão incluídas no script, não sendo necessário executar SQL adicional.

### 4. **Verificar se Funcionou**
1. No SQL Editor, execute:
```sql
-- Verificar tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('empreendimentos', 'lotes', 'masterplan_overlays');

-- Verificar dados de exemplo
SELECT id, nome, total_lotes FROM empreendimentos;

-- Verificar lotes
SELECT codigo, status, preco FROM lotes LIMIT 5;
```

2. No Storage, verificar se o bucket `empreendimentos` existe

### 5. **Testar a Aplicação**
1. No terminal, execute: `npm run dev`
2. Acesse: http://localhost:8080
3. ✅ No console deve aparecer: **Supabase conectado** (sem warning de mock)

## 🔍 Estrutura Criada

### **Tabelas:**
- ✅ `empreendimentos` - Dados principais dos empreendimentos
- ✅ `lotes` - Lotes individuais com geometria
- ✅ `masterplan_overlays` - Overlays de masterplan

### **Funções RPC:**
- ✅ `lotes_geojson(uuid)` - Retorna GeoJSON dos lotes
- ✅ `create_empreendimento_from_geojson(...)` - Cria empreendimento
- ✅ `add_masterplan_overlay(...)` - Adiciona overlay

### **Storage:**
- ✅ Bucket `empreendimentos` - Para GeoJSON e imagens
- ✅ Políticas de acesso configuradas

### **Dados de Exemplo:**
- ✅ 1 empreendimento com 5 lotes
- ✅ Lotes com diferentes status (disponível, reservado, vendido)
- ✅ Coordenadas reais de São Paulo

## 🧪 Funcionalidades Testáveis

### **Login/Cadastro:**
- ✅ Criação de conta
- ✅ Login com email/senha
- ✅ Logout

### **Mapa Interativo:**
- ✅ Visualizar empreendimentos
- ✅ Carregar lotes via RPC
- ✅ Filtros e busca
- ✅ Popup com detalhes dos lotes

### **Adicionar Empreendimento:**
- ✅ Upload de GeoJSON
- ✅ Upload de masterplan
- ✅ Salvamento no banco
- ✅ Redirecionamento para mapa

## 🔧 Solução de Problemas

### **Se aparecer "Modo Mock":**
1. Verificar se as variáveis de ambiente estão corretas no `.env.local`
2. Verificar se o banco foi criado executando o SQL
3. Testar conectividade no browser console

### **Se Upload falhar:**
1. Verificar se o bucket foi criado
2. Verificar se as políticas foram aplicadas
3. Testar upload manual no dashboard

### **Se dados não carregarem:**
1. Executar dados de exemplo novamente
2. Verificar se as RPC functions existem
3. Verificar logs no Network tab do browser

## ✅ Checklist Final

- [ ] SQL do banco executado com sucesso (NovoSetup/sql.final.referenciado.sql)
- [ ] Bucket de storage criado
- [ ] Políticas de storage aplicadas (já incluídas no script)
- [ ] Dados de exemplo inseridos
- [ ] Aplicação rodando sem warnings de mock
- [ ] Login/cadastro funcionando
- [ ] Mapa carregando empreendimentos
- [ ] Upload de arquivos funcionando

## 🎯 Resultado Esperado

Ao final, você terá:
- ✅ Sistema 100% integrado com Supabase
- ✅ Banco de dados estruturado e populado
- ✅ Storage configurado para uploads
- ✅ Autenticação real funcionando
- ✅ Mapa interativo com dados reais
- ✅ Formulários salvando no banco

**🚀 O BlockURB estará completamente funcional!**

