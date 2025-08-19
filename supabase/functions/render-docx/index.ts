import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Bundle Node-based docx libraries using Deno.emit
const { files } = await Deno.emit("/doc.ts", {
  bundle: "module",
  sources: {
    "/doc.ts": `import PizZip from "npm:pizzip";
import Docxtemplater from "npm:docxtemplater";
export function render(template, data) {
  const zip = new PizZip(template);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(data);
  return doc.getZip().generate({ type: "uint8array" });
}
`,
  },
});

const code = Object.values(files)[0] as string;
const { render } = await import("data:application/javascript," + encodeURIComponent(code));

function b64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

serve(async (req) => {
  try {
    const { template, data } = await req.json();
    const templateBytes = b64ToUint8(template);
    const rendered = render(templateBytes, data);
    return new Response(rendered, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
