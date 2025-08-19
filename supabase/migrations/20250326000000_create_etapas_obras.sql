alter table public.lotes add column if not exists liberado boolean default false;

create table if not exists public.etapas_obras (
    id uuid primary key default gen_random_uuid(),
    empreendimento_id uuid not null references public.empreendimentos(id) on delete cascade,
    nome text not null,
    ordem int,
    concluida boolean not null default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create trigger tg_etapas_obras_updated_at before update on public.etapas_obras
    for each row execute function public.set_updated_at();

create or replace function public.liberar_lotes_se_todas_etapas_concluidas()
returns trigger language plpgsql as $$
begin
  if (select bool_and(concluida) from public.etapas_obras where empreendimento_id = new.empreendimento_id) then
    update public.lotes set liberado = true where empreendimento_id = new.empreendimento_id;
  end if;
  return new;
end;
$$;

create trigger tg_liberar_lotes after insert or update on public.etapas_obras
    for each row execute function public.liberar_lotes_se_todas_etapas_concluidas();
