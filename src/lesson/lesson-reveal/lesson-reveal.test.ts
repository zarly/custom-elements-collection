import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { LessonReveal } from "./lesson-reveal.js";

beforeAll(() => defineOnce("lesson-reveal", LessonReveal));

describe("<lesson-reveal>", () => {
  it("renders front text by default (not flipped)", async () => {
    const el = document.createElement("lesson-reveal") as LessonReveal;
    el.front = "What is spaced repetition?";
    el.back = "The answer.";
    document.body.appendChild(el);
    await el.updateComplete;
    const text = el.shadowRoot!.querySelector(".lr2-text");
    expect(text?.textContent).toBe("What is spaced repetition?");
    el.remove();
  });

  it("renders front-label text in header", async () => {
    const el = document.createElement("lesson-reveal") as LessonReveal;
    el.frontLabel = "Term";
    el.front = "Something";
    document.body.appendChild(el);
    await el.updateComplete;
    const label = el.shadowRoot!.querySelector(".lr2-label");
    expect(label?.textContent?.trim()).toBe("Term");
    el.remove();
  });

  it("default front-label is Question", async () => {
    const el = document.createElement("lesson-reveal") as LessonReveal;
    document.body.appendChild(el);
    await el.updateComplete;
    const label = el.shadowRoot!.querySelector(".lr2-label");
    expect(label?.textContent?.trim()).toBe("Question");
    el.remove();
  });

  it("click flips to back — back text visible", async () => {
    const el = document.createElement("lesson-reveal") as LessonReveal;
    el.front = "Front text";
    el.back = "Back answer";
    document.body.appendChild(el);
    await el.updateComplete;
    el.click();
    await el.updateComplete;
    const text = el.shadowRoot!.querySelector(".lr2-text");
    expect(text?.textContent).toBe("Back answer");
    el.remove();
  });

  it("click again flips back to front", async () => {
    const el = document.createElement("lesson-reveal") as LessonReveal;
    el.front = "Front text";
    el.back = "Back answer";
    document.body.appendChild(el);
    await el.updateComplete;
    el.click();
    await el.updateComplete;
    el.click();
    await el.updateComplete;
    const text = el.shadowRoot!.querySelector(".lr2-text");
    expect(text?.textContent).toBe("Front text");
    el.remove();
  });

  it("fires lesson-reveal-flip event with flipped=true on first click", async () => {
    const el = document.createElement("lesson-reveal") as LessonReveal;
    el.front = "Q";
    el.back = "A";
    document.body.appendChild(el);
    await el.updateComplete;
    let detail: any = null;
    el.addEventListener("lesson-reveal-flip", (e) => (detail = (e as CustomEvent).detail));
    el.click();
    expect(detail).toEqual({ flipped: true });
    el.remove();
  });

  it("reset() returns to front state", async () => {
    const el = document.createElement("lesson-reveal") as LessonReveal;
    el.front = "Front text";
    el.back = "Back answer";
    document.body.appendChild(el);
    await el.updateComplete;
    el.click();
    await el.updateComplete;
    el.reset();
    await el.updateComplete;
    const text = el.shadowRoot!.querySelector(".lr2-text");
    expect(text?.textContent).toBe("Front text");
    el.remove();
  });

  it("back-label appears after flip", async () => {
    const el = document.createElement("lesson-reveal") as LessonReveal;
    el.backLabel = "Definition";
    el.front = "Term";
    el.back = "The definition";
    document.body.appendChild(el);
    await el.updateComplete;
    el.click();
    await el.updateComplete;
    const label = el.shadowRoot!.querySelector(".lr2-label");
    expect(label?.textContent?.trim()).toBe("Definition");
    el.remove();
  });
});
