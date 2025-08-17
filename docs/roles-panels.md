# Cargos e Painéis

Este documento descreve como os cargos (roles) e painéis são definidos e gerenciados no projeto.

## Definições

- As constantes de cargos e rotas estão centralizadas em `src/config/authConfig.ts`.
- Cada cargo possui um caminho padrão e um rótulo amigável.
- Painéis autorizados para cada usuário são retornados pela RPC `get_my_profile` e disponibilizados pelo `AuthorizationProvider`.

## Criação de novos cargos/painéis

1. Adicione o novo cargo em `authConfig.ts` com rota e rótulo.
2. Atualize as políticas RLS e permissões no banco de dados conforme necessário.
3. Ajuste a navegação (`src/config/nav.ts`) e demais componentes que dependam do novo painel.
4. Opcional: criar páginas de painel conforme necessidade.

## Auditoria

Alterações de cargos ou painéis são registradas automaticamente na tabela `audit_role_changes` através de trigger em `user_profiles`.
Somente usuários com cargo `superadmin` podem consultar esses registros.

## Revisão periódica

O script `scripts/review-access.ts` lista os usuários e permite aprovar ou revogar acesso. Configure um cron ou worker externo para executar esse script periodicamente e enviar relatórios aos responsáveis.
