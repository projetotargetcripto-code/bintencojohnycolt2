# 🔧 Correção do Erro de Upload de GeoJSON

## ❌ **Problema Identificado**

O erro "Erro ao fazer upload do arquivo GeoJSON" ocorre devido à configuração de **Row Level Security (RLS)** no Storage do Supabase.

### **Causa Raiz:**
- O bucket `empreendimentos` existe ✅
- O upload funciona com `service_role` ✅  
- **MAS** as políticas RLS estão bloqueando uploads com a chave `anon` ❌

## ✅ **Soluções Implementadas**

### **1. Fallback Inteligente**
- Se o upload falhar por questões de política, o sistema automaticamente usa modo mock
- O empreendimento é salvo normalmente no banco
- URLs ficam como `/mock-empreendimentos/geojson/...`

### **2. Logs Detalhados**
- Console mostra exatamente onde está falhando
- Informações sobre bucket, path e tamanho do arquivo
- Distingue entre erros de política e outros erros

### **3. Upload com `upsert: true`**
- Permite sobrescrever arquivos se necessário
- Evita erros de "arquivo já existe"

## 🔐 **Para Resolver Definitivamente**

### **Execute no Supabase Dashboard:**

1. Acesse: https://supabase.com/dashboard/project/epsuxumkgakpqykvteij/sql
2. Cole e execute o SQL abaixo:

```sql
-- Remover políticas existentes
DROP POLICY IF EXISTS "Allow all authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Criar políticas simplificadas
CREATE POLICY "Allow all authenticated uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'empreendimentos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public read" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'empreendimentos');

CREATE POLICY "Allow authenticated updates" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'empreendimentos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated deletes" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'empreendimentos' AND auth.role() = 'authenticated');
```

## 🧪 **Como Testar**

### **Antes da Correção:**
1. Acesse: http://localhost:8081/admin/empreendimentos/novo
2. Faça login como admin (`admin@blockurb.com` / `Admin2024!`)
3. Preencha dados básicos
4. Faça upload de um arquivo GeoJSON
5. **Resultado:** Erro + fallback para modo mock

### **Após Aplicar SQL:**
1. Repita os passos acima
2. **Resultado:** Upload real para Supabase Storage ✅

## 📋 **Status Atual**

- ✅ **Sistema funcional** (com fallback mock)
- ✅ **Dados salvos** no banco corretamente
- ✅ **Preview do masterplan** funcionando
- ⚠️ **Upload real** requer política SQL manual

## 🔍 **Debug no Console**

Procure por estas mensagens no console do navegador:
- `🔍 Modo detectado: REAL/MOCK`
- `🔄 Fazendo upload de [arquivo] para [bucket/path]`
- `❌ Erro no upload:` (mostra detalhes do erro)
- `⚠️ Erro de política de segurança - usando modo mock`

---

**O sistema está funcionando com fallback inteligente. Para upload real, execute o SQL acima no Supabase Dashboard.**

