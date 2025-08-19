import { createClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

const url = process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
const service = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const loteId = process.env.TEST_LOTE_ID;

if (!url || !anon || !service || !loteId) {
  describe.skip('reservar_lote concurrency', () => {
    /* missing environment variables */
  });
} else {
  const supabase = createClient(url, anon);
  const admin = createClient(url, service, { auth: { persistSession: false } });

  describe('reservar_lote concurrency', () => {
    it('only allows one reservation for a lot', async () => {
      await admin
        .from('lotes')
        .update({ status: 'disponivel', reserva_expira_em: null })
        .eq('id', loteId);

      const [a, b] = await Promise.all([
        supabase.rpc('reservar_lote', { p_lote_id: loteId, p_ttl: 60 }),
        supabase.rpc('reservar_lote', { p_lote_id: loteId, p_ttl: 60 }),
      ]);

      const successes = [a.data?.success, b.data?.success].filter(Boolean);
      expect(successes).toHaveLength(1);

      await admin
        .from('lotes')
        .update({ status: 'disponivel', reserva_expira_em: null })
        .eq('id', loteId);
    });
  });
}
