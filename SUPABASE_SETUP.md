# Configuração do Supabase para BlockURB

## Pré-requisitos

1. Conta no Supabase (https://supabase.com)
2. Projeto criado no Supabase com as credenciais fornecidas

## Estrutura do Banco de Dados

### Tabela `empreendimentos`

```sql
CREATE TABLE empreendimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  total_lotes INTEGER DEFAULT 0,
  lotes_vendidos INTEGER DEFAULT 0,
  bounds TEXT, -- JSON string com coordenadas: {"sw": [lat, lng], "ne": [lat, lng]}
  geojson_url TEXT,
  masterplan_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Configuração do Storage

1. Criar bucket `empreendimentos` no Supabase Storage
2. Configurar políticas de acesso:

```sql
-- Política para permitir upload de arquivos autenticados
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir leitura pública dos arquivos
CREATE POLICY "Public can view files" ON storage.objects
FOR SELECT USING (bucket_id = 'empreendimentos');

-- Política para permitir update de arquivos pelo proprietário
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);
```

## Configuração Local

1. O arquivo `.env.local` já foi criado com as credenciais
2. As variáveis de ambiente são:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Funcionalidades Implementadas

### Autenticação
- Login/Logout com Supabase Auth
- Proteção de rotas administrativas
- Redirecionamento automático para login quando não autenticado

### Mapa Interativo (`/admin/mapa`)
- Carrega empreendimentos da tabela `empreendimentos`
- Renderiza GeoJSON dos lotes no Leaflet
- Overlay do masterplan sobre o mapa
- Filtros e busca por nome

### Adicionar Empreendimento (`/admin/empreendimentos/novo`)
- Upload de arquivo GeoJSON para o Supabase Storage
- Upload de imagem do masterplan para o Supabase Storage
- Salvamento dos dados no banco
- Pré-visualização no mapa durante o cadastro

## Como Executar

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

## Estrutura de Arquivos Modificados

- `.env.local` - Variáveis de ambiente do Supabase
- `src/lib/dataClient.ts` - Cliente Supabase configurado
- `src/pages/admin/Mapa.tsx` - Mapa interativo integrado
- `src/pages/admin/EmpreendimentoNovo.tsx` - Formulário de cadastro
- Todos os componentes protegidos já usam o guard de autenticação

## Fluxo de Teste

1. Acesse `/login` e faça login
2. Vá para `/admin/empreendimentos/novo`
3. Cadastre um empreendimento com GeoJSON e masterplan
4. Visualize no `/admin/mapa`
5. Faça logout em `/logout`

## Notas Importantes

- Não há chaves hardcoded no código
- Todas as rotas administrativas estão protegidas
- O sistema funciona 100% com o Supabase configurado
- Storage configurado para uploads de GeoJSON e imagens

