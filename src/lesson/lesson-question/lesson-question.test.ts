import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { LessonOption } from "../lesson-option/lesson-option.js";
import { LessonQuestion } from "./lesson-question.js";

beforeAll(() => {
  defineOnce("lesson-option", LessonOption);
  defineOnce("lesson-question", LessonQuestion);
});

function mount(html: string): LessonQuestion {
  const wrap = document.createElement("div");
  wrap.innerHTML = html;
  const el = wrap.firstElementChild as LessonQuestion;
  document.body.appendChild(el);
  return el;
}

async function settle(el: LessonQuestion): Promise<void> {
  await el.updateComplete;
  // Two extra micro/macrotask flushes so the question can sync children
  // after the slot is connected and the queueMicrotask in connectedCallback runs.
  await Promise.resolve();
  await el.updateComplete;
  for (const c of el.querySelectorAll("lesson-option")) {
    await (c as LessonOption).updateComplete;
  }
}

describe("<lesson-question>", () => {
  it("renders the prompt text", async () => {
    const el = mount(`
      <lesson-question prompt="Which check narrows unknown to string?">
        <lesson-option correct>typeof x === 'string'</lesson-option>
        <lesson-option>x as string</lesson-option>
      </lesson-question>
    `);
    await settle(el);
    expect(el.shadowRoot!.querySelector(".lq-prompt")?.textContent).toBe(
      "Which check narrows unknown to string?"
    );
    el.remove();
  });

  it("in static mode reveals all options so the correct answer is visible", async () => {
    const el = mount(`
      <lesson-question prompt="x">
        <lesson-option correct>a</lesson-option>
        <lesson-option>b</lesson-option>
        <lesson-option>c</lesson-option>
      </lesson-question>
    `);
    await settle(el);
    const opts = el.querySelectorAll("lesson-option");
    for (const o of opts) {
      expect((o as LessonOption).revealed).toBe(true);
      expect((o as LessonOption).interactive).toBe(false);
    }
    el.remove();
  });

  it("in interactive mode flips options to interactive and unrevealed", async () => {
    const el = mount(`
      <lesson-question prompt="x" interactive>
        <lesson-option correct>a</lesson-option>
        <lesson-option>b</lesson-option>
      </lesson-question>
    `);
    await settle(el);
    const opts = el.querySelectorAll("lesson-option");
    for (const o of opts) {
      expect((o as LessonOption).interactive).toBe(true);
      expect((o as LessonOption).revealed).toBe(false);
      expect((o as LessonOption).picked).toBe(false);
    }
    el.remove();
  });

  it("locks all options after a click and reveals correct/wrong", async () => {
    const el = mount(`
      <lesson-question prompt="x" interactive>
        <lesson-option correct value="A">a</lesson-option>
        <lesson-option value="B">b</lesson-option>
      </lesson-question>
    `);
    await settle(el);
    const wrong = el.querySelectorAll("lesson-option")[1] as LessonOption;
    const btn = wrong.shadowRoot!.querySelector("button.lo-row") as HTMLButtonElement;
    btn.click();
    await settle(el);
    expect(el.answered).toBe(true);
    const opts = el.querySelectorAll("lesson-option");
    for (const o of opts) {
      expect((o as LessonOption).interactive).toBe(false);
      expect((o as LessonOption).revealed).toBe(true);
    }
    expect(wrong.picked).toBe(true);
    el.remove();
  });

  it("fires lesson-question-answer with value, correct, index", async () => {
    const el = mount(`
      <lesson-question prompt="x" interactive>
        <lesson-option correct value="A">a</lesson-option>
        <lesson-option value="B">b</lesson-option>
        <lesson-option value="C">c</lesson-option>
      </lesson-question>
    `);
    await settle(el);
    let detail: any = null;
    el.addEventListener("lesson-question-answer", (e) => (detail = (e as CustomEvent).detail));
    const correct = el.querySelector("lesson-option") as LessonOption;
    (correct.shadowRoot!.querySelector("button.lo-row") as HTMLButtonElement).click();
    await settle(el);
    expect(detail).toEqual({ value: "A", correct: true, index: 0 });
    el.remove();
  });

  it("reset() clears answered state and re-enables options", async () => {
    const el = mount(`
      <lesson-question prompt="x" interactive>
        <lesson-option correct value="A">a</lesson-option>
        <lesson-option value="B">b</lesson-option>
      </lesson-question>
    `);
    await settle(el);
    const wrong = el.querySelectorAll("lesson-option")[1] as LessonOption;
    (wrong.shadowRoot!.querySelector("button.lo-row") as HTMLButtonElement).click();
    await settle(el);
    expect(el.answered).toBe(true);
    el.reset();
    await settle(el);
    expect(el.answered).toBe(false);
    for (const o of el.querySelectorAll("lesson-option")) {
      expect((o as LessonOption).picked).toBe(false);
      expect((o as LessonOption).revealed).toBe(false);
      expect((o as LessonOption).interactive).toBe(true);
    }
    el.remove();
  });

  it("only fires once per question (further clicks are ignored)", async () => {
    const el = mount(`
      <lesson-question prompt="x" interactive>
        <lesson-option correct value="A">a</lesson-option>
        <lesson-option value="B">b</lesson-option>
      </lesson-question>
    `);
    await settle(el);
    let count = 0;
    el.addEventListener("lesson-question-answer", () => count++);
    const opts = el.querySelectorAll("lesson-option");
    (opts[0].shadowRoot!.querySelector("button.lo-row") as HTMLButtonElement).click();
    await settle(el);
    // After answer the buttons are disabled; trying to click again is a no-op.
    const btn2 = opts[1].shadowRoot!.querySelector("button.lo-row") as HTMLButtonElement;
    btn2?.click();
    await settle(el);
    expect(count).toBe(1);
    el.remove();
  });
});
