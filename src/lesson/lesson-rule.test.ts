import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../core/index.js";
import { LessonRule } from "./lesson-rule.js";

beforeAll(() => defineOnce("lesson-rule", LessonRule));

describe("<lesson-rule>", () => {
  it("renders number and title", async () => {
    const el = document.createElement("lesson-rule") as LessonRule;
    el.number = "1";
    el.title = "Articles use 'a' before consonant sounds";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".lr-num")?.textContent).toBe("1");
    expect(el.shadowRoot!.querySelector(".lr-title")?.textContent).toBe(
      "Articles use 'a' before consonant sounds"
    );
    el.remove();
  });

  it("omits number badge when number empty", async () => {
    const el = document.createElement("lesson-rule") as LessonRule;
    el.title = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".lr-num")).toBeNull();
    el.remove();
  });

  it("reflects golden boolean", async () => {
    const el = document.createElement("lesson-rule") as LessonRule;
    el.golden = true;
    el.title = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.hasAttribute("golden")).toBe(true);
    el.remove();
  });

  it("renders body via default slot", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<lesson-rule number="1" title="x"><p>Body content</p></lesson-rule>`;
    document.body.appendChild(host);
    const el = host.querySelector("lesson-rule") as LessonRule;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("slot")).not.toBeNull();
    host.remove();
  });
});
