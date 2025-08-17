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

  useEffect(() => {
    supabase
      .from('empreendimentos')
      .select('id, nome')
      .order('nome')
      .then(({ data }) => {
        if (data) setEmpreendimentos(data);
      });

    supabase
      .from('lotes')
      .select('status')
      .then(({ data }) => {
        if (data) {
          const unique = Array.from(new Set(data.map(d => d.status).filter(Boolean)));
          setStatuses(unique as string[]);
        }
      });
  }, []);

  return { empreendimentos, statuses };
}

export type { Empreendimento };
