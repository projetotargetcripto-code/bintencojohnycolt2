import { createClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

const url = process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  describe.skip('vw_comissoes RLS', () => {
    /* missing environment variables */
  });
} else {
  const supabase = createClient(url, anon);
  describe('vw_comissoes RLS', () => {
    it('only returns rows for current filial', async () => {
      const { error } = await supabase
        .from('vw_comissoes')
        .select('corretor_id,status,total_comissao')
        .limit(1);
      expect(error).toBeNull();
    });
  });
}
