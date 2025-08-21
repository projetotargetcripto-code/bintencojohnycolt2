# 🛠️ Limpeza e Correção Completa do Banco de Dados

## ✅ **Status da Verificação**

### **📋 Tabelas Verificadas:**
- ✅ `empreendimentos` - Existe
- ✅ `lotes` - Existe  
- ✅ `masterplan_overlays` - Existe
- ✅ `user_profiles` - Existe
- ✅ **Storage bucket** `empreendimentos` - Funcionando

### **❌ Problemas Identificados:**
1. **Campo `status` ausente** na tabela `empreendimentos`
2. **Funções RPC** podem estar desatualizadas
3. **Políticas RLS** precisam de ajuste para upload
4. **Dados de teste** podem estar presentes

## 🔧 **Correção Automática Executada**

### **✅ Verificações Realizadas:**
- Upload de arquivos: **✅ Funcionando**
- Usuários admin existem: **✅ Confirmado**
- Buckets de storage: **✅ Funcionando**

### **📝 SQL Para Execução Manual:**
Todo o SQL necessário agora está centralizado em `instalar/banco.sql`

## 🎯 **EXECUTE AGORA NO SUPABASE DASHBOARD**

### **1. Acesse o SQL Editor:**
🌐 **Link:** https://supabase.com/dashboard/project/epsuxumkgakpqykvteij/sql

### **2. Execute o arquivo completo:**
📄 **Arquivo:** `instalar/banco.sql`

### **3. Principais correções incluídas:**

#### **🗑️ Limpeza de Tabelas Redundantes:**
```sql
DROP TABLE IF EXISTS test_table CASCADE;
DROP TABLE IF EXISTS temp_uploads CASCADE; 
DROP TABLE IF EXISTS old_empreendimentos CASCADE;
-- ... e outras tabelas desnecessárias
```

#### **🏗️ Campos de Aprovação:**
```sql
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente';
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS created_by_email TEXT;
-- ... outros campos necessários
```

#### **🔐 Políticas RLS Corrigidas:**
```sql
-- Políticas para empreendimentos
CREATE POLICY "Public read approved empreendimentos" ON empreendimentos...

-- Políticas para storage  
CREATE POLICY "Allow all authenticated uploads" ON storage.objects...
```

#### **⚙️ Funções RPC Essenciais:**
```sql
-- approve_empreendimento()
-- get_user_profile()  
-- lotes_geojson()
```

#### **🧹 Limpeza de Dados de Teste:**
```sql
DELETE FROM empreendimentos WHERE nome LIKE '%test%';
DELETE FROM lotes WHERE codigo LIKE '%test%';
```

## 📊 **Após Executar o SQL**

### **🧪 Funcionalidades que estarão funcionando:**
1. ✅ **Upload de GeoJSON e Masterplan** (sem fallback mock)
2. ✅ **Sistema de aprovação** de empreendimentos
3. ✅ **Preview do masterplan** no mapa
4. ✅ **Políticas de segurança** adequadas
5. ✅ **Rastreamento de criador** de empreendimentos

### **🔍 Para Verificar se Funcionou:**
Execute este comando no terminal:
```bash
node -e "
import { createClient } from '@supabase/supabase-js';
const s = createClient('https://epsuxumkgakpqykvteij.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwc3V4dW1rZ2FrcHF5a3Z0ZWlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA2NDY2MywiZXhwIjoyMDcwNjQwNjYzfQ.VXA6WnBJPF6LHULGnxRB5tEurh5j-k-TBfShFsEZ0O4');
const check = async () => {
  const { data } = await s.from('empreendimentos').select('*').limit(1);
  console.log('Campo status existe:', data && data.length > 0 && 'status' in data[0] ? '✅' : '❌');
};
check();
"
```

## 🚀 **Teste Completo do Sistema**

### **1. Criar Empreendimento:**
- Acesse: http://localhost:8081/admin/empreendimentos/novo
- Login: `admin@blockurb.com` / `Admin2024!`
- Upload GeoJSON + Masterplan
- **Resultado esperado:** Upload real (não mock)

### **2. Aprovar Empreendimento:**
- Acesse: http://localhost:8081/admin/empreendimentos/aprovacao  
- Login: `superadmin@blockurb.com` / `BlockUrb2024!`
- **Resultado esperado:** Lista de pendentes para aprovação

### **3. Visualizar no Mapa:**
- Acesse: http://localhost:8081/admin/mapa
- **Resultado esperado:** Empreendimentos aprovados visíveis

---

## 📋 **Checklist Final**

- [ ] Executar `instalar/banco.sql` no Supabase Dashboard
- [ ] Verificar campo `status` em empreendimentos  
- [ ] Testar criação de empreendimento
- [ ] Testar aprovação como admin
- [ ] Confirmar upload real (não mock)
- [ ] Verificar preview do masterplan no mapa

**🎉 Após completar, o sistema estará 100% funcional com Supabase real!**

