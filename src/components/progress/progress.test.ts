import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeProgress } from "./progress.js";

beforeAll(() => defineOnce("ce-progress", CeProgress));

describe("<ce-progress>", () => {
  function percent(el: CeProgress): number {
    const fill = el.shadowRoot!.querySelector(".ce-progress__fill") as HTMLElement;
    return Number(fill.style.width.replace("%", ""));
  }

  it("renders 0% by default", async () => {
    const el = document.createElement("ce-progress") as CeProgress;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(percent(el)).toBe(0);
    el.remove();
  });

  it("computes percentage from value/max", async () => {
    const el = document.createElement("ce-progress") as CeProgress;
    el.value = 25;
    el.max = 50;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(percent(el)).toBe(50);
    el.remove();
  });

  it("clamps above 100%", async () => {
    const el = document.createElement("ce-progress") as CeProgress;
    el.value = 200;
    el.max = 100;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(percent(el)).toBe(100);
    el.remove();
  });

  it("clamps below 0%", async () => {
    const el = document.createElement("ce-progress") as CeProgress;
    el.value = -5;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(percent(el)).toBe(0);
    el.remove();
  });

  it("sets ARIA progressbar attributes", async () => {
    const el = document.createElement("ce-progress") as CeProgress;
    el.value = 42;
    document.body.appendChild(el);
    await el.updateComplete;
    const role = el.shadowRoot!.querySelector('[role="progressbar"]');
    expect(role).not.toBeNull();
    expect(role?.getAttribute("aria-valuemax")).toBe("100");
    expect(role?.getAttribute("aria-valuenow")).toBe("42");
    el.remove();
  });

  it("shows value text when show-value set", async () => {
    const el = document.createElement("ce-progress") as CeProgress;
    el.value = 60;
    el.showValue = true;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-progress__value")?.textContent).toBe("60%");
    el.remove();
  });

  it("supports indeterminate mode and sets aria-busy", async () => {
    const el = document.createElement("ce-progress") as CeProgress;
    el.indeterminate = true;
    document.body.appendChild(el);
    await el.updateComplete;
    const role = el.shadowRoot!.querySelector('[role="progressbar"]');
    expect(role?.getAttribute("aria-busy")).toBe("true");
    expect(el.hasAttribute("indeterminate")).toBe(true);
    el.remove();
  });
});
