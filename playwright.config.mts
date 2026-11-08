import { defineConfig, devices } from "@playwright/test";
import { validateQaDatabaseUrl } from "./scripts/testing/qa-fixture-server.mjs";

validateQaDatabaseUrl(process.env.ZENLOVE_QA_DATABASE_URL);

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3016",
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    trace: { mode: "retain-on-failure", screenshots: false, snapshots: false },
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "node scripts/testing/qa-fixture-server.mjs",
      url: "http://127.0.0.1:55433/__qa/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: `node scripts/testing/start-qa-app.mjs ${process.env.ZENLOVE_QA_APP_MODE || (process.env.CI ? "start" : "dev")}`,
      url: "http://127.0.0.1:3016/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
