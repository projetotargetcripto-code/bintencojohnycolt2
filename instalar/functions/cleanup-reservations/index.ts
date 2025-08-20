import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async () => {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { error, count } = await admin
    .from("reservas")
    .delete()
    .lt("expires_at", new Date().toISOString())
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("cleanup-reservations error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ deleted: count || 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
