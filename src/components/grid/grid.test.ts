import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeGrid } from "./grid.js";

beforeAll(() => defineOnce("ce-grid", CeGrid));

describe("<ce-grid>", () => {
  it("defaults to cols=3", async () => {
    const el = document.createElement("ce-grid") as CeGrid;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("cols")).toBe("3");
    el.remove();
  });

  it("reflects cols attribute", async () => {
    const el = document.createElement("ce-grid") as CeGrid;
    el.cols = "4";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("cols")).toBe("4");
    el.remove();
  });

  it("sets --ce-grid-min CSS var when min property changes", async () => {
    const el = document.createElement("ce-grid") as CeGrid;
    el.min = 320;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.style.getPropertyValue("--ce-grid-min")).toBe("320px");
    el.remove();
  });

  it("reflects auto boolean", async () => {
    const el = document.createElement("ce-grid") as CeGrid;
    el.auto = true;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.hasAttribute("auto")).toBe(true);
    el.remove();
  });

  it("projects children via default slot", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-grid cols="2"><span>a</span><span>b</span></ce-grid>`;
    document.body.appendChild(host);
    const grid = host.querySelector("ce-grid") as CeGrid;
    await grid.updateComplete;
    const slot = grid.shadowRoot!.querySelector("slot")!;
    const assigned = slot.assignedNodes();
    expect(assigned.some((n) => n.textContent === "a")).toBe(true);
    expect(assigned.some((n) => n.textContent === "b")).toBe(true);
    host.remove();
  });
});
