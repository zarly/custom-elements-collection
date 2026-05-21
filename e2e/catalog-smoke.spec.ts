import { test, expect } from "@playwright/test";

/**
 * Smoke check for the demo catalog: every shipped tag should upgrade
 * (i.e. `customElements.get(tag)` resolves) after `/src/auto.ts` runs.
 * Catches the class of regressions where a generated `auto.ts` skips a
 * tag because the meta file's category drifted.
 */

const REPRESENTATIVE_TAGS = [
  // One per group — keeps the spec quick and bisect-friendly when a
  // breakage is scoped to a single category.
  "ce-card", // Layout & primitives
  "ce-kpi", // Metrics & charts
  "ce-verdict", // Comparison & narrative
  "ce-chat-bubble", // Chat surfaces
  "ce-feedback-sink", // Feedback
  "ce-input", // Forms
  "ce-clock", // Dashboard
  "ce-json", // Content
  "lesson-frame", // Lesson
  "ce-docs-layout", // Internal
];

test("demo catalog: every representative tag upgrades after auto.ts", async ({
  page,
}) => {
  await page.goto("/");

  // Wait for the auto.ts side-effect import to register tags.
  for (const tag of REPRESENTATIVE_TAGS) {
    await page.waitForFunction(
      (t) => Boolean(customElements.get(t)),
      tag,
      { timeout: 5_000 },
    );
  }

  const registered = await page.evaluate(
    (tags) => tags.map((t) => Boolean(customElements.get(t))),
    REPRESENTATIVE_TAGS,
  );
  expect(registered.every(Boolean)).toBe(true);
});

test("demo catalog: the manifest exposes a healthy component count and the sidebar lists them", async ({
  page,
}) => {
  await page.goto("/");

  const manifest = await page.evaluate(async () => {
    const mod = await import("/src/manifest.ts");
    return mod.COMPONENTS.length;
  });
  // The catalog grows over time. The previous exact-count assertion (49) went
  // stale silently because nothing forced a bump on every component ship; use
  // a lower bound so a regression that *cuts* components still trips the spec.
  // Update the floor on intentional shrink.
  expect(manifest).toBeGreaterThanOrEqual(118);

  const sidebar = page.locator("ce-nav-list#nav");
  await expect(sidebar).toBeVisible();
});

test("demo catalog: ce-card detail page renders props + events tables", async ({
  page,
}) => {
  await page.goto("/#/ce-card");

  // The catalog renders into the slotted <div id="main">.
  const main = page.locator("#main");
  await expect(main).toContainText("ce-card");

  // Properties section is present.
  await expect(main).toContainText("Properties");

  // Events section exists since ce-card emits ce-card-activate.
  await expect(main).toContainText("Events");
  await expect(main).toContainText("ce-card-activate");
});

test("demo catalog: ce-rating detail page lists the form-associated meta hint", async ({
  page,
}) => {
  await page.goto("/#/ce-rating");
  const main = page.locator("#main");
  // The mode prop should be documented.
  await expect(main).toContainText("mode");
  await expect(main).toContainText("ce-rating-change");
});
