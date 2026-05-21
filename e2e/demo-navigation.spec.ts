import { test, expect, type Page } from "@playwright/test";

/**
 * Demo navigation e2e — regression guard for the v3 UX redesign.
 *
 * Three flows that would have caught the v2 F2 bug on day one, updated to use
 * the v3 settings-modal pattern:
 *   1. Search input filters the list.
 *   2. Group tab inside the settings modal reorganises sidebar sections.
 *   3. Filter tab inside the settings modal shrinks the list.
 */

const SEARCH_SELECTOR = "ce-input#search input";
const NAV_SELECTOR    = "ce-nav-list#nav";
const SETTINGS_BTN    = "demo-settings-button#settings";
const SETTINGS_MODAL  = "demo-settings-modal#settings-modal";

/** Count the rendered anchor rows inside the sidebar nav (shadow DOM). */
async function navRowCount(page: Page): Promise<number> {
  return await page.evaluate((sel) => {
    const nav = document.querySelector(sel);
    if (!nav) return 0;
    return nav.shadowRoot?.querySelectorAll("a.ce-nav__link").length ?? 0;
  }, NAV_SELECTOR);
}

/** Collect group headings inside the sidebar nav (shadow DOM). */
async function navGroupLabels(page: Page): Promise<string[]> {
  return await page.evaluate((sel) => {
    const nav = document.querySelector(sel);
    if (!nav) return [];
    return Array.from(nav.shadowRoot?.querySelectorAll(".ce-nav__group") ?? [])
      .map((el) => el.textContent?.trim() ?? "");
  }, NAV_SELECTOR);
}

/** Click a named tab inside the settings modal's ce-tabs. */
async function clickSettingsTab(page: Page, tabLabel: string) {
  await page.evaluate(
    ({ modalSel, label }) => {
      const modal = document.querySelector(modalSel) as HTMLElement & { open?: () => void };
      const tabs = modal?.querySelector("ce-tabs");
      if (!tabs) throw new Error("ce-tabs not found inside settings modal");
      // ce-tabs can be driven by clicking its rendered tab buttons in the shadow root.
      const btn = Array.from(tabs.shadowRoot?.querySelectorAll("button") ?? []).find(
        (b) => b.textContent?.trim() === label,
      ) as HTMLButtonElement | undefined;
      if (!btn) throw new Error(`Tab button "${label}" not found`);
      btn.click();
    },
    { modalSel: SETTINGS_MODAL, label: tabLabel },
  );
}

test("search input filters the sidebar to matching components", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => Boolean(customElements.get("ce-input")));
  const fullCount = await navRowCount(page);
  expect(fullCount).toBeGreaterThan(50);

  await page.fill(SEARCH_SELECTOR, "chart");
  // Debounce is RAF-scoped; one extra frame is enough.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));

  const filteredCount = await navRowCount(page);
  expect(filteredCount).toBeGreaterThan(0);
  expect(filteredCount).toBeLessThan(fullCount);

  // The matching rows include the expected chart-family components.
  const hrefs = await page.evaluate((sel) => {
    const nav = document.querySelector(sel);
    return Array.from(nav?.shadowRoot?.querySelectorAll("a.ce-nav__link") ?? [])
      .map((a) => a.getAttribute("href") ?? "");
  }, NAV_SELECTOR);
  expect(hrefs.some((h) => h.includes("ce-bar-chart"))).toBe(true);
});

test("Group tab in settings modal reorganises the sidebar sections", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => Boolean(customElements.get("demo-settings-button")));

  // Default grouping should show library groups (e.g. "Layout & primitives").
  const defaultGroups = await navGroupLabels(page);
  expect(defaultGroups.some((g) => g.includes("Layout & primitives"))).toBe(true);

  // Open settings modal.
  await page.evaluate((sel) => {
    const btn = document.querySelector(sel) as HTMLElement;
    btn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }, `${SETTINGS_BTN} ce-button`);

  // Wait for the modal to open.
  await page.waitForFunction((sel) => {
    const modal = document.querySelector(sel) as HTMLElement & { querySelector?: Function };
    const dialog = modal?.querySelector("ce-modal");
    return (dialog as any)?.open === true;
  }, SETTINGS_MODAL);

  // Switch to the Group tab.
  await clickSettingsTab(page, "Group");

  // Click the Tier radio.
  await page.evaluate((sel) => {
    const modal = document.querySelector(sel);
    const radio = modal?.querySelector('input[type="radio"][value="tier"]') as HTMLInputElement | null;
    if (!radio) throw new Error("Tier radio not found");
    radio.checked = true;
    radio.dispatchEvent(new Event("change", { bubbles: true }));
  }, SETTINGS_MODAL);

  // The sidebar must now group by tier — headings include "Brick · N".
  await page.waitForFunction((sel) => {
    const nav = document.querySelector(sel);
    return Array.from(nav?.shadowRoot?.querySelectorAll(".ce-nav__group") ?? [])
      .some((el) => /Brick\s+·/.test(el.textContent ?? ""));
  }, NAV_SELECTOR);

  const tierGroups = await navGroupLabels(page);
  expect(tierGroups.some((g) => /Brick\s+·/.test(g))).toBe(true);
  expect(tierGroups.every((g) => !g.startsWith("UI ·"))).toBe(true);
});

