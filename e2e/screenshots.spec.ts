import { test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Screenshot capture for the v3 demo. NOT a regression test — these are
 * artefacts for review and for `internal/screens/`. Skipped in CI; run
 * locally with:
 *
 *   pnpm test:e2e screenshots
 *
 * Outputs go to `internal/screens/`.
 */

const OUT_DIR = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
  "internal",
  "screens",
);
fs.mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORT = { width: 1440, height: 900 };
const SETTINGS_BTN = "demo-settings-button#settings";
const SETTINGS_MODAL = "demo-settings-modal#settings-modal";

async function openModal(page: import("@playwright/test").Page) {
  await page.evaluate((sel) => {
    const btn = document.querySelector(sel) as HTMLElement;
    btn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }, `${SETTINGS_BTN} ce-button`);
  await page.waitForFunction((sel) => {
    const modal = document.querySelector(sel);
    const dialog = modal?.querySelector("ce-modal");
    return (dialog as any)?.open === true;
  }, SETTINGS_MODAL);
}

async function clickTab(page: import("@playwright/test").Page, label: string) {
  await page.evaluate(
    ({ modalSel, label: l }) => {
      const modal = document.querySelector(modalSel);
      const tabs = modal?.querySelector("ce-tabs");
      const btn = Array.from(tabs?.shadowRoot?.querySelectorAll("button") ?? []).find(
        (b) => b.textContent?.trim() === l,
      ) as HTMLButtonElement | undefined;
      btn?.click();
    },
    { modalSel: SETTINGS_MODAL, label },
  );
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
}

test.describe("screenshot capture", () => {
  test.use({ viewport: VIEWPORT });

  test("01-default-sidebar", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(customElements.get("demo-settings-button")));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT_DIR, "01-default-sidebar.png") });
  });

  test("02-search-active", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(customElements.get("ce-input")));
    await page.fill("ce-input#search input", "chart");
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT_DIR, "02-search-active.png") });
  });

  test("03-modal-view-tab", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(customElements.get("demo-settings-button")));
    await openModal(page);
    await clickTab(page, "View");
    await page.screenshot({ path: path.join(OUT_DIR, "03-modal-view-tab.png") });
  });

  test("04-modal-group-tab", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(customElements.get("demo-settings-button")));
    await openModal(page);
    await clickTab(page, "Group");
    await page.screenshot({ path: path.join(OUT_DIR, "04-modal-group-tab.png") });
  });

  test("05-modal-filter-tab", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(customElements.get("demo-settings-button")));
    await openModal(page);
    await clickTab(page, "Filter");
    await page.screenshot({ path: path.join(OUT_DIR, "05-modal-filter-tab.png") });
  });

  test("06-empty-state", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(customElements.get("ce-input")));
    await page.fill("ce-input#search input", "zzzzznoresults");
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT_DIR, "06-empty-state.png") });
  });
});
