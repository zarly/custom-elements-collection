import { describe, it, expect, beforeAll, beforeEach, vi, afterEach } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeFeedbackExport } from "./feedback-export.js";
import { CeFeedbackSink } from "../feedback-sink/feedback-sink.js";

beforeAll(() => {
  defineOnce("ce-feedback-export", CeFeedbackExport);
  defineOnce("ce-feedback-sink", CeFeedbackSink);
});

beforeEach(() => {
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

describe("<ce-feedback-export>", () => {
  it("upgrades and renders shadow root", async () => {
    const host = mount(`<ce-feedback-export></ce-feedback-export>`);
    const el = host.querySelector("ce-feedback-export") as CeFeedbackExport;
    await el.updateComplete;
    expect(el.shadowRoot).not.toBeNull();
    host.remove();
  });

  it("renders one button per format", async () => {
    const host = mount(`
      <ce-feedback-export formats="markdown json clear"></ce-feedback-export>
    `);
    const el = host.querySelector("ce-feedback-export") as CeFeedbackExport;
    await el.updateComplete;
    const btns = el.shadowRoot!.querySelectorAll("button.ce-export__btn");
    expect(btns.length).toBe(3);
    host.remove();
  });

  it("clicking format button fires ce-feedback-export-request", async () => {
    const host = mount(`
      <div>
        <ce-feedback-export formats="markdown" subject="x"></ce-feedback-export>
      </div>
    `);
    const el = host.querySelector("ce-feedback-export") as CeFeedbackExport;
    await el.updateComplete;
    let detail: { format: string; subject: string } | null = null;
    host.addEventListener("ce-feedback-export-request", (e) => {
      detail = (e as CustomEvent).detail;
    });
    const btn = el.shadowRoot!.querySelector("button.ce-export__btn") as HTMLButtonElement;
    btn.click();
    expect(detail).not.toBeNull();
    expect(detail!.format).toBe("markdown");
    expect(detail!.subject).toBe("x");
    host.remove();
  });

  it("layout attribute reflects to host", async () => {
    const host = mount(`<ce-feedback-export layout="menu"></ce-feedback-export>`);
    const el = host.querySelector("ce-feedback-export") as CeFeedbackExport;
    await el.updateComplete;
    expect(el.getAttribute("layout")).toBe("menu");
    host.remove();
  });

  it("end-to-end: markdown export with sink wired up copies to clipboard", async () => {
    window.localStorage.setItem(
      "ce-feedback:naming-x",
      JSON.stringify({
        genrender: { item: "genrender", thumbs: "up", bookmarked: true, updatedAt: 1 },
        prosewave: { item: "prosewave", thumbs: "up", updatedAt: 1 },
        chatglow: { item: "chatglow", thumbs: "down", updatedAt: 1 },
      })
    );
    const writeText = vi.fn().mockResolvedValue(undefined);
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });
    const host = mount(`
      <ce-feedback-sink subject="naming-x" transport="localstorage">
        <ce-feedback-export formats="markdown"></ce-feedback-export>
      </ce-feedback-sink>
    `);
    const el = host.querySelector("ce-feedback-export") as CeFeedbackExport;
    await el.updateComplete;
    await settle();
    const btn = el.shadowRoot!.querySelector("button.ce-export__btn") as HTMLButtonElement;
    btn.click();
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    expect(writeText).toHaveBeenCalledTimes(1);
    const md = writeText.mock.calls[0][0] as string;
    expect(md).toContain("## Feedback on \"naming-x\"");
    expect(md).toContain("**Liked**: `genrender`, `prosewave`");
    expect(md).toContain("**Disliked**: `chatglow`");
    expect(md).toContain("**Shortlist**: `genrender`");
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
    host.remove();
  });

  it("status flashes after persisted/failed events", async () => {
    vi.useFakeTimers();
    const host = mount(`
      <ce-feedback-sink subject="s-status" transport="localstorage">
        <ce-feedback-export formats="markdown"></ce-feedback-export>
      </ce-feedback-sink>
    `);
    const sink = host.querySelector("ce-feedback-sink") as CeFeedbackSink;
    const el = host.querySelector("ce-feedback-export") as CeFeedbackExport;
    await el.updateComplete;
    await settle();
    sink.dispatchEvent(
      new CustomEvent("ce-feedback-persisted", {
        bubbles: true,
        composed: true,
        detail: { events: [], transport: "json" },
      })
    );
    await el.updateComplete;
    let status = el.shadowRoot!.querySelector(".ce-export__status");
    expect(status?.textContent?.trim()).toBe("Downloaded JSON");
    expect(status?.getAttribute("data-state")).toBe("ok");
    // Wait past the flash timer
    vi.advanceTimersByTime(1600);
    await el.updateComplete;
    status = el.shadowRoot!.querySelector(".ce-export__status");
    expect(status).toBeNull();
    host.remove();
  });

  it("failed status shows error variant", async () => {
    const host = mount(`
      <ce-feedback-sink subject="s-fail" transport="localstorage">
        <ce-feedback-export formats="markdown"></ce-feedback-export>
      </ce-feedback-sink>
    `);
    const sink = host.querySelector("ce-feedback-sink") as CeFeedbackSink;
    const el = host.querySelector("ce-feedback-export") as CeFeedbackExport;
    await el.updateComplete;
    await settle();
    sink.dispatchEvent(
      new CustomEvent("ce-feedback-failed", {
        bubbles: true,
        composed: true,
        detail: { events: [], transport: "http", error: new Error("x") },
      })
    );
    await el.updateComplete;
    const status = el.shadowRoot!.querySelector(".ce-export__status");
    expect(status?.getAttribute("data-state")).toBe("err");
    host.remove();
  });

  it("clear request empties sink state", async () => {
    window.localStorage.setItem(
      "ce-feedback:s-clear",
      JSON.stringify({ x: { item: "x", bookmarked: true, updatedAt: 1 } })
    );
    const host = mount(`
      <ce-feedback-sink subject="s-clear" transport="localstorage">
        <ce-feedback-export formats="clear"></ce-feedback-export>
      </ce-feedback-sink>
    `);
    const sink = host.querySelector("ce-feedback-sink") as CeFeedbackSink;
    const el = host.querySelector("ce-feedback-export") as CeFeedbackExport;
    await el.updateComplete;
    await settle();
    expect(sink.getState().x).toBeDefined();
    const btn = el.shadowRoot!.querySelector("button.ce-export__btn") as HTMLButtonElement;
    btn.click();
    await settle();
    expect(Object.keys(sink.getState())).toHaveLength(0);
    expect(window.localStorage.getItem("ce-feedback:s-clear")).toBeNull();
    host.remove();
  });
});
