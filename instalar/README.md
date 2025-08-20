# Instalação do Banco e Funções

Este diretório reúne um script SQL unificado e instruções para preparar um novo ambiente Supabase.

## Banco de Dados

1. Crie um banco vazio ou limpe o existente.
2. Execute o script principal:
   ```bash
   psql < banco.sql
   # ou
   supabase db reset --db-url <sua-string-de-conexao> < instalar/banco.sql
   ```
   O arquivo inclui todas as tabelas, políticas de RLS, permissões e funções RPC usadas pelo projeto.
   As extensões necessárias (`unaccent`, `postgis`, `pgcrypto`) e os papéis de acesso (`superadmin`, `adminfilial`, `comercial`, etc.) são criados automaticamente.
3. (Opcional) Importe funções adicionais:
   ```bash
   psql < provision_filial.sql
   ```
   Este arquivo disponibiliza a função `provision_filial` em PL/pgSQL para provisionar novas filiais diretamente pelo banco.

## Storage

1. Crie o bucket `empreendimentos` e permita acesso público (caso necessário):
   ```bash
   supabase storage create-bucket empreendimentos --public
   ```
2. As políticas para esse bucket já estão declaradas em `banco.sql`.

## Funções Edge

Implante todas as funções localizadas em `instalar/functions` (use `--workdir instalar`):
```bash
supabase functions deploy admin-update-filial-billing --workdir instalar
supabase functions deploy cleanup-reservations --workdir instalar
supabase functions deploy convert-shapefile --workdir instalar
supabase functions deploy create-admin-filial --workdir instalar
supabase functions deploy generate-boleto --workdir instalar
supabase functions deploy notify-expiring-plans --workdir instalar
supabase functions deploy pix-webhook --workdir instalar
supabase functions deploy provision-filial --workdir instalar
supabase functions deploy reconcile-payments --workdir instalar
supabase functions deploy refresh-bi --workdir instalar
supabase functions deploy render-docx --workdir instalar
supabase functions deploy renegociacao-confirm --workdir instalar
supabase functions deploy resolve-domain --workdir instalar
supabase functions deploy signature-callback --workdir instalar
supabase functions deploy upload-retorno --workdir instalar
```
Adapte os secrets necessários para cada função conforme o `instalar/config.toml` do projeto.

## Configurações

- Copie `.env.example` para `.env` e ajuste as chaves do Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`).
- Após carregar o banco e implantar as funções, a aplicação pode ser inicializada com `npm run dev`.


## Observações

- Todas as RPCs utilizadas pelo código estão declaradas em `banco.sql`, não havendo outros arquivos SQL separados.
- O script inclui helpers administrativos como `set_filial_allowed_panels` e rotinas de atualização de lotes (`update_lote_status`, `update_lote_valor`).
