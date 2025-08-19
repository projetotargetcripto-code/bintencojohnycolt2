import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 120000,
    env: {
      VITE_SUPABASE_URL: "http://localhost",
      VITE_SUPABASE_ANON_KEY: "test",
    },
  },
});
