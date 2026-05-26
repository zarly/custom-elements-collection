import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { LessonOption } from "./lesson-option.js";

beforeAll(() => defineOnce("lesson-option", LessonOption));

function make(html: string): LessonOption {
  const wrap = document.createElement("div");
  wrap.innerHTML = html;
  const el = wrap.firstElementChild as LessonOption;
  document.body.appendChild(el);
  return el;
}

describe("<lesson-option>", () => {
  it("renders the slotted text in a static row by default", async () => {
    const el = make(`<lesson-option>typeof x === 'string'</lesson-option>`);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".lo-row")?.tagName).toBe("DIV");
    expect(el.shadowRoot!.querySelector(".lo-marker")?.textContent).toBe("○");
    el.remove();
  });

  it("renders as a button when interactive", async () => {
    const el = make(`<lesson-option interactive>x as string</lesson-option>`);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".lo-row")?.tagName).toBe("BUTTON");
    el.remove();
  });

  it("marks the correct option with a check when revealed", async () => {
    const el = make(`<lesson-option correct revealed>right</lesson-option>`);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".lo-marker")?.textContent).toBe("✓");
    expect(el.shadowRoot!.querySelector(".lo-tag")?.textContent).toBe("correct");
    el.remove();
  });

  it("emits lesson-option-pick with detail.value=text and correct=true on click", async () => {
    const el = make(`<lesson-option interactive correct>typeof check</lesson-option>`);
    await el.updateComplete;
    let detail: any = null;
    el.addEventListener("lesson-option-pick", (e) => (detail = (e as CustomEvent).detail));
    (el.shadowRoot!.querySelector("button.lo-row") as HTMLButtonElement).click();
    expect(detail).toEqual({ value: "typeof check", correct: true });
    el.remove();
  });

  it("uses the value attribute over the slotted text in event detail", async () => {
    const el = make(`<lesson-option interactive value="opt-a">typeof check</lesson-option>`);
    await el.updateComplete;
    let detail: any = null;
    el.addEventListener("lesson-option-pick", (e) => (detail = (e as CustomEvent).detail));
    (el.shadowRoot!.querySelector("button.lo-row") as HTMLButtonElement).click();
    expect(detail).toEqual({ value: "opt-a", correct: false });
    el.remove();
  });

  it("does not emit when not interactive", async () => {
    const el = make(`<lesson-option>x</lesson-option>`);
    await el.updateComplete;
    let called = false;
    el.addEventListener("lesson-option-pick", () => (called = true));
    // No clickable button when not interactive; the row is a div.
    (el.shadowRoot!.querySelector(".lo-row") as HTMLElement).dispatchEvent(
      new MouseEvent("click", { bubbles: true })
    );
    expect(called).toBe(false);
    el.remove();
  });

  it("shows ✗ marker on picked-but-not-correct, and disables the button when revealed", async () => {
    const el = make(`<lesson-option interactive>wrong answer</lesson-option>`);
    el.picked = true;
    el.revealed = true;
    await el.updateComplete;
    const btn = el.shadowRoot!.querySelector("button.lo-row") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(el.shadowRoot!.querySelector(".lo-marker")?.textContent).toBe("✗");
    el.remove();
  });
});
