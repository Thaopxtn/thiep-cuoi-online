import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: ["accessibility.spec.ts", "checkin-qr.spec.ts", "guest-pass.spec.ts"],
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { outputFolder: "playwright-report/ui", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3017",
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `node scripts/testing/start-ui-qa-app.mjs ${process.env.ZENLOVE_UI_APP_MODE || "dev"}`,
    url: "http://127.0.0.1:3017",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
