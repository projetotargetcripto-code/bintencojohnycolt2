import { useEffect, useState } from 'react';
import { supabase } from '@/lib/dataClient';

interface Empreendimento {
  id: string;
  nome: string;
}

/**
 * Fetches empreendimentos and distinct lote statuses from Supabase
 */
export function useFilterOptions() {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('empreendimentos')
      .select('id, nome')
      .order('nome')
      .then(({ data, error }) => {
        if (error) {
          setError(error.message || 'Erro ao carregar empreendimentos');
          return;
        }
        if (data) setEmpreendimentos(data);
      });

    supabase
      .from('lotes')
      .select('status')
      .then(({ data, error }) => {
        if (error) {
          setError(error.message || 'Erro ao carregar statuses');
          return;
        }
        if (data) {
          const unique = Array.from(new Set(data.map(d => d.status).filter(Boolean)));
          setStatuses(unique as string[]);
        }
      });
  }, []);

  return { empreendimentos, statuses, error };
}

export type { Empreendimento };
