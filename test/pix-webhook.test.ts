import { describe, it, expect } from "vitest";
import { createHandler } from "../supabase/functions/pix-webhook/handler.ts";

describe("pix-webhook", () => {
  it("returns 500 when PIX_WEBHOOK_SECRET is missing", async () => {
    const handler = createHandler(undefined);
    const req = new Request("https://example.com", { method: "POST", body: "{}" });
    const res = await handler(req);
    expect(res.status).toBe(500);
  });
});
