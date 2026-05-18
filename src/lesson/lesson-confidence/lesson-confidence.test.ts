import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { LessonConfidence } from "./lesson-confidence.js";

beforeAll(() => defineOnce("lesson-confidence", LessonConfidence));

describe("<lesson-confidence>", () => {
  it("renders 5 buttons", async () => {
    const el = document.createElement("lesson-confidence") as LessonConfidence;
    document.body.appendChild(el);
    await el.updateComplete;
    const buttons = el.shadowRoot!.querySelectorAll(".lco-btn");
    expect(buttons.length).toBe(5);
    el.remove();
  });

  it("label prop appears", async () => {
    const el = document.createElement("lesson-confidence") as LessonConfidence;
    el.label = "How sure are you?";
    document.body.appendChild(el);
    await el.updateComplete;
    const label = el.shadowRoot!.querySelector(".lco-label");
    expect(label?.textContent?.trim()).toBe("How sure are you?");
    el.remove();
  });

  it("default label is 'How confident are you?'", async () => {
    const el = document.createElement("lesson-confidence") as LessonConfidence;
    document.body.appendChild(el);
    await el.updateComplete;
    const label = el.shadowRoot!.querySelector(".lco-label");
    expect(label?.textContent?.trim()).toBe("How confident are you?");
    el.remove();
  });

  it("clicking button 3 sets rating to 3", async () => {
    const el = document.createElement("lesson-confidence") as LessonConfidence;
    document.body.appendChild(el);
    await el.updateComplete;
    const buttons = el.shadowRoot!.querySelectorAll(".lco-btn") as NodeListOf<HTMLButtonElement>;
    buttons[2].click(); // index 2 = rating 3
    await el.updateComplete;
    const selected = el.shadowRoot!.querySelector(".lco-btn.selected");
    expect(selected?.textContent?.trim()).toBe("3");
    el.remove();
  });

  it("fires lesson-confidence-rate event with { rating: 3 }", async () => {
    const el = document.createElement("lesson-confidence") as LessonConfidence;
    document.body.appendChild(el);
    await el.updateComplete;
    let detail: any = null;
    el.addEventListener("lesson-confidence-rate", (e) => (detail = (e as CustomEvent).detail));
    const buttons = el.shadowRoot!.querySelectorAll(".lco-btn") as NodeListOf<HTMLButtonElement>;
    buttons[2].click();
    expect(detail).toEqual({ rating: 3 });
    el.remove();
  });

  it("after click, submitted reflects on host", async () => {
    const el = document.createElement("lesson-confidence") as LessonConfidence;
    document.body.appendChild(el);
    await el.updateComplete;
    const buttons = el.shadowRoot!.querySelectorAll(".lco-btn") as NodeListOf<HTMLButtonElement>;
    buttons[0].click();
    await el.updateComplete;
    expect(el.getAttribute("submitted")).not.toBeNull();
    el.remove();
  });

  it("reset() clears rating, removes submitted", async () => {
    const el = document.createElement("lesson-confidence") as LessonConfidence;
    document.body.appendChild(el);
    await el.updateComplete;
    const buttons = el.shadowRoot!.querySelectorAll(".lco-btn") as NodeListOf<HTMLButtonElement>;
    buttons[4].click();
    await el.updateComplete;
    el.reset();
    await el.updateComplete;
    expect(el.submitted).toBe(false);
    const selected = el.shadowRoot!.querySelector(".lco-btn.selected");
    expect(selected).toBeNull();
    el.remove();
  });

  it("buttons disabled after submission", async () => {
    const el = document.createElement("lesson-confidence") as LessonConfidence;
    document.body.appendChild(el);
    await el.updateComplete;
    const buttons = el.shadowRoot!.querySelectorAll(".lco-btn") as NodeListOf<HTMLButtonElement>;
    buttons[1].click();
    await el.updateComplete;
    // all buttons should be disabled
    const allDisabled = Array.from(buttons).every((btn) => btn.disabled);
    expect(allDisabled).toBe(true);
    el.remove();
  });
});
