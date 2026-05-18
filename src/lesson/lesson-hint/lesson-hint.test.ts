import { describe, it, expect, beforeAll, vi } from "vitest";
import { defineOnce } from "../../core/index.js";
import { LessonHint } from "./lesson-hint.js";

beforeAll(() => defineOnce("lesson-hint", LessonHint));

describe("<lesson-hint>", () => {
  it("renders 'Show hint 1 of N' button", async () => {
    const el = document.createElement("lesson-hint") as LessonHint;
    el.hints = ["First hint", "Second hint", "Third hint"];
    document.body.appendChild(el);
    await el.updateComplete;
    const btn = el.shadowRoot!.querySelector(".lh-btn");
    expect(btn?.textContent?.trim()).toBe("Show hint 1 of 3");
    el.remove();
  });

  it("click reveals first hint in list", async () => {
    const el = document.createElement("lesson-hint") as LessonHint;
    el.hints = ["First hint", "Second hint"];
    document.body.appendChild(el);
    await el.updateComplete;
    (el.shadowRoot!.querySelector(".lh-btn") as HTMLButtonElement).click();
    await el.updateComplete;
    const items = el.shadowRoot!.querySelectorAll(".lh-item");
    expect(items.length).toBe(1);
    el.remove();
  });

  it("button label updates to 'Show hint 2 of N' after first reveal", async () => {
    const el = document.createElement("lesson-hint") as LessonHint;
    el.hints = ["Hint 1", "Hint 2", "Hint 3"];
    document.body.appendChild(el);
    await el.updateComplete;
    (el.shadowRoot!.querySelector(".lh-btn") as HTMLButtonElement).click();
    await el.updateComplete;
    const btn = el.shadowRoot!.querySelector(".lh-btn");
    expect(btn?.textContent?.trim()).toBe("Show hint 2 of 3");
    el.remove();
  });

  it("fires lesson-hint-show event with { index: 0, hint: '...' }", async () => {
    const el = document.createElement("lesson-hint") as LessonHint;
    el.hints = ["The first hint"];
    document.body.appendChild(el);
    await el.updateComplete;
    let detail: any = null;
    el.addEventListener("lesson-hint-show", (e) => (detail = (e as CustomEvent).detail));
    (el.shadowRoot!.querySelector(".lh-btn") as HTMLButtonElement).click();
    expect(detail).toEqual({ index: 0, hint: "The first hint" });
    el.remove();
  });

  it("after all hints shown, button disabled with 'All hints shown'", async () => {
    const el = document.createElement("lesson-hint") as LessonHint;
    el.hints = ["Only hint"];
    document.body.appendChild(el);
    await el.updateComplete;
    (el.shadowRoot!.querySelector(".lh-btn") as HTMLButtonElement).click();
    await el.updateComplete;
    const btn = el.shadowRoot!.querySelector(".lh-btn") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent?.trim()).toBe("All hints shown");
    el.remove();
  });

  it("each revealed hint has a number prefix", async () => {
    const el = document.createElement("lesson-hint") as LessonHint;
    el.hints = ["First", "Second"];
    document.body.appendChild(el);
    await el.updateComplete;
    const btn = el.shadowRoot!.querySelector(".lh-btn") as HTMLButtonElement;
    btn.click();
    await el.updateComplete;
    btn.click();
    await el.updateComplete;
    const nums = el.shadowRoot!.querySelectorAll(".lh-num");
    expect(nums.length).toBe(2);
    el.remove();
  });

  it("most recently shown hint has .latest class", async () => {
    const el = document.createElement("lesson-hint") as LessonHint;
    el.hints = ["A", "B"];
    document.body.appendChild(el);
    await el.updateComplete;
    const btn = el.shadowRoot!.querySelector(".lh-btn") as HTMLButtonElement;
    btn.click();
    await el.updateComplete;
    const latestItems = el.shadowRoot!.querySelectorAll(".lh-item.latest");
    expect(latestItems.length).toBe(1);
    el.remove();
  });

  it("empty hints renders nothing visible", async () => {
    const el = document.createElement("lesson-hint") as LessonHint;
    document.body.appendChild(el);
    await el.updateComplete;
    const btn = el.shadowRoot!.querySelector(".lh-btn");
    expect(btn).toBeNull();
    el.remove();
  });

  it("parses hints from JSON attribute", async () => {
    const el = document.createElement("lesson-hint") as LessonHint;
    el.setAttribute("hints", '["Hint A","Hint B"]');
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.hints).toEqual(["Hint A", "Hint B"]);
    el.remove();
  });

  it("falls back gracefully on malformed hints JSON", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = document.createElement("lesson-hint") as LessonHint;
    el.setAttribute("hints", "not-json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.hints).toEqual([]);
    warn.mockRestore();
    el.remove();
  });
});
