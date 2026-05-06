import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeFeedbackBar } from "./feedback-bar.js";
import { CeRating } from "../rating/rating.js";
import { CeBookmark } from "../bookmark/bookmark.js";
import { CeDismiss } from "../dismiss/dismiss.js";
import { CeComment } from "../comment/comment.js";

beforeAll(() => {
  defineOnce("ce-feedback-bar", CeFeedbackBar);
  defineOnce("ce-rating", CeRating);
  defineOnce("ce-bookmark", CeBookmark);
  defineOnce("ce-dismiss", CeDismiss);
  defineOnce("ce-comment", CeComment);
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

describe("<ce-feedback-bar>", () => {
  it("upgrades, sets role=group, has shadow root", async () => {
    const host = mount(`<ce-feedback-bar item="x"></ce-feedback-bar>`);
    const bar = host.querySelector("ce-feedback-bar") as CeFeedbackBar;
    await bar.updateComplete;
    expect(bar.shadowRoot).not.toBeNull();
    expect(bar.getAttribute("role")).toBe("group");
    host.remove();
  });

  it("layout attribute reflects to host", async () => {
    const host = mount(`<ce-feedback-bar item="x" layout="stacked"></ce-feedback-bar>`);
    const bar = host.querySelector("ce-feedback-bar") as CeFeedbackBar;
    await bar.updateComplete;
    expect(bar.getAttribute("layout")).toBe("stacked");
    host.remove();
  });

  it("sets data-ce-subject + data-ce-item on feedback descendants", async () => {
    const host = mount(`
      <ce-feedback-bar item="genrender" subject="naming-x">
        <ce-rating mode="thumbs"></ce-rating>
        <ce-bookmark></ce-bookmark>
        <ce-dismiss></ce-dismiss>
        <ce-comment></ce-comment>
      </ce-feedback-bar>
    `);
    const bar = host.querySelector("ce-feedback-bar") as CeFeedbackBar;
    await bar.updateComplete;
    await settle();
    const rating = host.querySelector("ce-rating")!;
    const book = host.querySelector("ce-bookmark")!;
    const dis = host.querySelector("ce-dismiss")!;
    const com = host.querySelector("ce-comment")!;
    expect(rating.getAttribute("data-ce-item")).toBe("genrender");
    expect(rating.getAttribute("data-ce-subject")).toBe("naming-x");
    expect(book.getAttribute("data-ce-item")).toBe("genrender");
    expect(dis.getAttribute("data-ce-item")).toBe("genrender");
    expect(com.getAttribute("data-ce-item")).toBe("genrender");
    host.remove();
  });

  it("does not override pre-set data-ce-item / data-ce-subject", async () => {
    const host = mount(`
      <ce-feedback-bar item="genrender" subject="naming-x">
        <ce-rating mode="thumbs" data-ce-item="custom" data-ce-subject="other"></ce-rating>
      </ce-feedback-bar>
    `);
    const bar = host.querySelector("ce-feedback-bar") as CeFeedbackBar;
    await bar.updateComplete;
    await settle();
    const rating = host.querySelector("ce-rating")!;
    expect(rating.getAttribute("data-ce-item")).toBe("custom");
    expect(rating.getAttribute("data-ce-subject")).toBe("other");
    host.remove();
  });

  it("rating-change updates internal state and emits ce-feedback-item-state", async () => {
    const host = mount(`
      <ce-feedback-bar item="genrender" subject="s1" label="Generative render">
        <ce-rating mode="thumbs"></ce-rating>
      </ce-feedback-bar>
    `);
    const bar = host.querySelector("ce-feedback-bar") as CeFeedbackBar;
    const rating = host.querySelector("ce-rating") as CeRating;
    await bar.updateComplete;
    await rating.updateComplete;
    await settle();
    let detail: { subject: string; item: string; label?: string; state: { thumbs?: string | null } } | null = null;
    bar.addEventListener("ce-feedback-item-state", (e) => {
      detail = (e as CustomEvent).detail;
    });
    const thumbs = rating.shadowRoot!.querySelectorAll<HTMLButtonElement>(".ce-rating__thumb");
    thumbs[0].click(); // up
    await rating.updateComplete;
    expect(detail).not.toBeNull();
    expect(detail!.subject).toBe("s1");
    expect(detail!.item).toBe("genrender");
    expect(detail!.label).toBe("Generative render");
    expect(detail!.state.thumbs).toBe("up");
    expect(bar.state.thumbs).toBe("up");
    host.remove();
  });

  it("bookmark-change updates state.bookmarked", async () => {
    const host = mount(`
      <ce-feedback-bar item="x" subject="s">
        <ce-bookmark></ce-bookmark>
      </ce-feedback-bar>
    `);
    const bar = host.querySelector("ce-feedback-bar") as CeFeedbackBar;
    const book = host.querySelector("ce-bookmark") as CeBookmark;
    await bar.updateComplete;
    await book.updateComplete;
    await settle();
    book.click();
    await book.updateComplete;
    expect(bar.state.bookmarked).toBe(true);
    host.remove();
  });

  it("does NOT stop propagation of child events", async () => {
    const host = mount(`
      <ce-feedback-bar item="x" subject="s">
        <ce-bookmark></ce-bookmark>
      </ce-feedback-bar>
    `);
    const bar = host.querySelector("ce-feedback-bar") as CeFeedbackBar;
    const book = host.querySelector("ce-bookmark") as CeBookmark;
    await bar.updateComplete;
    await book.updateComplete;
    await settle();
    let bubbled = 0;
    host.addEventListener("ce-bookmark-change", () => bubbled++);
    book.click();
    expect(bubbled).toBe(1);
    host.remove();
  });

  it("late-added child receives data-ce-item via slotchange", async () => {
    const host = mount(`<ce-feedback-bar item="late" subject="s"></ce-feedback-bar>`);
    const bar = host.querySelector("ce-feedback-bar") as CeFeedbackBar;
    await bar.updateComplete;
    const rating = document.createElement("ce-rating");
    bar.appendChild(rating);
    await bar.updateComplete;
    await settle();
    expect(rating.getAttribute("data-ce-item")).toBe("late");
    host.remove();
  });

  it("aria-label comes from label attribute", async () => {
    const host = mount(`<ce-feedback-bar item="x" label="My item"></ce-feedback-bar>`);
    const bar = host.querySelector("ce-feedback-bar") as CeFeedbackBar;
    await bar.updateComplete;
    expect(bar.getAttribute("aria-label")).toBe("My item");
    host.remove();
  });
});
