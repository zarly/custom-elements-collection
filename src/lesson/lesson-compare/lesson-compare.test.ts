import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { LessonCompare } from "./lesson-compare.js";

beforeAll(() => defineOnce("lesson-compare", LessonCompare));

describe("<lesson-compare>", () => {
  it("renders two columns", async () => {
    const el = document.createElement("lesson-compare") as LessonCompare;
    document.body.appendChild(el);
    await el.updateComplete;
    const cols = el.shadowRoot!.querySelectorAll(".lc-col");
    expect(cols.length).toBe(2);
    el.remove();
  });

  it("left slot content assigned to left column", async () => {
    const el = document.createElement("lesson-compare") as LessonCompare;
    const left = document.createElement("div");
    left.slot = "left";
    left.textContent = "Left content";
    el.appendChild(left);
    document.body.appendChild(el);
    await el.updateComplete;
    const leftSlot = el.shadowRoot!.querySelector("slot[name='left']");
    expect(leftSlot).not.toBeNull();
    el.remove();
  });

  it("right slot content assigned to right column", async () => {
    const el = document.createElement("lesson-compare") as LessonCompare;
    const right = document.createElement("div");
    right.slot = "right";
    right.textContent = "Right content";
    el.appendChild(right);
    document.body.appendChild(el);
    await el.updateComplete;
    const rightSlot = el.shadowRoot!.querySelector("slot[name='right']");
    expect(rightSlot).not.toBeNull();
    el.remove();
  });

  it("left-label and right-label appear in headers", async () => {
    const el = document.createElement("lesson-compare") as LessonCompare;
    el.leftLabel = "Before";
    el.rightLabel = "After";
    document.body.appendChild(el);
    await el.updateComplete;
    const labels = el.shadowRoot!.querySelectorAll(".lc-label");
    const labelTexts = Array.from(labels).map((l) => l.textContent?.trim());
    expect(labelTexts).toContain("Before");
    expect(labelTexts).toContain("After");
    el.remove();
  });

  it("mode reflects on host", async () => {
    const el = document.createElement("lesson-compare") as LessonCompare;
    el.mode = "correct-wrong";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("mode")).toBe("correct-wrong");
    el.remove();
  });

  it("default mode is neutral", async () => {
    const el = document.createElement("lesson-compare") as LessonCompare;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.mode).toBe("neutral");
    el.remove();
  });

  it("before-after mode reflects on host", async () => {
    const el = document.createElement("lesson-compare") as LessonCompare;
    el.mode = "before-after";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("mode")).toBe("before-after");
    el.remove();
  });
});
