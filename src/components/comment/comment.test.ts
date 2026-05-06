import { describe, it, expect, beforeAll, vi, afterEach } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeComment } from "./comment.js";

beforeAll(() => defineOnce("ce-comment", CeComment));

afterEach(() => {
  vi.useRealTimers();
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

describe("<ce-comment>", () => {
  it("upgrades and renders shadow root with collapsed trigger", async () => {
    const host = mount(`<ce-comment></ce-comment>`);
    const el = host.querySelector("ce-comment") as CeComment;
    await el.updateComplete;
    expect(el.shadowRoot).not.toBeNull();
    expect(el.expanded).toBe(false);
    const trigger = el.shadowRoot!.querySelector("button.ce-comment__trigger");
    expect(trigger).not.toBeNull();
    expect(trigger!.getAttribute("aria-expanded")).toBe("false");
    host.remove();
  });

  it("clicking the trigger expands and fires ce-comment-expand", async () => {
    const host = mount(`<ce-comment></ce-comment>`);
    const el = host.querySelector("ce-comment") as CeComment;
    await el.updateComplete;
    let detail: { expanded: boolean } | null = null;
    el.addEventListener("ce-comment-expand", (e) => {
      detail = (e as CustomEvent).detail;
    });
    const trigger = el.shadowRoot!.querySelector("button.ce-comment__trigger") as HTMLButtonElement;
    trigger.click();
    await el.updateComplete;
    expect(el.expanded).toBe(true);
    expect(detail).toEqual({ expanded: true });
    expect(el.hasAttribute("expanded")).toBe(true);
    const ta = el.shadowRoot!.querySelector("textarea");
    expect(ta).not.toBeNull();
    host.remove();
  });

  it("typing fires ce-comment-change after debounce window", async () => {
    vi.useFakeTimers();
    const host = mount(`<ce-comment debounce-ms="200" expanded></ce-comment>`);
    const el = host.querySelector("ce-comment") as CeComment;
    await el.updateComplete;
    let detail: { value: string } | null = null;
    el.addEventListener("ce-comment-change", (e) => {
      detail = (e as CustomEvent).detail;
    });
    const ta = el.shadowRoot!.querySelector("textarea") as HTMLTextAreaElement;
    ta.value = "hello";
    ta.dispatchEvent(new Event("input"));
    expect(detail).toBeNull();
    vi.advanceTimersByTime(199);
    expect(detail).toBeNull();
    vi.advanceTimersByTime(2);
    expect(detail).toEqual({ value: "hello" });
    expect(el.value).toBe("hello");
    host.remove();
  });

  it("rapid input only flushes once per window (debounce coalesces)", async () => {
    vi.useFakeTimers();
    const host = mount(`<ce-comment debounce-ms="100" expanded></ce-comment>`);
    const el = host.querySelector("ce-comment") as CeComment;
    await el.updateComplete;
    let count = 0;
    el.addEventListener("ce-comment-change", () => count++);
    const ta = el.shadowRoot!.querySelector("textarea") as HTMLTextAreaElement;
    for (const v of ["h", "he", "hel", "hell", "hello"]) {
      ta.value = v;
      ta.dispatchEvent(new Event("input"));
      vi.advanceTimersByTime(50);
    }
    expect(count).toBe(0);
    vi.advanceTimersByTime(100);
    expect(count).toBe(1);
    expect(el.value).toBe("hello");
    host.remove();
  });

  it("submit-on=enter: Enter commits and collapses; Shift+Enter does not", async () => {
    const host = mount(`<ce-comment submit-on="enter" expanded></ce-comment>`);
    const el = host.querySelector("ce-comment") as CeComment;
    await el.updateComplete;
    let commits = 0;
    let lastValue: string | null = null;
    el.addEventListener("ce-comment-commit", (e) => {
      commits++;
      lastValue = (e as CustomEvent).detail.value;
    });
    const ta = el.shadowRoot!.querySelector("textarea") as HTMLTextAreaElement;
    ta.value = "Important note";
    ta.dispatchEvent(new Event("input"));
    // Shift+Enter: no commit
    ta.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", shiftKey: true, bubbles: true })
    );
    expect(commits).toBe(0);
    // Plain Enter: commit
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await el.updateComplete;
    expect(commits).toBe(1);
    expect(lastValue).toBe("Important note");
    expect(el.expanded).toBe(false);
    host.remove();
  });

  it("submit-on=manual: only the Submit button commits", async () => {
    const host = mount(`<ce-comment submit-on="manual" expanded></ce-comment>`);
    const el = host.querySelector("ce-comment") as CeComment;
    await el.updateComplete;
    let commits = 0;
    el.addEventListener("ce-comment-commit", () => commits++);
    const ta = el.shadowRoot!.querySelector("textarea") as HTMLTextAreaElement;
    ta.value = "x";
    ta.dispatchEvent(new Event("input"));
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(commits).toBe(0);
    // Blur shouldn't commit either
    ta.dispatchEvent(new Event("blur"));
    expect(commits).toBe(0);
    // Click Submit
    const submitBtn = el.shadowRoot!.querySelectorAll<HTMLButtonElement>("button.ce-comment__btn")[1];
    submitBtn.click();
    expect(commits).toBe(1);
    expect(el.expanded).toBe(true); // manual mode does NOT auto-collapse
    host.remove();
  });

  it("max-length truncates input", async () => {
    const host = mount(`<ce-comment max-length="3" expanded></ce-comment>`);
    const el = host.querySelector("ce-comment") as CeComment;
    await el.updateComplete;
    const ta = el.shadowRoot!.querySelector("textarea") as HTMLTextAreaElement;
    ta.value = "abcdef";
    ta.dispatchEvent(new Event("input"));
    expect(ta.value).toBe("abc");
    host.remove();
  });

  it("expanded reflects to attribute", async () => {
    const host = mount(`<ce-comment></ce-comment>`);
    const el = host.querySelector("ce-comment") as CeComment;
    await el.updateComplete;
    el.expanded = true;
    await el.updateComplete;
    expect(el.hasAttribute("expanded")).toBe(true);
    el.expanded = false;
    await el.updateComplete;
    expect(el.hasAttribute("expanded")).toBe(false);
    host.remove();
  });

  it("submit-on=blur fires commit on textarea blur", async () => {
    const host = mount(`<ce-comment submit-on="blur" expanded></ce-comment>`);
    const el = host.querySelector("ce-comment") as CeComment;
    await el.updateComplete;
    let commits = 0;
    el.addEventListener("ce-comment-commit", () => commits++);
    const ta = el.shadowRoot!.querySelector("textarea") as HTMLTextAreaElement;
    ta.value = "blurred note";
    ta.dispatchEvent(new Event("input"));
    ta.dispatchEvent(new Event("blur"));
    expect(commits).toBe(1);
    expect(el.value).toBe("blurred note");
    host.remove();
  });

  it("Cancel button collapses without committing", async () => {
    const host = mount(`<ce-comment submit-on="manual" expanded></ce-comment>`);
    const el = host.querySelector("ce-comment") as CeComment;
    await el.updateComplete;
    let commits = 0;
    el.addEventListener("ce-comment-commit", () => commits++);
    const cancelBtn = el.shadowRoot!.querySelectorAll<HTMLButtonElement>("button.ce-comment__btn")[0];
    cancelBtn.click();
    await el.updateComplete;
    expect(commits).toBe(0);
    expect(el.expanded).toBe(false);
    host.remove();
  });

  it("trigger has aria-controls referencing the textarea id", async () => {
    const host = mount(`<ce-comment></ce-comment>`);
    const el = host.querySelector("ce-comment") as CeComment;
    await el.updateComplete;
    const trigger = el.shadowRoot!.querySelector("button.ce-comment__trigger") as HTMLButtonElement;
    const id = trigger.getAttribute("aria-controls");
    expect(id).toBeTruthy();
    expect(id).toMatch(/^ce-comment-ta-/);
    trigger.click();
    await el.updateComplete;
    const ta = el.shadowRoot!.querySelector("textarea") as HTMLTextAreaElement;
    expect(ta.id).toBe(id);
    host.remove();
  });
});
