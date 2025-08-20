import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as Sentry from "https://esm.sh/@sentry/deno@7";

Sentry.init({ dsn: Deno.env.get("SENTRY_DSN") || "" });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const NOTIFY_URL = Deno.env.get("NOTIFY_WEBHOOK_URL") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const today = new Date();
    const limit = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    const { data, error } = await admin
      .from('filiais')
      .select('id, nome, owner_email, trial_ends_at')
      .eq('billing_status', 'trial')
      .lt('trial_ends_at', limit.toISOString());

    if (error) throw error;

    for (const f of data || []) {
      if (NOTIFY_URL && f.owner_email) {
        await fetch(NOTIFY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: f.owner_email, filial: f.nome, trial_ends_at: f.trial_ends_at })
        }).catch(() => {});
      }
    }

    return new Response(JSON.stringify({ notified: (data || []).length }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    Sentry.captureException(e);
    console.error('notify-expiring-plans error', e);
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

