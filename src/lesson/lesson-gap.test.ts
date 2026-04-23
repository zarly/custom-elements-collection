import { describe, it, expect, beforeAll, vi } from "vitest";
import { defineOnce } from "../core/index.js";
import { LessonGap } from "./lesson-gap.js";

beforeAll(() => defineOnce("lesson-gap", LessonGap));

describe("<lesson-gap>", () => {
  it("renders prompt with blank placeholder", async () => {
    const el = document.createElement("lesson-gap") as LessonGap;
    el.prompt = "I want ___ apple";
    el.options = ["a", "an", "the"];
    el.correct = "an";
    document.body.appendChild(el);
    await el.updateComplete;
    const blank = el.shadowRoot!.querySelector(".lg-blank");
    expect(blank?.textContent?.trim()).toBe("___");
    el.remove();
  });

  it("renders one button per option", async () => {
    const el = document.createElement("lesson-gap") as LessonGap;
    el.prompt = "_";
    el.options = ["a", "b", "c"];
    el.correct = "a";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll(".lg-opt").length).toBe(3);
    el.remove();
  });

  it("flashes correct + emits answer event on correct pick", async () => {
    const el = document.createElement("lesson-gap") as LessonGap;
    el.prompt = "x ___ y";
    el.options = ["a", "b"];
    el.correct = "a";
    document.body.appendChild(el);
    await el.updateComplete;
    let detail: any = null;
    el.addEventListener("lesson-gap-answer", (e) => (detail = (e as CustomEvent).detail));
    const btn = el.shadowRoot!.querySelectorAll(".lg-opt")[0] as HTMLButtonElement;
    btn.click();
    await el.updateComplete;
    expect(detail).toEqual({ value: "a", correct: true });
    expect(btn.classList.contains("correct")).toBe(true);
    expect(el.shadowRoot!.querySelector(".lg-feedback.ok")).not.toBeNull();
    el.remove();
  });

  it("flashes wrong + emits with correct=false on wrong pick", async () => {
    const el = document.createElement("lesson-gap") as LessonGap;
    el.prompt = "x ___ y";
    el.options = ["a", "b"];
    el.correct = "a";
    document.body.appendChild(el);
    await el.updateComplete;
    let detail: any = null;
    el.addEventListener("lesson-gap-answer", (e) => (detail = (e as CustomEvent).detail));
    const btn = el.shadowRoot!.querySelectorAll(".lg-opt")[1] as HTMLButtonElement;
    btn.click();
    await el.updateComplete;
    expect(detail).toEqual({ value: "b", correct: false });
    expect(btn.classList.contains("wrong")).toBe(true);
    expect(el.shadowRoot!.querySelector(".lg-feedback.bad")).not.toBeNull();
    el.remove();
  });

  it("disables further picks after one is selected", async () => {
    const el = document.createElement("lesson-gap") as LessonGap;
    el.prompt = "x ___ y";
    el.options = ["a", "b"];
    el.correct = "a";
    document.body.appendChild(el);
    await el.updateComplete;
    const btns = el.shadowRoot!.querySelectorAll(".lg-opt") as NodeListOf<HTMLButtonElement>;
    btns[0].click();
    await el.updateComplete;
    expect(btns[1].disabled).toBe(true);
    el.remove();
  });

  it("parses options from a JSON attribute set before connection", async () => {
    const el = document.createElement("lesson-gap") as LessonGap;
    el.prompt = "x ___ y";
    el.correct = "a";
    el.setAttribute("options", JSON.stringify(["a", "b", "c"]));
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.options).toEqual(["a", "b", "c"]);
    expect(el.shadowRoot!.querySelectorAll(".lg-opt").length).toBe(3);
    el.remove();
  });

  it("falls back + warns when the options attribute is malformed JSON", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = document.createElement("lesson-gap") as LessonGap;
    el.prompt = "x ___ y";
    el.correct = "a";
    el.setAttribute("options", "not json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.options).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    el.remove();
  });

  it("reset() clears the picked state", async () => {
    const el = document.createElement("lesson-gap") as LessonGap;
    el.prompt = "x ___ y";
    el.options = ["a"];
    el.correct = "a";
    document.body.appendChild(el);
    await el.updateComplete;
    (el.shadowRoot!.querySelectorAll(".lg-opt")[0] as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".lg-feedback")).not.toBeNull();
    el.reset();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".lg-feedback")).toBeNull();
    el.remove();
  });
});
