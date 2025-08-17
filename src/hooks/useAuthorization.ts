import { useContext } from 'react';
import { AuthorizationContext } from '@/providers/AuthorizationProvider';

export function useAuthorization() {
  return useContext(AuthorizationContext);
}
