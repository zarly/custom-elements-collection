import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeHeatRow } from "./heat-row.js";
import { CeHeatCell } from "../heat-cell/heat-cell.js";

beforeAll(() => {
  defineOnce("ce-heat-row", CeHeatRow);
  defineOnce("ce-heat-cell", CeHeatCell);
});

describe("<ce-heat-row>", () => {
  it("renders standalone when not inside ce-heatmap", async () => {
    const el = document.createElement("ce-heat-row") as CeHeatRow;
    el.setAttribute("label", "Row A");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.hasAttribute("data-standalone")).toBe(true);
    el.remove();
  });

  it("displays label text in standalone mode", async () => {
    const el = document.createElement("ce-heat-row") as CeHeatRow;
    el.setAttribute("label", "Revenue");
    document.body.appendChild(el);
    await el.updateComplete;
    // ce-heat-row uses Shadow DOM for styles; label span is in shadow root
    const root = el.shadowRoot ?? el;
    expect(root.querySelector(".ce-hr-label")?.textContent?.trim()).toBe("Revenue");
    el.remove();
  });

  it("defaults label to empty string", async () => {
    const el = document.createElement("ce-heat-row") as CeHeatRow;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.label).toBe("");
    el.remove();
  });

  it("renders display:contents (nothing) when inside ce-heatmap", async () => {
    const map = document.createElement("ce-heatmap");
    const row = document.createElement("ce-heat-row") as CeHeatRow;
    row.setAttribute("label", "Test");
    map.appendChild(row);
    document.body.appendChild(map);
    await row.updateComplete;
    expect(row.hasAttribute("data-standalone")).toBe(false);
    map.remove();
  });

  it("accepts ce-heat-cell children in slot", async () => {
    const el = document.createElement("ce-heat-row") as CeHeatRow;
    el.setAttribute("label", "Metrics");
    const cell1 = document.createElement("ce-heat-cell") as CeHeatCell;
    cell1.setAttribute("tone", "2");
    cell1.textContent = "A";
    const cell2 = document.createElement("ce-heat-cell") as CeHeatCell;
    cell2.setAttribute("tone", "4");
    cell2.textContent = "B";
    el.appendChild(cell1);
    el.appendChild(cell2);
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.querySelectorAll("ce-heat-cell").length).toBe(2);
    el.remove();
  });

  it("reflects label attribute", async () => {
    const el = document.createElement("ce-heat-row") as CeHeatRow;
    el.setAttribute("label", "Series A");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.label).toBe("Series A");
    el.remove();
  });
});
