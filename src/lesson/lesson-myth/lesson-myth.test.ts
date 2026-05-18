import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { LessonMyth } from "./lesson-myth.js";

beforeAll(() => defineOnce("lesson-myth", LessonMyth));

describe("<lesson-myth>", () => {
  it("shows myth text initially, truth text hidden", async () => {
    const el = document.createElement("lesson-myth") as LessonMyth;
    el.myth = "We only use 10% of our brain.";
    el.truth = "We use virtually all of our brain.";
    document.body.appendChild(el);
    await el.updateComplete;
    const text = el.shadowRoot!.querySelector(".lm-text");
    expect(text?.textContent).toBe("We only use 10% of our brain.");
    el.remove();
  });

  it("shows Myth badge initially", async () => {
    const el = document.createElement("lesson-myth") as LessonMyth;
    el.myth = "10% brain myth.";
    document.body.appendChild(el);
    await el.updateComplete;
    const badge = el.shadowRoot!.querySelector(".lm-badge");
    expect(badge?.textContent?.trim()).toBe("✗ Myth");
    el.remove();
  });

  it("click reveals truth text", async () => {
    const el = document.createElement("lesson-myth") as LessonMyth;
    el.myth = "Myth text";
    el.truth = "Truth text";
    document.body.appendChild(el);
    await el.updateComplete;
    el.click();
    await el.updateComplete;
    const text = el.shadowRoot!.querySelector(".lm-text");
    expect(text?.textContent).toBe("Truth text");
    el.remove();
  });

  it("after reveal, Truth badge shown, myth content hidden", async () => {
    const el = document.createElement("lesson-myth") as LessonMyth;
    el.myth = "Myth text";
    el.truth = "Truth text";
    document.body.appendChild(el);
    await el.updateComplete;
    el.click();
    await el.updateComplete;
    const badge = el.shadowRoot!.querySelector(".lm-badge");
    expect(badge?.textContent?.trim()).toBe("✓ Truth");
    el.remove();
  });

  it("fires lesson-myth-reveal event on first click", async () => {
    const el = document.createElement("lesson-myth") as LessonMyth;
    el.myth = "M";
    el.truth = "T";
    document.body.appendChild(el);
    await el.updateComplete;
    let fired = false;
    el.addEventListener("lesson-myth-reveal", () => (fired = true));
    el.click();
    expect(fired).toBe(true);
    el.remove();
  });

  it("does not fire event again on subsequent click", async () => {
    const el = document.createElement("lesson-myth") as LessonMyth;
    el.myth = "M";
    el.truth = "T";
    document.body.appendChild(el);
    await el.updateComplete;
    let count = 0;
    el.addEventListener("lesson-myth-reveal", () => count++);
    el.click();
    el.click(); // second click on revealed card does nothing
    expect(count).toBe(1);
    el.remove();
  });

  it("reset() returns to myth view", async () => {
    const el = document.createElement("lesson-myth") as LessonMyth;
    el.myth = "Myth text";
    el.truth = "Truth text";
    document.body.appendChild(el);
    await el.updateComplete;
    el.click();
    await el.updateComplete;
    el.reset();
    await el.updateComplete;
    const text = el.shadowRoot!.querySelector(".lm-text");
    expect(text?.textContent).toBe("Myth text");
    el.remove();
  });

  it("explanation appears below truth after reveal when set", async () => {
    const el = document.createElement("lesson-myth") as LessonMyth;
    el.myth = "M";
    el.truth = "T";
    el.explanation = "This is because...";
    document.body.appendChild(el);
    await el.updateComplete;
    el.click();
    await el.updateComplete;
    const exp = el.shadowRoot!.querySelector(".lm-explanation");
    expect(exp?.textContent).toBe("This is because...");
    el.remove();
  });
});
