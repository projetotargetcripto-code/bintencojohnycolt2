# 🏗️ Atualização do Sistema de Empreendimentos

## ✅ Funcionalidades Implementadas

### 1. **Preview do Masterplan no Mapa**
- Ao fazer upload da imagem do masterplan, ela aparece imediatamente sobreposta ao mapa
- É necessário fazer upload do GeoJSON primeiro para definir os limites
- A imagem é ajustada automaticamente aos bounds do empreendimento

### 2. **Sistema de Aprovação de Empreendimentos**
- Novos empreendimentos são criados com status "pendente"
- Super Admin e Admin podem aprovar/rejeitar empreendimentos
- Rastreamento de quem criou o empreendimento (email e ID do usuário)
- Motivo de rejeição pode ser informado

### 3. **Página de Aprovação**
- Acessível em: `/admin/empreendimentos/aprovacao`
- Lista todos os empreendimentos com seus status
- Mostra informações do criador e data de criação
- Botões para aprovar/rejeitar com feedback visual
- Links para visualizar GeoJSON e Masterplan

### 4. **Melhorias na Criação**
- Upload de GeoJSON atualiza automaticamente os bounds
- Upload de Masterplan mostra preview imediato no mapa
- Salvamento automático do usuário criador
- Mensagem informando que aguarda aprovação

## 🗄️ Alterações no Banco de Dados

### ⚠️ **IMPORTANTE: Execute o SQL abaixo no Supabase Dashboard**

1. Acesse: https://supabase.com/dashboard/project/epsuxumkgakpqykvteij/sql
2. Cole e execute o conteúdo do arquivo `instalar/banco.sql`

### Novos Campos na Tabela `empreendimentos`:
- `status` (pendente/aprovado/rejeitado)
- `created_by` (UUID do usuário criador)
- `created_by_email` (Email do criador)
- `approved_by` (UUID do aprovador)
- `approved_at` (Data de aprovação)
- `rejection_reason` (Motivo da rejeição)

### Nova Função RPC:
- `approve_empreendimento()` - Aprova ou rejeita empreendimentos

### Políticas RLS Atualizadas:
- Usuários só veem empreendimentos aprovados
- Admins veem todos os empreendimentos
- Criadores veem seus próprios empreendimentos

## 🧪 Como Testar

### 1. **Criar Novo Empreendimento**
1. Acesse: http://localhost:8081/admin/empreendimentos/novo
2. Preencha os dados básicos
3. Faça upload do arquivo GeoJSON (define os limites)
4. Faça upload da imagem do Masterplan (aparece no mapa imediatamente)
5. Clique em "Criar Empreendimento"

### 2. **Aprovar/Rejeitar**
1. Faça login como Super Admin ou Admin
2. Acesse: http://localhost:8081/admin/empreendimentos/aprovacao
3. Veja a lista de empreendimentos pendentes
4. Clique em "Aprovar" ou "Rejeitar"
5. Se rejeitar, informe o motivo

### 3. **Visualizar no Mapa**
1. Acesse: http://localhost:8081/admin/mapa
2. Apenas empreendimentos aprovados aparecem
3. Admins veem todos (pendentes, aprovados, rejeitados)

## 📋 Checklist de Validação

- [ ] Execute o SQL no Supabase Dashboard
- [ ] Teste criar um empreendimento com GeoJSON e Masterplan
- [ ] Verifique se o Masterplan aparece no mapa durante criação
- [ ] Teste aprovar um empreendimento como Admin
- [ ] Teste rejeitar com motivo
- [ ] Verifique se apenas aprovados aparecem no mapa público

## 🔐 Usuários para Teste

**Super Admin (acesso total):**
- Email: `superadmin@blockurb.com`
- Senha: `BlockUrb2024!`

**Admin (pode aprovar):**
- Email: `admin@blockurb.com`
- Senha: `Admin2024!`

**Outros usuários (podem criar, mas não aprovar):**
- Veja a lista completa em `USUARIOS_E_CREDENCIAIS.md`

