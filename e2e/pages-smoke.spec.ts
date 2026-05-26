import { test, expect } from "@playwright/test";

/**
 * Smoke test for the new docs pages (Quick start, Theming). Verifies:
 *   - Empty hash routes to Quick start (the new default landing page).
 *   - #/quick-start renders the install + framework sections.
 *   - #/theming renders the themes grid and parses tokens from tokens.css.
 *   - #/components renders the catalog (renamed from the implicit "/").
 *   - Existing component routes still work.
 *   - No page errors or console errors fire on any of the above.
 */

test("docs pages — empty hash lands on Quick start", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => Boolean(customElements.get("ce-input")));
  const main = page.locator("#main");
  await expect(main).toContainText("Quick start");
  await expect(main).toContainText("Install");
  await expect(main).toContainText("Register the tags");
});

test("docs pages — /#/quick-start renders install + framework sections", async ({ page }) => {
  await page.goto("/#/quick-start");
  await page.waitForFunction(() => Boolean(customElements.get("ce-input")));
  const main = page.locator("#main");
  await expect(main).toContainText("Quick start");
  await expect(main).toContainText("loadOnDemand");
  await expect(main).toContainText("Frameworks");
});

test("docs pages — /#/theming lists themes and token axes, parses tokens.css", async ({ page }) => {
  await page.goto("/#/theming");
  await page.waitForFunction(() => Boolean(customElements.get("ce-input")));
  const main = page.locator("#main");
  await expect(main).toContainText("Theming");
  await expect(main).toContainText("Built-in themes");
  await expect(main).toContainText("Token axes");
  await expect(main).toContainText("All tokens");
  // At least one well-known token from tokens.css :root block.
  await expect(main).toContainText("--ce-color-green");
  await expect(main).toContainText("--ce-space-1");
});

test("docs pages — /#/components still renders the catalog", async ({ page }) => {
  await page.goto("/#/components");
  await page.waitForFunction(() => Boolean(customElements.get("ce-input")));
  const main = page.locator("#main");
  await expect(main).toContainText("custom-elements-collection");
  await expect(main).toContainText("framework-agnostic");
});

test("docs pages — Docs sidebar exposes Quick start / Theming / Components links", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => Boolean(customElements.get("ce-nav-list")));
  const hrefs = await page.evaluate(() => {
    const nav = document.querySelector("ce-nav-list#nav-pages");
    return Array.from(nav?.shadowRoot?.querySelectorAll("a.ce-nav__link") ?? [])
      .map((a) => a.getAttribute("href"));
  });
  expect(hrefs).toContain("#/quick-start");
  expect(hrefs).toContain("#/theming");
  expect(hrefs).toContain("#/components");
});

test("docs pages — no console or page errors when visiting each docs page", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });
  for (const path of ["/", "/#/quick-start", "/#/theming", "/#/components"]) {
    await page.goto(path);
    await page.waitForFunction(() => Boolean(customElements.get("ce-input")));
    await page.waitForTimeout(150);
  }
  expect(errors).toEqual([]);
});
