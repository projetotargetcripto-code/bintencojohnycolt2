import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadAuthorizationProfile } from './loadAuthorizationProfile';

const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/dataClient', () => ({
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
    from: (...args: any[]) => mockFrom(...args),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('loadAuthorizationProfile', () => {
  const userId = '123';

  it('utiliza fallback quando RPC falha', async () => {
    mockRpc.mockReturnValue({
      maybeSingle: () =>
        Promise.resolve({ data: null, error: new Error('rpc fail') }),
    });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { role: 'admin', panels: ['dash'], filial_id: 1 },
              error: null,
            }),
        }),
      }),
    });

    const controller = new AbortController();
    const result = await loadAuthorizationProfile(userId, controller.signal);
    expect(result).toEqual({ role: 'admin', panels: ['dash'], filial_id: 1 });
    expect(mockRpc).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalled();
  });

  it('retorna null quando RPC e fallback falham', async () => {
    mockRpc.mockReturnValue({
      maybeSingle: () =>
        Promise.resolve({ data: null, error: new Error('rpc fail') }),
    });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: null, error: new Error('fb fail') }),
        }),
      }),
    });

    const controller = new AbortController();
    const result = await loadAuthorizationProfile(userId, controller.signal);
    expect(result).toBeNull();
  });
});
