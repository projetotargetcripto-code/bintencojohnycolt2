import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { parseRetorno } from "../../../lib/cnab.ts";

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
    const form = await req.formData();
    const file = form.get("file");
    const lote = Number(form.get("lote"));
    const filial = String(form.get("filial"));

    if (!(file instanceof File) || !lote || !filial) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = await file.text();
    const { lote: fileLote, filial: fileFilial } = parseRetorno(content);
    const valid = fileLote === lote && fileFilial === filial;

    return new Response(
      JSON.stringify({ valid, lote: fileLote, filial: fileFilial }),
      {
        status: valid ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
