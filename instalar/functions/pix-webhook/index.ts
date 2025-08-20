import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createHandler } from "./handler.ts";

const WEBHOOK_SECRET = Deno.env.get("PIX_WEBHOOK_SECRET");

serve(createHandler(WEBHOOK_SECRET));
