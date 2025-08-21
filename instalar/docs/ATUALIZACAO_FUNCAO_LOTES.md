# 🔄 ATUALIZAÇÃO DA FUNÇÃO `process_geojson_lotes`

## 📌 Contexto
Alguns bancos ainda utilizam a versão antiga da função `process_geojson_lotes` que aceita apenas os parâmetros `p_empreendimento_id` e `p_geojson`.

A nova versão inclui também `p_empreendimento_nome` para que cada lote receba o nome do empreendimento como prefixo.

## 🛠️ O que foi feito
- Função final incluída em `instalar/banco.sql` com o parâmetro adicional.
- Front-end ajustado para realizar *fallback* caso o banco ainda esteja com a função antiga.

## 🚀 Como sincronizar o backend
Execute o script abaixo no Supabase para atualizar a função para a versão mais recente:

```sql
-- Atualiza a função process_geojson_lotes para incluir p_empreendimento_nome
-- Execute o arquivo completo instalar/banco.sql
```

Após a execução, a função aceitará o parâmetro extra e os lotes serão salvos com o nome do empreendimento como prefixo.
