import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

let cachedRender: ((text: string) => Promise<Uint8Array>) | null = null;

async function getRenderer() {
  if (cachedRender) return cachedRender;
  const code = `import { Document, Packer, Paragraph } from "npm:docx";
export async function render(text) {
  const doc = new Document({ sections: [{ children: [new Paragraph(text)] }] });
  return Packer.toBuffer(doc);
}`;
  const { files } = await Deno.emit("/mod.ts", { sources: { "/mod.ts": code }, bundle: "module" });
  const dataUrl = "data:application/javascript," + encodeURIComponent(files["deno:///bundle.js"]);
  const mod = await import(dataUrl);
  cachedRender = mod.render;
  return cachedRender;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  try {
    const { text } = await req.json();
    const render = await getRenderer();
    const bytes = await render(text || "");
    return new Response(bytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    });
  } catch (e) {
    console.error("render-docx error", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
