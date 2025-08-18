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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      supabase.from('empreendimentos').select('id, nome').order('nome'),
      supabase.from('lotes').select('status')
    ])
      .then(([empRes, statusRes]) => {
        if (empRes.error) {
          throw empRes.error;
        }
        if (statusRes.error) {
          throw statusRes.error;
        }
        if (empRes.data) setEmpreendimentos(empRes.data);
        if (statusRes.data) {
          const unique = Array.from(new Set(statusRes.data.map(d => d.status).filter(Boolean)));
          setStatuses(unique as string[]);
        }
      })
      .catch((err) => {
        setError(err.message || 'Erro ao carregar filtros');
      })
      .finally(() => setLoading(false));
  }, []);

  return { empreendimentos, statuses, error, loading };
}

export type { Empreendimento };
