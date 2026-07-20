import { defineConfig, devices } from "@playwright/test";

/**
 * Storefront browser tests.
 *
 * Defaults to port 3001 (3000 is used by another project). Override with the
 * PORT env var, e.g. `PORT=4000 bun run test:e2e`. If a dev server is already
 * running on that port it's reused; otherwise Playwright starts one.
 *
 * Runs every spec at both a mobile and a desktop viewport so regressions like
 * the product-gallery scroll trap are caught at the size they actually occur.
 *
 *   bun run test:e2e         headless
 *   bun run test:e2e:headed  watch it drive the browser
 *   bunx playwright show-report
 */
const PORT = process.env.PORT ?? "3001";
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 60_000,

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "mobile",
      use: { ...devices["iPhone 13"] },
    },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],

  webServer: {
    command: `next dev --turbopack --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
