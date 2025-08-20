import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import * as Sentry from "https://esm.sh/@sentry/deno@7";

Sentry.init({ dsn: Deno.env.get("SENTRY_DSN") || "" });

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
    const { email, status } = await req.json();
    if (NOTIFY_URL && email) {
      await fetch(NOTIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, status }),
      }).catch(() => {});
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    Sentry.captureException(e);
    console.error("renegociacao-confirm error", e);
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
