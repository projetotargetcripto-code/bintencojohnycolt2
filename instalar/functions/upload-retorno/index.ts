import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { parseRetorno } from "../../../lib/cnab.ts";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const filial = form.get("filial");
  const loteExpected = Number(form.get("lote"));

  if (!(file instanceof File) || typeof filial !== "string" || isNaN(loteExpected)) {
    return new Response(
      JSON.stringify({ error: "file, lote and filial are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const content = await file.text();
  const info = parseRetorno(content);

  if (info.filial !== filial || info.lote !== loteExpected) {
    return new Response(
      JSON.stringify({
        error: "validation failed",
        parsed: info,
        expected: { lote: loteExpected, filial },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify(info), {
    headers: { "Content-Type": "application/json" },
  });
});
