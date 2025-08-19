import { supabase } from '@/lib/dataClient';
import type { AuthorizationProfile } from '@/types';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

/**
 * Carrega o perfil de autorização do usuário usando RPC com fallback para consulta direta.
 * @param userId ID do usuário a ser buscado
 * @param signal Abort signal para cancelar requisições em andamento
 */
export async function loadAuthorizationProfile(
  userId: string,
  signal: AbortSignal
): Promise<AuthorizationProfile | null> {
  const rpcPromise = supabase
    .rpc('get_my_profile', {}, { signal })
    .maybeSingle<AuthorizationProfile>();

  const tablePromise = supabase
    .from<AuthorizationProfile>('user_profiles')
    .select('role, panels, filial_id', { signal })
    .eq('user_id', userId)
    .maybeSingle();

  const [rpcResult, tableResult] = await Promise.allSettled([
    rpcPromise,
    tablePromise,
  ]);

  const resolveResult = (
    result: PromiseSettledResult<PostgrestSingleResponse<AuthorizationProfile>>,
    context: string
  ) => {
    if (result.status === 'fulfilled') {
      if (result.value.error) {
        console.error(`Erro ao ${context}:`, result.value.error);
      }
      return result.value.data ?? null;
    } else {
      console.error(`Erro ao ${context}:`, result.reason);
      return null;
    }
  };

  const rpcData = resolveResult(rpcResult, 'chamar get_my_profile');
  if (rpcData) return rpcData;

  return resolveResult(tableResult, 'buscar user_profiles');
}
