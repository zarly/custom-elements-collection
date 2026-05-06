import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeFeedbackSummary } from "./feedback-summary.js";
import { CeFeedbackSink } from "../feedback-sink/feedback-sink.js";
import { CeFeedbackBar } from "../feedback-bar/feedback-bar.js";
import { CeBookmark } from "../bookmark/bookmark.js";
import { CeRating } from "../rating/rating.js";

beforeAll(() => {
  defineOnce("ce-feedback-summary", CeFeedbackSummary);
  defineOnce("ce-feedback-sink", CeFeedbackSink);
  defineOnce("ce-feedback-bar", CeFeedbackBar);
  defineOnce("ce-bookmark", CeBookmark);
  defineOnce("ce-rating", CeRating);
});

beforeEach(() => {
  for (let i = window.localStorage.length - 1; i >= 0; i--) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith("ce-feedback:")) window.localStorage.removeItem(k);
  }
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function settle(): Promise<void> {
  await new Promise((r) => queueMicrotask(() => r(undefined)));
  await new Promise((r) => queueMicrotask(() => r(undefined)));
}

describe("<ce-feedback-summary>", () => {
  it("upgrades and renders shadow root", async () => {
    const host = mount(`<ce-feedback-summary></ce-feedback-summary>`);
    const el = host.querySelector("ce-feedback-summary") as CeFeedbackSummary;
    await el.updateComplete;
    expect(el.shadowRoot).not.toBeNull();
    host.remove();
  });

  it("reads initial state from ancestor sink on connect", async () => {
    window.localStorage.setItem(
      "ce-feedback:s-summary",
      JSON.stringify({
        a: { item: "a", thumbs: "up", updatedAt: 1, bookmarked: true },
        b: { item: "b", thumbs: "down", updatedAt: 1 },
      })
    );
    const host = mount(`
      <ce-feedback-sink subject="s-summary" transport="localstorage">
        <ce-feedback-summary show="counts"></ce-feedback-summary>
      </ce-feedback-sink>
    `);
    const summary = host.querySelector("ce-feedback-summary") as CeFeedbackSummary;
    await summary.updateComplete;
    await settle();
    const text = summary.shadowRoot!.textContent ?? "";
    // 1 liked, 1 disliked, 1 bookmarked
    expect(text).toMatch(/1\s+liked/);
    expect(text).toMatch(/1\s+disliked/);
    expect(text).toMatch(/1\s+bookmarked/);
    host.remove();
  });

  it("updates when sink dispatches ce-feedback-state", async () => {
    const host = mount(`
      <ce-feedback-sink subject="s-update" transport="localstorage">
        <ce-feedback-bar item="x">
          <ce-bookmark></ce-bookmark>
        </ce-feedback-bar>
        <ce-feedback-summary show="counts"></ce-feedback-summary>
      </ce-feedback-sink>
    `);
    const summary = host.querySelector("ce-feedback-summary") as CeFeedbackSummary;
    const book = host.querySelector("ce-bookmark") as CeBookmark;
    await summary.updateComplete;
    await book.updateComplete;
    await settle();
    book.click();
    await book.updateComplete;
    await settle();
    await summary.updateComplete;
    const text = summary.shadowRoot!.textContent ?? "";
    expect(text).toMatch(/1\s+bookmarked/);
    host.remove();
  });

  it("show attribute filters which sections render", async () => {
    const host = mount(`
      <ce-feedback-sink subject="s-show" transport="localstorage">
        <ce-feedback-summary show="avg"></ce-feedback-summary>
      </ce-feedback-sink>
    `);
    const summary = host.querySelector("ce-feedback-summary") as CeFeedbackSummary;
    await summary.updateComplete;
    await settle();
    const titles = Array.from(
      summary.shadowRoot!.querySelectorAll(".ce-summary__title")
    ).map((n) => n.textContent?.trim());
    expect(titles).toEqual(["Avg rating"]);
    host.remove();
  });

  it("avg is — when no ratings", async () => {
    const host = mount(`
      <ce-feedback-sink subject="s-empty" transport="localstorage">
        <ce-feedback-summary show="avg"></ce-feedback-summary>
      </ce-feedback-sink>
    `);
    const summary = host.querySelector("ce-feedback-summary") as CeFeedbackSummary;
    await summary.updateComplete;
    await settle();
    const avg = summary.shadowRoot!.querySelector(".ce-summary__avg")!.textContent?.trim();
    expect(avg).toBe("—");
    host.remove();
  });

  it("top-n caps the top-liked list", async () => {
    window.localStorage.setItem(
      "ce-feedback:s-top",
      JSON.stringify({
        a: { item: "a", thumbs: "up", stars: 5, updatedAt: 1 },
        b: { item: "b", thumbs: "up", stars: 4, updatedAt: 1 },
        c: { item: "c", thumbs: "up", stars: 5, updatedAt: 1 },
        d: { item: "d", thumbs: "up", stars: 4, updatedAt: 1 },
      })
    );
    const host = mount(`
      <ce-feedback-sink subject="s-top" transport="localstorage">
        <ce-feedback-summary show="top-liked" top-n="2"></ce-feedback-summary>
      </ce-feedback-sink>
    `);
    const summary = host.querySelector("ce-feedback-summary") as CeFeedbackSummary;
    await summary.updateComplete;
    await settle();
    const items = summary.shadowRoot!.querySelectorAll(".ce-summary__top-item");
    expect(items.length).toBe(2);
    host.remove();
  });

  it("live=false freezes after initial render", async () => {
    const host = mount(`
      <ce-feedback-sink subject="s-frozen" transport="localstorage">
        <ce-feedback-bar item="x">
          <ce-bookmark></ce-bookmark>
        </ce-feedback-bar>
        <ce-feedback-summary show="counts" .live=${false}></ce-feedback-summary>
      </ce-feedback-sink>
    `);
    // The .live=${false} doesn't survive innerHTML; set it as a property after upgrade.
    const summary = host.querySelector("ce-feedback-summary") as CeFeedbackSummary;
    summary.live = false;
    summary.remove();
    const sink = host.querySelector("ce-feedback-sink")!;
    const fresh = document.createElement("ce-feedback-summary") as CeFeedbackSummary;
    fresh.setAttribute("show", "counts");
    fresh.live = false;
    sink.appendChild(fresh);
    await fresh.updateComplete;
    await settle();
    const before = fresh.shadowRoot!.textContent ?? "";
    const book = host.querySelector("ce-bookmark") as CeBookmark;
    await book.updateComplete;
    book.click();
    await book.updateComplete;
    await settle();
    await fresh.updateComplete;
    const after = fresh.shadowRoot!.textContent ?? "";
    expect(after).toBe(before);
    host.remove();
  });
});
