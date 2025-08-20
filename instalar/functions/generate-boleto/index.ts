import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req: Request) => {
  try {
    const { cnab, pix } = await req.json();

    const boleto = {
      linha_digitavel: "00000.00000 00000.000000 00000.000000 0 00000000000000",
      cnab,
      pix,
    };

    return new Response(JSON.stringify({ boleto }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
