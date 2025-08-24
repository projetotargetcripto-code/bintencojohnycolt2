# Instruções de CLI

```bash
supabase login
supabase secrets set \
  SUPABASE_URL=https://<seu-projeto>.supabase.co \
  SUPABASE_ANON_KEY=<chave-anon> \
  SUPABASE_SERVICE_ROLE_KEY=<chave-service-role> \
  --project-ref <seu-project-ref>

supabase functions deploy admin-update-filial-billing --project-ref <seu-project-ref>
supabase functions deploy cleanup-reservations --project-ref <seu-project-ref>
supabase functions deploy convert-shapefile --project-ref <seu-project-ref>
supabase functions deploy create-admin-filial --project-ref <seu-project-ref>
supabase functions deploy generate-boleto --project-ref <seu-project-ref>
supabase functions deploy notify-expiring-plans --project-ref <seu-project-ref>
supabase functions deploy pix-webhook --project-ref <seu-project-ref>
supabase functions deploy provision-filial --project-ref <seu-project-ref>
supabase functions deploy reconcile-payments --project-ref <seu-project-ref>
supabase functions deploy refresh-bi --project-ref <seu-project-ref>
supabase functions deploy render-docx --project-ref <seu-project-ref>
supabase functions deploy renegociacao-confirm --project-ref <seu-project-ref>
supabase functions deploy resolve-domain --project-ref <seu-project-ref>
supabase functions deploy signature-callback --project-ref <seu-project-ref>
supabase functions deploy upload-retorno --project-ref <seu-project-ref>

npm install
npm run dev
```
