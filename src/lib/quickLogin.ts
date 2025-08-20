import { quickLoginCredentials, type QuickLoginCredential } from '@/config/quickLogin';

export function filterQuickLoginCredentials(allowedPanels?: string[]): QuickLoginCredential[] {
  return allowedPanels && allowedPanels.length > 0
    ? quickLoginCredentials.filter((c) => allowedPanels.includes(c.panel))
    : quickLoginCredentials;
}
