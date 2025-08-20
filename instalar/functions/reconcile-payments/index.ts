import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as Sentry from "https://esm.sh/@sentry/deno@7";

Sentry.init({ dsn: Deno.env.get("SENTRY_DSN") || "" });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, data } = await req.json();
    if (!type || !data) {
      return new Response(JSON.stringify({ error: "type e data são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    let records: Array<Record<string, unknown>> = [];
    if (type === "pix" && Array.isArray(data)) {
      records = data.map((p: any) => ({
        tipo: "pix",
        referencia: p.txid || p.e2eId || null,
        valor: p.valor || p.amount || null,
        status: p.status || "pendente",
        dados: p,
      }));
    } else if (type === "cnab" && typeof data === "string") {
      const lines = data.split(/\r?\n/).filter(Boolean);
      records = lines.map((line) => ({
        tipo: "cnab",
        referencia: line.slice(0, 20).trim(),
        valor: Number(line.slice(20, 32)) || null,
        status: "pendente",
        dados: { raw: line },
      }));
    } else {
      return new Response(JSON.stringify({ error: "formato de data inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!records.length) {
      return new Response(JSON.stringify({ error: "sem registros" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await admin.from("conciliacoes").insert(records);
    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ inserted: records.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    Sentry.captureException(e);
    console.error("reconcile-payments error", e);
    return new Response(
      JSON.stringify({ error: String((e as any)?.message || e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

