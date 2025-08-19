import { test } from "@playwright/test";
import fs from "fs";

test("dashboard screenshot", async ({ page }) => {
  await page.goto("http://localhost:5173/super-admin/dashboard");
  fs.mkdirSync("e2e/screenshots", { recursive: true });
  await page.screenshot({ path: "e2e/screenshots/dashboard.png", fullPage: true });
});
