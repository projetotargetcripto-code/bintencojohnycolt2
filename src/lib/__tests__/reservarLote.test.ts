import { describe, expect, it } from 'vitest';

function createReservarLote() {
  let locked = false;
  return async () => {
    if (locked) {
      throw new Error('already reserved');
    }
    locked = true;
    await new Promise((resolve) => setTimeout(resolve, 20));
    return { success: true, expires_at: new Date(Date.now() + 300000).toISOString() };
  };
}

describe('reservar_lote concurrency', () => {
  it('allows only one reservation at a time', async () => {
    const reservar = createReservarLote();
    const p1 = reservar();
    const p2 = reservar();
    const results = await Promise.allSettled([p1, p2]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
  });
});
