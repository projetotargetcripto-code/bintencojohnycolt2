-- Adjust numeric precision and enforce status constraint

-- Round existing values to two decimal places
update public.vendas set valor = round(valor::numeric, 2), comissao = round(comissao::numeric, 2);
update public.cobrancas set valor = round(valor::numeric, 2);

-- Normalize status values
update public.cobrancas set status = 'pendente' where status not in ('pendente','pago','cancelado');

-- Alter column types to numeric(12,2)
alter table public.vendas
  alter column valor type numeric(12,2),
  alter column comissao type numeric(12,2);

alter table public.cobrancas
  alter column valor type numeric(12,2);

-- Add check constraint for status
alter table public.cobrancas
  add constraint if not exists cobrancas_status_check check (status in ('pendente','pago','cancelado'));
