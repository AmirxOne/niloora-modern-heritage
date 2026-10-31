import { defineConfig } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

/**
 * E2E suite runs against the ISOLATED niloora_test database (.env.test).
 * The dev/prod database (niloora) is never touched.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // shared test DB — sequential by design
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e-report" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
  },
  outputDir: "e2e-results",
  webServer: {
    // E2E against the PRODUCTION build — faster, no dev-mode HMR chunk
    // corruption ("Invalid or unexpected token") that broke hydration.
    command: "npm run start:test",
    url: `${baseURL}/api/products`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
