import { describe, it, expect, beforeAll, vi } from "vitest";
import { defineOnce } from "../../core/index.js";
import { LessonMatch } from "./lesson-match.js";

beforeAll(() => defineOnce("lesson-match", LessonMatch));

const pairs = [
  { left: "France", right: "Paris" },
  { left: "Germany", right: "Berlin" },
  { left: "Spain", right: "Madrid" },
];

function clickByText(el: LessonMatch, text: string): void {
  const buttons = el.shadowRoot!.querySelectorAll(".lm-item") as NodeListOf<HTMLButtonElement>;
  for (const btn of Array.from(buttons)) {
    if (btn.textContent?.trim() === text) {
      btn.click();
      return;
    }
  }
  throw new Error(`No button with text "${text}"`);
}

describe("<lesson-match>", () => {
  it("renders one button per left and per right item", async () => {
    const el = document.createElement("lesson-match") as LessonMatch;
    el.pairs = pairs;
    document.body.appendChild(el);
    await el.updateComplete;
    const buttons = el.shadowRoot!.querySelectorAll(".lm-item");
    expect(buttons.length).toBe(6); // 3 left + 3 right
    el.remove();
  });

  it("empty pairs renders nothing", async () => {
    const el = document.createElement("lesson-match") as LessonMatch;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".lm-item")).toBeNull();
    el.remove();
  });

  it("correct match locks both items as .correct and disables them", async () => {
    const el = document.createElement("lesson-match") as LessonMatch;
    el.pairs = pairs;
    document.body.appendChild(el);
    await el.updateComplete;
    clickByText(el, "France");
    await el.updateComplete;
    clickByText(el, "Paris");
    await el.updateComplete;
    const correct = el.shadowRoot!.querySelectorAll(".lm-item.correct") as NodeListOf<HTMLButtonElement>;
    expect(correct.length).toBe(2);
    expect(Array.from(correct).every((b) => b.disabled)).toBe(true);
    el.remove();
  });

  it("incorrect match flashes both as .wrong and resets the selection", async () => {
    const el = document.createElement("lesson-match") as LessonMatch;
    el.pairs = pairs;
    document.body.appendChild(el);
    await el.updateComplete;
    clickByText(el, "France");
    await el.updateComplete;
    clickByText(el, "Berlin"); // wrong
    await el.updateComplete;
    const wrong = el.shadowRoot!.querySelectorAll(".lm-item.wrong");
    expect(wrong.length).toBe(2);
    const selected = el.shadowRoot!.querySelectorAll(".lm-item.selected");
    expect(selected.length).toBe(0);
    el.remove();
  });

  it("fires lesson-match-pair with correct=true on a right answer", async () => {
    const el = document.createElement("lesson-match") as LessonMatch;
    el.pairs = pairs;
    document.body.appendChild(el);
    await el.updateComplete;
    let detail: any = null;
    el.addEventListener("lesson-match-pair", (e) => (detail = (e as CustomEvent).detail));
    clickByText(el, "Germany");
    clickByText(el, "Berlin");
    expect(detail).toEqual({ left: "Germany", right: "Berlin", correct: true });
    el.remove();
  });

  it("fires lesson-match-pair with correct=false on a wrong answer", async () => {
    const el = document.createElement("lesson-match") as LessonMatch;
    el.pairs = pairs;
    document.body.appendChild(el);
    await el.updateComplete;
    let detail: any = null;
    el.addEventListener("lesson-match-pair", (e) => (detail = (e as CustomEvent).detail));
    clickByText(el, "Spain");
    clickByText(el, "Berlin");
    expect(detail).toEqual({ left: "Spain", right: "Berlin", correct: false });
    el.remove();
  });

  it("fires lesson-match-complete with attempts count after final pair", async () => {
    const el = document.createElement("lesson-match") as LessonMatch;
    el.pairs = pairs;
    document.body.appendChild(el);
    await el.updateComplete;
    let complete: any = null;
    el.addEventListener("lesson-match-complete", (e) => (complete = (e as CustomEvent).detail));
    // 4 attempts: 1 wrong then 3 correct
    clickByText(el, "France");
    clickByText(el, "Berlin"); // wrong
    await el.updateComplete;
    clickByText(el, "France");
    clickByText(el, "Paris");
    await el.updateComplete;
    clickByText(el, "Germany");
    clickByText(el, "Berlin");
    await el.updateComplete;
    clickByText(el, "Spain");
    clickByText(el, "Madrid");
    await el.updateComplete;
    expect(complete).toEqual({ attempts: 4 });
    expect(el.submitted).toBe(true);
    el.remove();
  });

  it("submitted attribute reflects on host once all pairs matched", async () => {
    const el = document.createElement("lesson-match") as LessonMatch;
    el.pairs = [{ left: "A", right: "1" }];
    document.body.appendChild(el);
    await el.updateComplete;
    clickByText(el, "A");
    clickByText(el, "1");
    await el.updateComplete;
    expect(el.getAttribute("submitted")).not.toBeNull();
    el.remove();
  });

  it("reset() clears all matched + wrong + submitted state", async () => {
    const el = document.createElement("lesson-match") as LessonMatch;
    el.pairs = pairs;
    document.body.appendChild(el);
    await el.updateComplete;
    clickByText(el, "France");
    clickByText(el, "Paris");
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll(".lm-item.correct").length).toBe(2);
    el.reset();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll(".lm-item.correct").length).toBe(0);
    expect(el.submitted).toBe(false);
    el.remove();
  });

  it("renders column labels when left-label/right-label set", async () => {
    const el = document.createElement("lesson-match") as LessonMatch;
    el.pairs = pairs;
    el.leftLabel = "Country";
    el.rightLabel = "Capital";
    document.body.appendChild(el);
    await el.updateComplete;
    const labels = el.shadowRoot!.querySelectorAll(".lm-col-label");
    expect(labels.length).toBe(2);
    expect(labels[0].textContent?.trim()).toBe("Country");
    expect(labels[1].textContent?.trim()).toBe("Capital");
    el.remove();
  });

  it("parses pairs from JSON attribute", async () => {
    const el = document.createElement("lesson-match") as LessonMatch;
    el.setAttribute(
      "pairs",
      '[{"left":"H","right":"Hydrogen"},{"left":"He","right":"Helium"}]'
    );
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.pairs).toEqual([
      { left: "H", right: "Hydrogen" },
      { left: "He", right: "Helium" },
    ]);
    el.remove();
  });

  it("falls back gracefully on malformed pairs JSON", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = document.createElement("lesson-match") as LessonMatch;
    el.setAttribute("pairs", "not-json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.pairs).toEqual([]);
    warn.mockRestore();
    el.remove();
  });
});
