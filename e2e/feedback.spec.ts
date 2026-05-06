import { test, expect, type Page } from "@playwright/test";

/**
 * Suggestion #6 from the post-v0.3 follow-ups: the unit-test smoke for
 * `<ce-feedback-sink>` proved persistence under jsdom, but jsdom does not
 * exercise upgrade ordering, real Storage, or actual user gestures. This
 * spec walks the demo as a real user would — click, reload, verify —
 * against the production-shaped `demo/feedback.html`.
 */

const SUBJECT = "naming-2026-04-29";
const STORAGE_KEY = `ce-feedback:${SUBJECT}`;

/**
 * Navigate fresh: drop any saved state on first visit, then return so
 * subsequent reloads/navigations preserve whatever the test wrote. Using
 * `addInitScript` would wipe storage on every navigation — including the
 * reload we want to use to *test* persistence — so we instead visit
 * `about:blank`, clear storage from the page context, and then go to the
 * real URL.
 */
async function freshDemo(page: Page, path: string): Promise<void> {
  await page.goto("/");
  await page.evaluate(
    (k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    },
    STORAGE_KEY,
  );
  await page.goto(path);
}

test.describe("ce-feedback-sink — localStorage persistence", () => {

  test("thumbs-up survives a full page reload", async ({ page }) => {
    await freshDemo(page, "/feedback.html");

    const bar = page.locator('ce-feedback-bar[item="genrender"]');
    await expect(bar).toBeVisible();

    // The thumbs rating is the first <ce-rating> in the bar.
    const thumbs = bar.locator('ce-rating[mode="thumbs"]');
    await expect(thumbs).toBeAttached();

    const upButton = thumbs.locator('button[aria-label="Mark helpful"]');
    await upButton.click();

    // Allow the sink's debounced flush to drain.
    await expect
      .poll(async () => page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY))
      .toContain('"thumbs":"up"');

    const stored = await page.evaluate(
      (k) => localStorage.getItem(k),
      STORAGE_KEY,
    );
    expect(stored, "localStorage payload after click").not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.genrender.thumbs).toBe("up");

    // Reload and confirm the storage layer survives. The sink rehydrates
    // its in-memory state from localStorage; the UI rehydration of child
    // buttons (aria-pressed reflecting prior state) is a separate
    // feature — currently the children re-mount in their default state
    // and the saved state is read by the sink for export/summary.
    await page.reload();
    await expect(bar).toBeVisible();

    const persistedAfterReload = await page.evaluate(
      (k) => localStorage.getItem(k),
      STORAGE_KEY,
    );
    expect(persistedAfterReload).toBeTruthy();
    expect(JSON.parse(persistedAfterReload!).genrender.thumbs).toBe("up");

    // The sink's internal `getState()` should also reflect the hydrated state.
    const sinkState = await page.evaluate(() => {
      const sink = document.querySelector(
        "ce-feedback-sink",
      ) as HTMLElement & { getState?: () => Record<string, unknown> };
      return sink.getState ? sink.getState() : null;
    });
    expect(sinkState).not.toBeNull();
    expect((sinkState as { genrender?: { thumbs?: string } }).genrender?.thumbs).toBe(
      "up",
    );
  });

  test("bookmark + dismiss + comment all round-trip via the sink", async ({
    page,
  }) => {
    await freshDemo(page, "/feedback.html");

    const bar = page.locator('ce-feedback-bar[item="chatglow"]');
    await expect(bar).toBeVisible();

    await bar.locator("ce-bookmark").click();
    await bar.locator("ce-dismiss").click();

    const comment = bar.locator("ce-comment");
    // The trigger button collapses the textarea by default.
    await comment.locator("button").first().click();
    const textarea = comment.locator("textarea");
    await expect(textarea).toBeVisible();
    await textarea.fill("blocker per research");
    // Blur commits per the default submit-on=blur behaviour.
    await textarea.blur();

    await expect
      .poll(async () => page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY))
      .toMatch(/blocker per research/);

    const parsed = JSON.parse(
      (await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY))!,
    );
    expect(parsed.chatglow.bookmarked).toBe(true);
    expect(parsed.chatglow.dismissed).toBe(true);
    expect(parsed.chatglow.comment).toContain("blocker");

    // Dismissed bars expose data-ce-dismissed for consumer-side styling.
    await expect(bar).toHaveAttribute("data-ce-dismissed", "true");
  });

  test("ce-feedback-summary updates live as ratings change", async ({ page }) => {
    await freshDemo(page, "/feedback.html");

    const summary = page.locator("ce-feedback-summary");
    await expect(summary).toBeVisible();

    // Rate two items 5 stars to push the avg above 0.
    for (const item of ["genrender", "prosewave"]) {
      const stars = page
        .locator(`ce-feedback-bar[item="${item}"] ce-rating[mode="stars"]`)
        .first();
      // Click the last star to set value=max.
      await stars.locator('[role="radio"]').last().click();
    }

    // The summary's count cell renders "2" + "rated" in stacked spans.
    await expect(summary).toContainText("rated");
    await expect(summary).toContainText(/Avg rating/i);
    // Match the numeric '2' adjacent to the "rated" label, not anywhere.
    await expect(summary.getByTitle("Rated")).toContainText("2");
  });
});