test("settings survive when clicking a sidebar link (regression for v3 reset bug)", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForFunction(() => Boolean(customElements.get("demo-settings-button")));

  // Apply a query AND a group change so we can detect either reset.
  await page.fill(SEARCH_SELECTOR, "card");
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));

  // Open modal, switch to Group tab, pick Tier.
  await page.evaluate((sel) => {
    const btn = document.querySelector(sel) as HTMLElement;
    btn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }, `${SETTINGS_BTN} ce-button`);
  await page.waitForFunction((sel) => {
    const modal = document.querySelector(sel) as HTMLElement;
    return (modal?.querySelector("ce-modal") as any)?.open === true;
  }, SETTINGS_MODAL);
  await clickSettingsTab(page, "Group");
  await page.evaluate((sel) => {
    const modal = document.querySelector(sel);
    const radio = modal?.querySelector('input[type="radio"][value="tier"]') as HTMLInputElement | null;
    radio!.checked = true;
    radio!.dispatchEvent(new Event("change", { bubbles: true }));
  }, SETTINGS_MODAL);
  await page.evaluate((sel) => {
    const modal = document.querySelector(sel);
    const applyBtn = modal?.querySelector("[data-action=apply]") as HTMLElement | null;
    applyBtn?.click();
  }, SETTINGS_MODAL);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));

  // Capture the URL's current state portion + nav state.
  const beforeHash = await page.evaluate(() => location.hash);
  expect(beforeHash).toContain("q=card");
  expect(beforeHash).toContain("group=tier");
  const filteredCount = await navRowCount(page);

  // Click the first sidebar component link. Was broken in v3: this used to
  // reset every form field to defaults.
  await page.evaluate((sel) => {
    const nav = document.querySelector(sel);
    const link = nav?.shadowRoot?.querySelector('a.ce-nav__link[href*="#/"]') as HTMLAnchorElement | null;
    if (!link) throw new Error("no component link in sidebar");
    link.click();
  }, NAV_SELECTOR);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));

  const afterHash = await page.evaluate(() => location.hash);
  // The new URL points at a specific component AND keeps the query + group.
  expect(afterHash).toMatch(/^#\/(ce|lesson)-[\w-]+\?/);
  expect(afterHash).toContain("q=card");
  expect(afterHash).toContain("group=tier");

  // Sidebar still respects the filter — same row count as before the click.
  expect(await navRowCount(page)).toBe(filteredCount);

  // Search input still shows "card". Read the ce-input host's public .value
  // (document.querySelector doesn't pierce shadow DOM in raw browser code).
  const searchValue = await page.evaluate(() => {
    const ceInput = document.getElementById("search") as
      | (HTMLElement & { value?: string })
      | null;
    return ceInput?.value ?? "";
  });
  expect(searchValue).toBe("card");
});

test("Filter tab in settings modal applies stability filter to the sidebar", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => Boolean(customElements.get("demo-settings-button")));

  const fullCount = await navRowCount(page);

  // Open settings modal.
  await page.evaluate((sel) => {
    const btn = document.querySelector(sel) as HTMLElement;
    btn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }, `${SETTINGS_BTN} ce-button`);

  // Wait for modal.
  await page.waitForFunction((sel) => {
    const modal = document.querySelector(sel) as HTMLElement;
    const dialog = modal?.querySelector("ce-modal");
    return (dialog as any)?.open === true;
  }, SETTINGS_MODAL);

  // Switch to the Filter tab.
  await clickSettingsTab(page, "Filter");

  // Tick stability=experimental.
  await page.evaluate((sel) => {
    const modal = document.querySelector(sel);
    const cb = modal?.querySelector(
      'input[type="checkbox"][data-set="stab"][value="experimental"]',
    ) as HTMLInputElement | null;
    if (!cb) throw new Error("stability=experimental checkbox not found");
    cb.checked = true;
    cb.dispatchEvent(new Event("change", { bubbles: true }));
  }, SETTINGS_MODAL);

  // Wait for the sidebar to shrink.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));

  const filteredCount = await navRowCount(page);
  expect(filteredCount).toBeLessThan(fullCount);
  expect(filteredCount).toBeGreaterThan(0);

  // Close via Apply button.
  await page.evaluate((sel) => {
    const modal = document.querySelector(sel);
    const applyBtn = modal?.querySelector("[data-action=apply]") as HTMLElement | null;
    applyBtn?.click();
  }, SETTINGS_MODAL);

  // Modal should be closed.
  await page.waitForFunction((sel) => {
    const modal = document.querySelector(sel);
    const dialog = modal?.querySelector("ce-modal");
    return (dialog as any)?.open === false;
  }, SETTINGS_MODAL);

  // List stays filtered.
  expect(await navRowCount(page)).toBe(filteredCount);
});
