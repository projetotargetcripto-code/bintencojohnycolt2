import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Admin client with service role, but keep user's token for context
    // Cliente com token do usuário para validar a role (RLS ativo)
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const userClient = createClient(SUPABASE_URL, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Cliente com service role para operações privilegiadas (sem Authorization do usuário)
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1) Validate token and superadmin role
    const { data: { user }, error: getUserErr } = await userClient.auth.getUser();
    if (getUserErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: profile } = await userClient
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const isSuperadmin = (profile?.role === "superadmin") || ((user as any)?.app_metadata?.role === "superadmin");
    if (!isSuperadmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2) Read payload
    const { email, full_name, filial_id, password } = await req.json();
    if (!email || !filial_id) {
      return new Response(JSON.stringify({ error: "email e filial_id são obrigatórios" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2.1) valida filial (por id; fallback por nome caso venha o nome no payload)
    let filialRow: { id: string } | null = null;
    const byId = await adminClient.from("filiais").select("id").eq("id", filial_id).single();
    if (!byId.error && byId.data) {
      filialRow = byId.data as { id: string };
    } else {
      const byName = await adminClient.from("filiais").select("id").eq("nome", filial_id).single();
      if (!byName.error && byName.data) {
        filialRow = byName.data as { id: string };
      }
    }
    if (!filialRow) {
      return new Response(JSON.stringify({ error: "Filial inválida (use o ID ou selecione corretamente no formulário)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const filialIdToUse = filialRow.id;

    const finalPassword = (password && String(password).length >= 8)
      ? String(password)
      : crypto.randomUUID().slice(0, 10) + "Aa!1";

    // 3) Create auth user
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: true,
    } as any);
    if (createErr) return new Response(JSON.stringify({ error: createErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const newUser = created?.user;
    if (!newUser) return new Response(JSON.stringify({ error: "Falha ao criar usuário" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // 4) Insert profile
    const { error: upErr } = await adminClient.from("user_profiles").insert({
      user_id: newUser.id,
      email,
      full_name: full_name || email,
      role: "adminfilial",
      filial_id: filialIdToUse,
      is_active: true,
    });
    if (upErr) return new Response(JSON.stringify({ error: upErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    return new Response(
      JSON.stringify({ user_id: newUser.id, email, temp_password: finalPassword }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});


