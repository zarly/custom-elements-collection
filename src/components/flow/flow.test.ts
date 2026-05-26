import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeFlow } from "./flow.js";
import { CeFlowStep } from "../flow-step/flow-step.js";

beforeAll(() => {
  defineOnce("ce-flow", CeFlow);
  defineOnce("ce-flow-step", CeFlowStep);
});

const colorClassFrom = (el: Element): string =>
  [...el.classList].find((c) => c.startsWith("c-")) ?? "";

// ---------------------------------------------------------------------------
// JSON mode (existing behaviour preserved per CDR-008)
// ---------------------------------------------------------------------------
describe("<ce-flow> — JSON mode", () => {
  it("renders one box per step and arrows between them", async () => {
    const el = document.createElement("ce-flow") as CeFlow;
    el.steps = [
      { title: "A" },
      { title: "B" },
      { title: "C" },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    const steps = el.shadowRoot!.querySelectorAll(".ce-flow-step");
    const arrows = el.shadowRoot!.querySelectorAll(".ce-flow-arrow");
    expect(steps.length).toBe(3);
    expect(arrows.length).toBe(2);
    el.remove();
  });

  it("renders captions when provided", async () => {
    const el = document.createElement("ce-flow") as CeFlow;
    el.steps = [{ title: "Ingest", caption: "raw data" }];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-flow-caption")?.textContent).toBe(
      "raw data"
    );
    el.remove();
  });

  it("applies color class on step", async () => {
    const el = document.createElement("ce-flow") as CeFlow;
    el.steps = [{ title: "x", color: "green" }];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(
      el.shadowRoot!.querySelector(".ce-flow-step")?.classList.contains("c-green")
    ).toBe(true);
    el.remove();
  });

  it("uses custom arrow when provided", async () => {
    const el = document.createElement("ce-flow") as CeFlow;
    el.arrow = "⇒";
    el.steps = [{ title: "A" }, { title: "B" }];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(
      el.shadowRoot!.querySelector(".ce-flow-arrow")?.textContent?.trim()
    ).toBe("⇒");
    el.remove();
  });

  it("switches arrow to ↓ in vertical mode with default arrow", async () => {
    const el = document.createElement("ce-flow") as CeFlow;
    el.vertical = true;
    el.steps = [{ title: "A" }, { title: "B" }];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(
      el.shadowRoot!.querySelector(".ce-flow-arrow")?.textContent?.trim()
    ).toBe("↓");
    el.remove();
  });

  it("reflects vertical attribute", async () => {
    const el = document.createElement("ce-flow") as CeFlow;
    el.vertical = true;
    el.steps = [];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.hasAttribute("vertical")).toBe(true);
    el.remove();
  });

  it("parses `steps` from a JSON attribute set before connect", async () => {
    const el = document.createElement("ce-flow") as CeFlow;
    const steps = [{ title: "A" }, { title: "B" }, { title: "C" }];
    el.setAttribute("steps", JSON.stringify(steps));
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.steps).toEqual(steps);
    expect(el.shadowRoot!.querySelectorAll(".ce-flow-step").length).toBe(3);
    expect(el.shadowRoot!.querySelectorAll(".ce-flow-arrow").length).toBe(2);
    el.remove();
  });

  it("falls back to [] when `steps` attribute is invalid JSON", async () => {
    const el = document.createElement("ce-flow") as CeFlow;
    el.setAttribute("steps", "not json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.steps).toEqual([]);
    el.remove();
  });
});

