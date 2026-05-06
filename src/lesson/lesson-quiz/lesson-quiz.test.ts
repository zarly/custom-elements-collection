import { describe, it, expect, beforeAll, vi } from "vitest";
import { defineOnce } from "../../core/index.js";
import { LessonQuiz } from "./lesson-quiz.js";

beforeAll(() => defineOnce("lesson-quiz", LessonQuiz));

describe("<lesson-quiz>", () => {
  it("renders question and options", async () => {
    const el = document.createElement("lesson-quiz") as LessonQuiz;
    el.question = "Which is correct?";
    el.options = ["a", "b", "c"];
    el.correct = 1;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".lq-q")?.textContent).toBe("Which is correct?");
    expect(el.shadowRoot!.querySelectorAll(".lq-opt").length).toBe(3);
    el.remove();
  });

  it("emits lesson-quiz-answer with correct=true on right pick", async () => {
    const el = document.createElement("lesson-quiz") as LessonQuiz;
    el.question = "x";
    el.options = ["a", "b"];
    el.correct = 0;
    document.body.appendChild(el);
    await el.updateComplete;
    let detail: any = null;
    el.addEventListener("lesson-quiz-answer", (e) => (detail = (e as CustomEvent).detail));
    (el.shadowRoot!.querySelectorAll(".lq-opt")[0] as HTMLButtonElement).click();
    expect(detail).toEqual({ index: 0, correct: true });
    el.remove();
  });

  it("emits with correct=false and reveals correct option on wrong pick", async () => {
    const el = document.createElement("lesson-quiz") as LessonQuiz;
    el.question = "x";
    el.options = ["a", "b"];
    el.correct = 1;
    document.body.appendChild(el);
    await el.updateComplete;
    let detail: any = null;
    el.addEventListener("lesson-quiz-answer", (e) => (detail = (e as CustomEvent).detail));
    const opts = el.shadowRoot!.querySelectorAll(".lq-opt") as NodeListOf<HTMLButtonElement>;
    opts[0].click();
    await el.updateComplete;
    expect(detail).toEqual({ index: 0, correct: false });
    expect(opts[0].classList.contains("wrong")).toBe(true);
    expect(opts[1].classList.contains("shown-correct")).toBe(true);
    el.remove();
  });

  it("renders explanation only after pick", async () => {
    const el = document.createElement("lesson-quiz") as LessonQuiz;
    el.question = "x";
    el.options = ["a"];
    el.correct = 0;
    el.explanation = "Because XYZ.";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".lq-explain")).toBeNull();
    (el.shadowRoot!.querySelector(".lq-opt") as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".lq-explain")?.textContent).toBe("Because XYZ.");
    el.remove();
  });

  it("parses options from a JSON attribute set before connection", async () => {
    const el = document.createElement("lesson-quiz") as LessonQuiz;
    el.question = "pick one";
    el.correct = 1;
    el.setAttribute("options", JSON.stringify(["a", "b", "c", "d"]));
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.options).toEqual(["a", "b", "c", "d"]);
    expect(el.shadowRoot!.querySelectorAll(".lq-opt").length).toBe(4);
    el.remove();
  });

  it("falls back + warns when the options attribute is malformed JSON", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = document.createElement("lesson-quiz") as LessonQuiz;
    el.question = "pick one";
    el.correct = 0;
    el.setAttribute("options", "not json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.options).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    el.remove();
  });

  it("disables options after pick", async () => {
    const el = document.createElement("lesson-quiz") as LessonQuiz;
    el.question = "x";
    el.options = ["a", "b"];
    el.correct = 0;
    document.body.appendChild(el);
    await el.updateComplete;
    const opts = el.shadowRoot!.querySelectorAll(".lq-opt") as NodeListOf<HTMLButtonElement>;
    opts[0].click();
    await el.updateComplete;
    expect(opts[1].disabled).toBe(true);
    el.remove();
  });
});
