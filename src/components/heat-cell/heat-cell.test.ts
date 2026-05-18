import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeHeatCell } from "./heat-cell.js";

beforeAll(() => defineOnce("ce-heat-cell", CeHeatCell));

describe("<ce-heat-cell>", () => {
  it("renders standalone when not inside ce-heat-row", async () => {
    const el = document.createElement("ce-heat-cell") as CeHeatCell;
    el.textContent = "X";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.hasAttribute("data-standalone")).toBe(true);
    el.remove();
  });

  it("defaults tone to 3", async () => {
    const el = document.createElement("ce-heat-cell") as CeHeatCell;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.tone).toBe(3);
    el.remove();
  });

  it("reflects tone attribute", async () => {
    const el = document.createElement("ce-heat-cell") as CeHeatCell;
    el.setAttribute("tone", "5");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.tone).toBe(5);
    el.remove();
  });

  it("reflects title attribute", async () => {
    const el = document.createElement("ce-heat-cell") as CeHeatCell;
    el.setAttribute("title", "Hello tooltip");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.title).toBe("Hello tooltip");
    el.remove();
  });

  it("toneToAlpha maps 1 → 0.05 and 5 → 0.55", () => {
    expect(CeHeatCell.toneToAlpha(1)).toBeCloseTo(0.05);
    expect(CeHeatCell.toneToAlpha(5)).toBeCloseTo(0.55);
  });

  it("toneToAlpha maps 3 → 0.30", () => {
    expect(CeHeatCell.toneToAlpha(3)).toBeCloseTo(0.30);
  });

  it("applies blue palette background in standalone mode based on tone", async () => {
    const el = document.createElement("ce-heat-cell") as CeHeatCell;
    el.tone = 5;
    document.body.appendChild(el);
    await el.updateComplete;
    // Should contain 0.55 in background
    expect(el.style.background).toContain("0.55");
    el.remove();
  });

  it("renders display:contents (nothing) when inside ce-heat-row", async () => {
    const row = document.createElement("ce-heat-row");
    const cell = document.createElement("ce-heat-cell") as CeHeatCell;
    cell.textContent = "A";
    row.appendChild(cell);
    document.body.appendChild(row);
    await cell.updateComplete;
    expect(cell.hasAttribute("data-standalone")).toBe(false);
    row.remove();
  });
});
