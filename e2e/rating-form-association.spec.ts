import { test, expect } from "@playwright/test";

/**
 * Suggestion #9: jsdom does not implement `ElementInternals` form
 * association. The unit tests for `<ce-rating>` assert that
 * `static formAssociated = true` is set, but cannot verify that
 * `new FormData(form).get('rating')` actually returns the value
 * after a click. This spec runs that contract under real Chromium.
 *
 * The page uses the `inline-html` strategy: we navigate to a
 * data-URL-shaped vite dev path that loads `/src/auto.ts` and
 * inserts a tiny inline `<form>` host. That keeps the test
 * scoped to the rating component without depending on a demo
 * feature.
 */

const FORM_FIXTURE_HTML = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <link rel="stylesheet" href="/src/tokens/tokens.css" />
      <script type="module" src="/src/auto.ts"></script>
    </head>
    <body style="font-family:system-ui;padding:24px">
      <form id="f">
        <fieldset>
          <legend>Thumbs control</legend>
          <ce-rating id="t" mode="thumbs" name="quality"></ce-rating>
        </fieldset>
        <fieldset>
          <legend>Stars control</legend>
          <ce-rating id="s" mode="stars" max="5" name="rating"></ce-rating>
        </fieldset>
        <button type="submit" id="submit">Submit</button>
      </form>
      <pre id="out"></pre>
    </body>
  </html>
`;

test.describe("ce-rating — form association", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/__fixture/rating-form.html", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: FORM_FIXTURE_HTML,
      }),
    );
  });

  test("FormData reflects thumbs and stars after user clicks", async ({
    page,
  }) => {
    await page.goto("/__fixture/rating-form.html");
    await page.waitForFunction(() =>
      Boolean(customElements.get("ce-rating")),
    );

    // Click thumbs-up.
    await page.locator("#t button[aria-label='Mark helpful']").click();

    // Click the 4th star.
    const stars = page.locator("#s [role='radio']");
    await stars.nth(3).click();

    // Read FormData from the form element synchronously in the page.
    const result = await page.evaluate(() => {
      const form = document.getElementById("f") as HTMLFormElement;
      const fd = new FormData(form);
      return {
        quality: fd.get("quality"),
        rating: fd.get("rating"),
      };
    });

    expect(result.quality).toBe("up");
    expect(result.rating).toBe("4");
  });

  test("submitting the form posts the right body", async ({ page }) => {
    await page.goto("/__fixture/rating-form.html");
    await page.waitForFunction(() =>
      Boolean(customElements.get("ce-rating")),
    );

    await page.locator("#t button[aria-label='Mark not helpful']").click();
    await page.locator("#s [role='radio']").nth(2).click();

    // Intercept the submit so we don't actually navigate; assert the body.
    const submitBody = await page.evaluate(() => {
      return new Promise<string>((resolve) => {
        const form = document.getElementById("f") as HTMLFormElement;
        form.addEventListener(
          "submit",
          (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const usp = new URLSearchParams();
            for (const [k, v] of fd) usp.append(k, String(v));
            resolve(usp.toString());
          },
          { once: true },
        );
        form.requestSubmit();
      });
    });

    expect(submitBody).toContain("quality=down");
    expect(submitBody).toContain("rating=3");
  });

  test("clearing thumbs sets the FormData entry to empty", async ({ page }) => {
    await page.goto("/__fixture/rating-form.html");
    await page.waitForFunction(() =>
      Boolean(customElements.get("ce-rating")),
    );

    const upBtn = page.locator("#t button[aria-label='Mark helpful']");
    await upBtn.click();
    // Clicking the active thumb again clears it back to null per spec.
    await upBtn.click();

    const value = await page.evaluate(() => {
      const form = document.getElementById("f") as HTMLFormElement;
      return new FormData(form).get("quality");
    });
    expect(value === null || value === "").toBeTruthy();
  });
});
