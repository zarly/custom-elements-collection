import { describe, it, expect, beforeAll, vi } from "vitest";
import { defineOnce } from "../core/index.js";
import { CeFlow } from "./flow.js";

beforeAll(() => defineOnce("ce-flow", CeFlow));

describe("<ce-flow>", () => {
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

  it("falls back to [] and warns when `steps` attribute is invalid JSON", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = document.createElement("ce-flow") as CeFlow;
    el.setAttribute("steps", "not json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.steps).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    el.remove();
  });
});
