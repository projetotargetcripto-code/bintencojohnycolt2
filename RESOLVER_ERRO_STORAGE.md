# 🔧 RESOLVER ERRO DE UPLOAD NO SUPABASE STORAGE

## ❌ **ERRO ATUAL:**
```
StorageApiError: mime type application/octet-stream is not supported
```

## ✅ **SOLUÇÃO COMPLETA:**

### **1. CRIAR O BUCKET NO SUPABASE DASHBOARD**

1. Acesse seu **Supabase Dashboard**
2. Vá em **Storage** (menu lateral)
3. Clique em **"New bucket"**
4. Configure:
   - **Name:** `empreendimentos`
   - **Public bucket:** ✅ Marcar como público
   - Clique em **"Create bucket"**

### **2. CONFIGURAR TIPOS MIME PERMITIDOS**

1. Ainda no Storage, clique no bucket **"empreendimentos"**
2. Clique em **"Policies"** (aba superior)
3. Em **"Allowed MIME types"**, adicione:
   ```
   application/json
   application/geo+json
   image/jpeg
   image/png
   image/gif
   image/webp
   ```
4. Clique em **"Save"**

### **3. EXECUTAR SQL DE POLÍTICAS**

Execute a seção de políticas de storage do arquivo `NovoSetup/sql.final.referenciado.sql` no **SQL Editor** do Supabase.

### **4. TESTAR NOVAMENTE**

Após essas configurações:
1. **Recarregue a página** (F5)
2. **Faça login** novamente
3. **Tente criar** um novo empreendimento com upload

## 🎯 **ALTERNATIVA RÁPIDA (TEMPORÁRIA):**

Se ainda houver problemas, use temporariamente a **service_role key** no `.env.local`:

```env
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwc3V4dW1rZ2FrcHF5a3Z0ZWlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA2NDY2MywiZXhwIjoyMDcwNjQwNjYzfQ.VXA6WnBJPF6LHULGnxRB5tEurh5j-k-TBfShFsEZ0O4
```

**E modifique temporariamente o dataClient.ts:**
```typescript
const client = createClient(url!, anon!, { 
  auth: { persistSession: true, autoRefreshToken: true },
  global: {
    headers: {
      // Use service role temporariamente
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || anon}`
    }
  }
})
```

⚠️ **IMPORTANTE:** Remova a service_role key após resolver o problema!

## 📝 **CHECKLIST DE VERIFICAÇÃO:**

- [ ] Bucket "empreendimentos" criado
- [ ] Bucket marcado como PUBLIC
- [ ] MIME types configurados
- [ ] Políticas SQL executadas
- [ ] Usuário está logado
- [ ] Arquivo sendo enviado é .geojson ou .json

## 🚀 **RESULTADO ESPERADO:**

Após essas configurações, o upload deve funcionar normalmente e você verá:
- ✅ Upload bem-sucedido
- ✅ URL pública gerada
- ✅ Empreendimento criado com lotes processados

---

**O problema é que o bucket não existe ou não está configurado corretamente. Siga os passos acima no Supabase Dashboard!**