// ---------------------------------------------------------------------------
// Slot mode (CDR-005 additive)
// ---------------------------------------------------------------------------
describe("<ce-flow> — slot mode", () => {
  it("renders steps from <ce-flow-step> children when steps prop is empty", async () => {
    const el = document.createElement("ce-flow") as CeFlow;
    for (const [n, title] of [["1", "Alpha"], ["2", "Beta"], ["3", "Gamma"]]) {
      const step = document.createElement("ce-flow-step") as CeFlowStep;
      step.setAttribute("n", n);
      step.setAttribute("title", title);
      el.appendChild(step);
    }
    document.body.appendChild(el);
    await el.updateComplete;
    const steps = el.shadowRoot!.querySelectorAll(".ce-flow-step");
    const arrows = el.shadowRoot!.querySelectorAll(".ce-flow-arrow");
    expect(steps.length).toBe(3);
    expect(arrows.length).toBe(2);
    el.remove();
  });

  it("renders title text from slot children", async () => {
    const el = document.createElement("ce-flow") as CeFlow;
    const step = document.createElement("ce-flow-step") as CeFlowStep;
    step.setAttribute("title", "Discovery");
    el.appendChild(step);
    document.body.appendChild(el);
    await el.updateComplete;
    expect(
      el.shadowRoot!.querySelector(".ce-flow-title")?.textContent?.trim()
    ).toBe("Discovery");
    el.remove();
  });

  it("applies color from slot children", async () => {
    const el = document.createElement("ce-flow") as CeFlow;
    const step = document.createElement("ce-flow-step") as CeFlowStep;
    step.setAttribute("title", "Go");
    step.setAttribute("color", "green");
    el.appendChild(step);
    document.body.appendChild(el);
    await el.updateComplete;
    expect(
      el.shadowRoot!.querySelector(".ce-flow-step")?.classList.contains("c-green")
    ).toBe(true);
    el.remove();
  });

  it("uses vertical arrow in slot mode with vertical attr", async () => {
    const el = document.createElement("ce-flow") as CeFlow;
    el.vertical = true;
    for (const title of ["A", "B"]) {
      const step = document.createElement("ce-flow-step") as CeFlowStep;
      step.setAttribute("title", title);
      el.appendChild(step);
    }
    document.body.appendChild(el);
    await el.updateComplete;
    expect(
      el.shadowRoot!.querySelector(".ce-flow-arrow")?.textContent?.trim()
    ).toBe("↓");
    el.remove();
  });

  it("renders empty state when neither steps prop nor children are provided", async () => {
    const el = document.createElement("ce-flow") as CeFlow;
    document.body.appendChild(el);
    await el.updateComplete;
    // No steps and no children → no .ce-flow-step boxes rendered
    expect(el.shadowRoot!.querySelectorAll(".ce-flow-step").length).toBe(0);
    el.remove();
  });

  it("JSON mode takes priority over slot children when steps is non-empty", async () => {
    const el = document.createElement("ce-flow") as CeFlow;
    el.steps = [{ title: "JSON-A" }, { title: "JSON-B" }];
    // Add a slot child that should be ignored
    const step = document.createElement("ce-flow-step") as CeFlowStep;
    step.setAttribute("title", "Slot-C");
    el.appendChild(step);
    document.body.appendChild(el);
    await el.updateComplete;
    const titles = Array.from(
      el.shadowRoot!.querySelectorAll(".ce-flow-title")
    ).map((t) => t.textContent?.trim());
    // Only JSON steps should appear
    expect(titles).toEqual(["JSON-A", "JSON-B"]);
    el.remove();
  });

  it("ignores non-ce-flow-step children gracefully (CDR-006)", async () => {
    const el = document.createElement("ce-flow") as CeFlow;
    const step = document.createElement("ce-flow-step") as CeFlowStep;
    step.setAttribute("title", "Real");
    el.appendChild(step);
    const div = document.createElement("div");
    div.textContent = "noise";
    el.appendChild(div);
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll(".ce-flow-step").length).toBe(1);
    el.remove();
  });
});

// ---------------------------------------------------------------------------
// Snapshot parity: JSON mode and slot mode must produce identical markup
// ---------------------------------------------------------------------------
describe("<ce-flow> — snapshot parity (CDR-005)", () => {
  it("JSON mode and slot mode produce identical step count and arrow count", async () => {
    const data = [
      { title: "Step A", color: "blue" as const },
      { title: "Step B", color: "green" as const },
      { title: "Step C" },
    ] as const;

    // JSON mode
    const jsonEl = document.createElement("ce-flow") as CeFlow;
    jsonEl.steps = [...data];
    document.body.appendChild(jsonEl);
    await jsonEl.updateComplete;
    const jsonSteps = jsonEl.shadowRoot!.querySelectorAll(".ce-flow-step").length;
    const jsonArrows = jsonEl.shadowRoot!.querySelectorAll(".ce-flow-arrow").length;
    const jsonTitles = Array.from(
      jsonEl.shadowRoot!.querySelectorAll(".ce-flow-title")
    ).map((t) => t.textContent?.trim());
    const jsonColors = Array.from(
      jsonEl.shadowRoot!.querySelectorAll(".ce-flow-step")
    ).map(colorClassFrom);
    jsonEl.remove();

    // Slot mode
    const slotEl = document.createElement("ce-flow") as CeFlow;
    for (const item of data) {
      const step = document.createElement("ce-flow-step") as CeFlowStep;
      step.setAttribute("title", item.title);
      if ("color" in item && item.color) step.setAttribute("color", item.color);
      slotEl.appendChild(step);
    }
    document.body.appendChild(slotEl);
    await slotEl.updateComplete;
    const slotSteps = slotEl.shadowRoot!.querySelectorAll(".ce-flow-step").length;
    const slotArrows = slotEl.shadowRoot!.querySelectorAll(".ce-flow-arrow").length;
    const slotTitles = Array.from(
      slotEl.shadowRoot!.querySelectorAll(".ce-flow-title")
    ).map((t) => t.textContent?.trim());
    const slotColors = Array.from(
      slotEl.shadowRoot!.querySelectorAll(".ce-flow-step")
    ).map(colorClassFrom);
    slotEl.remove();

    expect(slotSteps).toBe(jsonSteps);
    expect(slotArrows).toBe(jsonArrows);
    expect(slotTitles).toEqual(jsonTitles);
    expect(slotColors).toEqual(jsonColors);
  });
});
