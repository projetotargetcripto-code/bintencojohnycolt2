import { describe, expect, it, vi } from 'vitest';
import type { QuickLoginCredential } from '@/config/quickLogin';
import { filterQuickLoginCredentials } from '@/lib/quickLogin';

vi.mock('@/config/quickLogin', () => {
  const mockCreds: QuickLoginCredential[] = [
    { email: 'a@a.com', password: 'pass', label: 'A', role: 'role1', panel: '/panel1', icon: () => null },
    { email: 'b@b.com', password: 'pass', label: 'B', role: 'role2', panel: '/panel2', icon: () => null }
  ];
  return { quickLoginCredentials: mockCreds };
});

describe('filterQuickLoginCredentials', () => {
  it('filters credentials by allowed panels', () => {
    const result = filterQuickLoginCredentials(['/panel2']);
    expect(result).toHaveLength(1);
    expect(result[0].panel).toBe('/panel2');
  });

  it('returns all credentials when allowedPanels is undefined', () => {
    const result = filterQuickLoginCredentials();
    expect(result).toHaveLength(2);
  });
});
