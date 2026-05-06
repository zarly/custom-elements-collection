import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { defineOnce } from "../../core/index.js";
import { LessonQuickfire } from "./lesson-quickfire.js";

beforeAll(() => defineOnce("lesson-quickfire", LessonQuickfire));

describe("<lesson-quickfire>", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("renders the first round prompt + options", async () => {
    const el = document.createElement("lesson-quickfire") as LessonQuickfire;
    el.rounds = [
      { prompt: "1+1=", options: ["1", "2", "3"], correct: "2" },
      { prompt: "2+2=", options: ["3", "4", "5"], correct: "4" },
    ];
    el.timer = 5;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".qf-prompt")?.textContent?.trim()).toBe("1+1=");
    expect(el.shadowRoot!.querySelectorAll(".qf-btn").length).toBe(3);
    el.remove();
  });

  it("flashes correct on right answer and increments score", async () => {
    const el = document.createElement("lesson-quickfire") as LessonQuickfire;
    el.rounds = [
      { prompt: "1+1=", options: ["1", "2"], correct: "2" },
      { prompt: "1+2=", options: ["2", "3"], correct: "3" },
    ];
    el.timer = 99;
    document.body.appendChild(el);
    await el.updateComplete;
    const btns = el.shadowRoot!.querySelectorAll(".qf-btn") as NodeListOf<HTMLButtonElement>;
    btns[1].click(); // correct
    await el.updateComplete;
    expect(btns[1].classList.contains("flash-correct")).toBe(true);
    // After 600ms it advances
    vi.advanceTimersByTime(700);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".qf-prompt")?.textContent?.trim()).toBe("1+2=");
    el.remove();
  });

  it("emits lesson-quickfire-done after the last round and shows score", async () => {
    const el = document.createElement("lesson-quickfire") as LessonQuickfire;
    el.rounds = [{ prompt: "x", options: ["a", "b"], correct: "a" }];
    el.timer = 99;
    document.body.appendChild(el);
    await el.updateComplete;
    let detail: any = null;
    el.addEventListener("lesson-quickfire-done", (e) => (detail = (e as CustomEvent).detail));
    const btns = el.shadowRoot!.querySelectorAll(".qf-btn") as NodeListOf<HTMLButtonElement>;
    btns[0].click(); // correct
    vi.advanceTimersByTime(700);
    await el.updateComplete;
    expect(detail).toEqual({ score: 1, total: 1 });
    expect(el.shadowRoot!.querySelector(".qf-score")?.textContent?.trim()).toBe("1 / 1");
    el.remove();
  });

  it("parses rounds from a JSON attribute set before connection", async () => {
    const el = document.createElement("lesson-quickfire") as LessonQuickfire;
    const rounds = [
      { prompt: "2+2=", options: ["3", "4", "5"], correct: "4" },
      { prompt: "3+3=", options: ["5", "6", "7"], correct: "6" },
    ];
    el.setAttribute("rounds", JSON.stringify(rounds));
    el.timer = 99;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.rounds).toEqual(rounds);
    expect(el.shadowRoot!.querySelector(".qf-prompt")?.textContent?.trim()).toBe("2+2=");
    expect(el.shadowRoot!.querySelectorAll(".qf-btn").length).toBe(3);
    el.remove();
  });

  it("falls back + warns when the rounds attribute is malformed JSON", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = document.createElement("lesson-quickfire") as LessonQuickfire;
    el.setAttribute("rounds", "not json");
    el.timer = 99;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.rounds).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    el.remove();
  });

  it("reset() restarts from round 0 with score 0", async () => {
    const el = document.createElement("lesson-quickfire") as LessonQuickfire;
    el.rounds = [
      { prompt: "1", options: ["a", "b"], correct: "a" },
      { prompt: "2", options: ["c", "d"], correct: "c" },
    ];
    el.timer = 99;
    document.body.appendChild(el);
    await el.updateComplete;
    (el.shadowRoot!.querySelectorAll(".qf-btn")[0] as HTMLButtonElement).click();
    vi.advanceTimersByTime(700);
    await el.updateComplete;
    (el.shadowRoot!.querySelectorAll(".qf-btn")[0] as HTMLButtonElement).click();
    vi.advanceTimersByTime(700);
    await el.updateComplete;
    // Now done
    expect(el.shadowRoot!.querySelector(".qf-done")).not.toBeNull();
    el.reset();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".qf-prompt")?.textContent?.trim()).toBe("1");
    el.remove();
  });
});
