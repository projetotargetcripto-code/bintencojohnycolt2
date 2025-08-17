# 🔄 ATUALIZAÇÃO DA FUNÇÃO `process_geojson_lotes`

## 📌 Contexto
Alguns bancos ainda utilizam a versão antiga da função `process_geojson_lotes` que aceita apenas os parâmetros `p_empreendimento_id` e `p_geojson`.

A nova versão, consolidada em `NovoSetup/sql.final.referenciado.sql`, inclui também `p_empreendimento_nome` para que cada lote receba o nome do empreendimento como prefixo.

## 🛠️ O que foi feito
- Função e helpers consolidados em `NovoSetup/sql.final.referenciado.sql`.
- Front-end ajustado para realizar *fallback* caso o banco ainda esteja com a função antiga.

## 🚀 Como sincronizar o backend
Para bancos existentes, execute o conteúdo de `NovoSetup/sql.final.referenciado.sql` ou extraia apenas a função `process_geojson_lotes` do arquivo para atualizar sua instância.

Após a atualização, a função aceitará o parâmetro extra e os lotes serão salvos com o nome do empreendimento como prefixo.
