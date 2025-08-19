import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as Sentry from "https://esm.sh/@sentry/deno@7";

Sentry.init({ dsn: Deno.env.get("SENTRY_DSN") || "" });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PAYMENT_URL = Deno.env.get("PAYMENT_PROVIDER_URL") || "";

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
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const userClient = createClient(SUPABASE_URL, anonKey, { global: { headers: { Authorization: authHeader } } });
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile } = await userClient
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    const isSuperadmin = (profile?.role === "superadmin") || ((user as any)?.app_metadata?.role === "superadmin");
    if (!isSuperadmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { filial_id, action, plan } = await req.json();
    if (!filial_id || !action) {
      return new Response(JSON.stringify({ error: "filial_id e action são obrigatórios" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "change_plan" && !plan) {
      return new Response(JSON.stringify({ error: "Informe o plano" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // comunica com provedor de pagamentos (stub)
    if (PAYMENT_URL) {
      await fetch(PAYMENT_URL + "/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filial_id, action, plan }),
      }).catch(() => {});
    }

    let update: Record<string, unknown> = {};
    if (action === "change_plan") {
      update = { billing_plan: plan, billing_status: "ativa" };
    } else if (action === "suspend") {
      update = { billing_status: "suspensa" };
    }

    const { error } = await adminClient
      .from("filiais")
      .update(update)
      .eq("id", filial_id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") || "";
    const userAgent = req.headers.get("user-agent") || "";
    await adminClient.from('audit_logs').insert({
      actor: user.id,
      action: 'admin-update-filial-billing',
      target: filial_id,
      metadata: { action, plan },
      ip_address: ipAddress,
      user_agent: userAgent,
    }).catch(() => {});

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    Sentry.captureException(e);
    console.error("admin-update-filial-billing error", e);
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

