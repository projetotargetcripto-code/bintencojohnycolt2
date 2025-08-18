import { quickLoginCredentials, type QuickLoginCredential } from '@/config/quickLogin';

export function filterQuickLoginCredentials(allowedPanels?: string[]): QuickLoginCredential[] {
  return allowedPanels
    ? quickLoginCredentials.filter((c) => allowedPanels.includes(c.panel))
    : quickLoginCredentials;
}
