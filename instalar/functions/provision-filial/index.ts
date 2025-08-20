import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as Sentry from "https://esm.sh/@sentry/deno@7";

Sentry.init({ dsn: Deno.env.get("SENTRY_DSN") || "" });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      Sentry.addBreadcrumb({ message: 'unauthorized', data: { action: 'provision-filial' } });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const {
      data: { user },
      error: getUserErr,
    } = await userClient.auth.getUser();
    if (getUserErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

      const { data: profile } = await userClient
        .from("user_profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      const appRole = (user as { app_metadata?: { role?: string } })
        .app_metadata?.role;
      const isSuperadmin =
        profile?.role === "superadmin" || appRole === "superadmin";
    if (!isSuperadmin) {
      Sentry.addBreadcrumb({ message: 'forbidden', data: { user: user.id, action: 'provision-filial' } });
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      nome,
      kind = "interna",
      owner_name,
      owner_email,
      billing_plan,
      billing_status,
      domain,
    } = await req.json();

    if (!nome) {
      return new Response(JSON.stringify({ error: "Nome obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: filial, error: filialErr } = await adminClient
      .from("filiais")
      .insert({
        nome,
        kind,
        owner_name,
        owner_email,
        billing_plan,
        billing_status,
        domain,
        status: "provisionando",
      })
      .select("id")
      .single();

    if (filialErr || !filial) {
      return new Response(
        JSON.stringify({ error: filialErr?.message || "Falha ao criar filial" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const filialId = filial.id as string;

    // Registros auxiliares
    if (billing_plan || billing_status) {
      await adminClient
        .from("billing")
        .insert({ filial_id: filialId, plan: billing_plan, status: billing_status })
        .catch(() => {});
    }
    if (domain) {
      await adminClient
        .from("domains")
        .insert({ filial_id: filialId, domain })
        .catch(() => {});
    }

    // Disparar jobs assíncronos
    const storageWebhook = Deno.env.get("STORAGE_PROVISION_WEBHOOK");
    const policiesWebhook = Deno.env.get("POLICIES_PROVISION_WEBHOOK");
    if (storageWebhook) {
      fetch(storageWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filial_id: filialId }),
      }).catch(() => {});
    }
    if (policiesWebhook) {
      fetch(policiesWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filial_id: filialId }),
      }).catch(() => {});
    }

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") || "";
    const userAgent = req.headers.get("user-agent") || "";
    await adminClient.from('audit_logs').insert({
      actor: user.id,
      action: 'provision-filial',
      target: filialId,
      metadata: { nome, kind },
      ip_address: ipAddress,
      user_agent: userAgent,
    }).catch(() => {});

    return new Response(JSON.stringify({ id: filialId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    Sentry.captureException(e);
    console.error('provision-filial error', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

