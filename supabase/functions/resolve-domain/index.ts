import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as Sentry from "https://esm.sh/@sentry/deno@7";

Sentry.init({ dsn: Deno.env.get("SENTRY_DSN") || "" });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const domainParam = url.searchParams.get("domain") ?? url.searchParams.get("host");
    const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const domain = (domainParam || hostHeader).toLowerCase().split(":" )[0];

    if (!domain) {
      Sentry.addBreadcrumb({ message: 'missing domain', data: { action: 'resolve-domain' } });
      return new Response(JSON.stringify({ error: "Domain required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: filial, error: filialErr } = await adminClient
      .from("filiais")
      .select("id, nome, domain")
      .eq("domain", domain)
      .single();

    if (filialErr || !filial) {
      Sentry.addBreadcrumb({ message: 'filial not found', data: { domain } });
      return new Response(JSON.stringify({ error: "Filial not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: panelsData } = await adminClient
      .from("filial_allowed_panels")
      .select("panel")
      .eq("filial_id", filial.id);

    console.log(JSON.stringify({ action: 'resolve-domain', domain, filial_id: filial.id }));
    return new Response(
      JSON.stringify({
        id: filial.id,
        nome: filial.nome,
        domain: filial.domain,
        panels: (panelsData || []).map((p) => p.panel),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    Sentry.captureException(e);
    console.error('resolve-domain error', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
