import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../core/index.js";
import { LessonFrame } from "./lesson-frame.js";

beforeAll(() => defineOnce("lesson-frame", LessonFrame));

describe("<lesson-frame>", () => {
  it("renders title and meta", async () => {
    const el = document.createElement("lesson-frame") as LessonFrame;
    el.title = "Lesson 1: Articles";
    el.meta = "Beginner · 12 min";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".lf-title")?.textContent).toBe("Lesson 1: Articles");
    expect(el.shadowRoot!.querySelector(".lf-meta")?.textContent).toBe("Beginner · 12 min");
    el.remove();
  });

  it("clamps progress to [0, 100]", async () => {
    const el = document.createElement("lesson-frame") as LessonFrame;
    el.progress = 150;
    document.body.appendChild(el);
    await el.updateComplete;
    const fill = el.shadowRoot!.querySelector(".lf-progress-fill") as HTMLElement;
    expect(fill.style.width).toBe("100%");
    el.progress = -10;
    await el.updateComplete;
    expect(fill.style.width).toBe("0%");
    el.remove();
  });

  it("renders progressbar with correct ARIA attributes", async () => {
    const el = document.createElement("lesson-frame") as LessonFrame;
    el.progress = 42;
    document.body.appendChild(el);
    await el.updateComplete;
    const role = el.shadowRoot!.querySelector('[role="progressbar"]');
    expect(role?.getAttribute("aria-valuenow")).toBe("42");
    expect(role?.getAttribute("aria-valuemax")).toBe("100");
    el.remove();
  });

  it("provides default and header slots", async () => {
    const el = document.createElement("lesson-frame") as LessonFrame;
    document.body.appendChild(el);
    await el.updateComplete;
    const names = Array.from(el.shadowRoot!.querySelectorAll("slot")).map(
      (s) => s.getAttribute("name") ?? "default"
    );
    expect(names).toContain("default");
    expect(names).toContain("header");
    el.remove();
  });
});
