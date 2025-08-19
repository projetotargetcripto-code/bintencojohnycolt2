import { useEffect, useState } from 'react';
import { supabase } from '@/lib/dataClient';

interface Empreendimento {
  id: string;
  nome: string;
}

/**
 * Fetches empreendimentos and distinct lote statuses from Supabase
 */
interface FilterErrors {
  empreendimentos: string | null;
  statuses: string | null;
}

export function useFilterOptions() {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [errors, setErrors] = useState<FilterErrors>({
    empreendimentos: null,
    statuses: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function load() {
      try {
        const [empResult, statusResult] = await Promise.all([
          supabase
            .from('empreendimentos')
            .select('id, nome')
            .order('nome')
            .abortSignal(controller.signal),
          supabase
            .from('lotes')
            .select('status')
            .abortSignal(controller.signal),
        ]);

        if (!isMounted) return;

        if (empResult.error) {
          setErrors(prev => ({
            ...prev,
            empreendimentos:
              empResult.error.message || 'Erro ao carregar empreendimentos',
          }));
        } else if (empResult.data) {
          setEmpreendimentos(empResult.data);
        }

        if (statusResult.error) {
          setErrors(prev => ({
            ...prev,
            statuses: statusResult.error.message || 'Erro ao carregar statuses',
          }));
        } else if (statusResult.data) {
          const unique = Array.from(
            new Set(statusResult.data.map(d => d.status).filter(Boolean)),
          );
          setStatuses(unique as string[]);
        }
      } catch (err) {
        if (!isMounted || (err as DOMException).name === 'AbortError') return;
        const message = (err as Error).message || 'Erro ao carregar dados';
        setErrors({ empreendimentos: message, statuses: message });
      }
    }

    load();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  return { empreendimentos, statuses, errors };
}

export type { Empreendimento };
