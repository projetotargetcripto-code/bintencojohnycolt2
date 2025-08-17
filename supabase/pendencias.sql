CREATE TABLE IF NOT EXISTS public.pendencias (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo text NOT NULL,
  tabela text NOT NULL,
  entidade_id uuid NOT NULL,
  dados jsonb,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pendencias_tipo_idx ON public.pendencias(tipo);
