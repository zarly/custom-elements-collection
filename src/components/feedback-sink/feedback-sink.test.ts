import { describe, it, expect, beforeAll, beforeEach, vi, afterEach } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeFeedbackSink, type FeedbackEvent } from "./feedback-sink.js";
import { CeFeedbackBar } from "../feedback-bar/feedback-bar.js";
import { CeRating } from "../rating/rating.js";
import { CeBookmark } from "../bookmark/bookmark.js";
import { CeDismiss } from "../dismiss/dismiss.js";
import { CeComment } from "../comment/comment.js";

beforeAll(() => {
  defineOnce("ce-feedback-sink", CeFeedbackSink);
  defineOnce("ce-feedback-bar", CeFeedbackBar);
  defineOnce("ce-rating", CeRating);
  defineOnce("ce-bookmark", CeBookmark);
  defineOnce("ce-dismiss", CeDismiss);
  defineOnce("ce-comment", CeComment);
});

beforeEach(() => {
  // Clean localstorage between tests.
  for (let i = window.localStorage.length - 1; i >= 0; i--) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith("ce-feedback:")) window.localStorage.removeItem(k);
  }
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
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

describe("<ce-feedback-sink>", () => {
  it("upgrades and renders shadow root with display: contents", async () => {
    const host = mount(`<ce-feedback-sink subject="t1"></ce-feedback-sink>`);
    const sink = host.querySelector("ce-feedback-sink") as CeFeedbackSink;
    await sink.updateComplete;
    expect(sink.shadowRoot).not.toBeNull();
    expect(sink.subject).toBe("t1");
    host.remove();
  });

  it("localstorage transport persists thumbs-up", async () => {
    const host = mount(`
      <ce-feedback-sink subject="s1" transport="localstorage">
        <ce-feedback-bar item="genrender">
          <ce-rating mode="thumbs"></ce-rating>
        </ce-feedback-bar>
      </ce-feedback-sink>
    `);
    const sink = host.querySelector("ce-feedback-sink") as CeFeedbackSink;
    const rating = host.querySelector("ce-rating") as CeRating;
    await sink.updateComplete;
    await rating.updateComplete;
    await settle();
    let persisted = 0;
    sink.addEventListener("ce-feedback-persisted", () => persisted++);
    const thumbs = rating.shadowRoot!.querySelectorAll<HTMLButtonElement>(".ce-rating__thumb");
    thumbs[0].click(); // up
    await rating.updateComplete;
    await settle();
    expect(persisted).toBeGreaterThan(0);
    const stored = window.localStorage.getItem("ce-feedback:s1");
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.genrender.thumbs).toBe("up");
    host.remove();
  });

  it("getState returns the aggregated state", async () => {
    const host = mount(`
      <ce-feedback-sink subject="s2" transport="localstorage">
        <ce-feedback-bar item="x">
          <ce-bookmark></ce-bookmark>
        </ce-feedback-bar>
      </ce-feedback-sink>
    `);
    const sink = host.querySelector("ce-feedback-sink") as CeFeedbackSink;
    const book = host.querySelector("ce-bookmark") as CeBookmark;
    await sink.updateComplete;
    await book.updateComplete;
    await settle();
    book.click();
    await book.updateComplete;
    await settle();
    const state = sink.getState();
    expect(state.x.bookmarked).toBe(true);
    host.remove();
  });

  it("schema-version appears on every outgoing event", async () => {
    const host = mount(`
      <ce-feedback-sink subject="s3" transport="console" schema-version="42">
        <ce-feedback-bar item="x">
          <ce-bookmark></ce-bookmark>
        </ce-feedback-bar>
      </ce-feedback-sink>
    `);
    const sink = host.querySelector("ce-feedback-sink") as CeFeedbackSink;
    const book = host.querySelector("ce-bookmark") as CeBookmark;
    await sink.updateComplete;
    await book.updateComplete;
    await settle();
    let captured: { events: FeedbackEvent[]; transport: string } | null = null;
    sink.addEventListener("ce-feedback-persisted", (e) => {
      captured = (e as CustomEvent).detail;
    });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    book.click();
    await book.updateComplete;
    await settle();
    expect(captured).not.toBeNull();
    expect(captured!.events[0].schema).toBe("42");
    logSpy.mockRestore();
    host.remove();
  });

  it("batches multiple events within batch-ms into one flush", async () => {
    vi.useFakeTimers();
    const host = mount(`
      <ce-feedback-sink subject="s4" transport="console" batch-ms="200">
        <ce-feedback-bar item="x">
          <ce-bookmark></ce-bookmark>
        </ce-feedback-bar>
      </ce-feedback-sink>
    `);
    const sink = host.querySelector("ce-feedback-sink") as CeFeedbackSink;
    const book = host.querySelector("ce-bookmark") as CeBookmark;
    await sink.updateComplete;
    await book.updateComplete;
    await settle();
    let flushes = 0;
    let totalEvents = 0;
    sink.addEventListener("ce-feedback-persisted", (e) => {
      flushes++;
      const det = (e as CustomEvent).detail as { events: FeedbackEvent[] };
      totalEvents += det.events.length;
    });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    // Five rapid toggles
    book.click(); book.click(); book.click(); book.click(); book.click();
    await book.updateComplete;
    expect(flushes).toBe(0);
    vi.advanceTimersByTime(199);
    expect(flushes).toBe(0);
    vi.advanceTimersByTime(2);
    expect(flushes).toBe(1);
    expect(totalEvents).toBe(5);
    logSpy.mockRestore();
    host.remove();
  });

  it("custom transport invokes transportImpl with events", async () => {
    const host = mount(`
      <ce-feedback-sink subject="s5" transport="custom">
        <ce-feedback-bar item="x">
          <ce-bookmark></ce-bookmark>
        </ce-feedback-bar>
      </ce-feedback-sink>
    `);
    const sink = host.querySelector("ce-feedback-sink") as CeFeedbackSink;
    const book = host.querySelector("ce-bookmark") as CeBookmark;
    await sink.updateComplete;
    await book.updateComplete;
    await settle();
    const recv: FeedbackEvent[][] = [];
    sink.transportImpl = async (events) => {
      recv.push(events);
    };
    book.click();
    await book.updateComplete;
    await settle();
    await new Promise((r) => setTimeout(r, 0));
    expect(recv.length).toBe(1);
    expect(recv[0][0].action).toBe("bookmark");
    expect(recv[0][0].item).toBe("x");
    host.remove();
  });

  it("HTTP transport falls back to localstorage when fetch rejects", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() => Promise.reject(new Error("net down")));
    const host = mount(`
      <ce-feedback-sink subject="s6" transport="http" offline-fallback="localstorage">
        <ce-feedback-bar item="x">
          <ce-bookmark></ce-bookmark>
        </ce-feedback-bar>
      </ce-feedback-sink>
    `);
    const sink = host.querySelector("ce-feedback-sink") as CeFeedbackSink;
    const book = host.querySelector("ce-bookmark") as CeBookmark;
    await sink.updateComplete;
    await book.updateComplete;
    await settle();
    let failed = 0;
    let persisted: { transport: string } | null = null;
    sink.addEventListener("ce-feedback-failed", () => failed++);
    sink.addEventListener("ce-feedback-persisted", (e) => {
      persisted = (e as CustomEvent).detail;
    });
    book.click();
    await book.updateComplete;
    await settle();
    await new Promise((r) => setTimeout(r, 0));
    expect(failed).toBeGreaterThan(0);
    expect(persisted).not.toBeNull();
    expect(persisted!.transport).toBe("localstorage");
    expect(window.localStorage.getItem("ce-feedback:s6")).toBeTruthy();
    fetchSpy.mockRestore();
    host.remove();
  });

  it("offline-fallback=none does NOT write to localstorage on http failure", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() => Promise.reject(new Error("net down")));
    const host = mount(`
      <ce-feedback-sink subject="s7" transport="http" offline-fallback="none">
        <ce-feedback-bar item="x">
          <ce-bookmark></ce-bookmark>
        </ce-feedback-bar>
      </ce-feedback-sink>
    `);
    const sink = host.querySelector("ce-feedback-sink") as CeFeedbackSink;
    const book = host.querySelector("ce-bookmark") as CeBookmark;
    await sink.updateComplete;
    await book.updateComplete;
    await settle();
    book.click();
    await book.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    expect(window.localStorage.getItem("ce-feedback:s7")).toBeNull();
    fetchSpy.mockRestore();
    host.remove();
  });

  it("ignores events without a resolvable item id", async () => {
    const host = mount(`
      <ce-feedback-sink subject="s8" transport="localstorage">
        <ce-bookmark></ce-bookmark>
      </ce-feedback-sink>
    `);
    const sink = host.querySelector("ce-feedback-sink") as CeFeedbackSink;
    const book = host.querySelector("ce-bookmark") as CeBookmark;
    await sink.updateComplete;
    await book.updateComplete;
    await settle();
    let persisted = 0;
    sink.addEventListener("ce-feedback-persisted", () => persisted++);
    book.click();
    await book.updateComplete;
    await settle();
    expect(persisted).toBe(0);
    expect(Object.keys(sink.getState())).toHaveLength(0);
    host.remove();
  });

  it("ce-feedback-state fires after change", async () => {
    const host = mount(`
      <ce-feedback-sink subject="s9" transport="localstorage">
        <ce-feedback-bar item="x">
          <ce-bookmark></ce-bookmark>
        </ce-feedback-bar>
      </ce-feedback-sink>
    `);
    const sink = host.querySelector("ce-feedback-sink") as CeFeedbackSink;
    const book = host.querySelector("ce-bookmark") as CeBookmark;
    await sink.updateComplete;
    await book.updateComplete;
    await settle();
    let stateEvents = 0;
    sink.addEventListener("ce-feedback-state", () => stateEvents++);
    book.click();
    await book.updateComplete;
    await settle();
    expect(stateEvents).toBeGreaterThan(0);
    host.remove();
  });

  it("hydrates state from localstorage on mount", async () => {
    window.localStorage.setItem(
      "ce-feedback:hydrate",
      JSON.stringify({
        genrender: { item: "genrender", thumbs: "up", updatedAt: 1, bookmarked: true },
      })
    );
    const host = mount(`
      <ce-feedback-sink subject="hydrate" transport="localstorage"></ce-feedback-sink>
    `);
    const sink = host.querySelector("ce-feedback-sink") as CeFeedbackSink;
    await sink.updateComplete;
    await settle();
    expect(sink.getState().genrender.thumbs).toBe("up");
    expect(sink.getState().genrender.bookmarked).toBe(true);
    host.remove();
  });

  it("ce-feedback-clear empties state and removes the storage key", async () => {
    window.localStorage.setItem(
      "ce-feedback:clear",
      JSON.stringify({ x: { item: "x", bookmarked: true, updatedAt: 1 } })
    );
    const host = mount(`
      <ce-feedback-sink subject="clear" transport="localstorage"></ce-feedback-sink>
    `);
    const sink = host.querySelector("ce-feedback-sink") as CeFeedbackSink;
    await sink.updateComplete;
    await settle();
    expect(sink.getState().x).toBeDefined();
    sink.dispatchEvent(
      new CustomEvent("ce-feedback-clear", { bubbles: true, composed: true })
    );
    expect(Object.keys(sink.getState())).toHaveLength(0);
    expect(window.localStorage.getItem("ce-feedback:clear")).toBeNull();
    host.remove();
  });
});
