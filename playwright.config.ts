import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for end-to-end / real-browser tests.
 *
 * Vitest handles unit tests (jsdom). Playwright handles the cases where
 * jsdom misses real-browser semantics — `ElementInternals` form-association,
 * full-page hydration from `localStorage`, custom-element upgrade ordering
 * with the demo's auto-register script, and so on.
 *
 * The `webServer` block boots `pnpm demo` (Vite dev server, port 4600) for
 * the duration of the test run and tears it down at the end.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.spec\.ts$/,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],

  // 4609 is reserved for Playwright runs so a stray local `pnpm demo` on
  // 4600 (or another agent on 4601) doesn't collide. Override with
  // PLAYWRIGHT_PORT if you need a different port.
  use: {
    baseURL: `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? "4609"}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: `pnpm demo --port ${process.env.PLAYWRIGHT_PORT ?? "4609"} --strictPort`,
    url: `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? "4609"}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
