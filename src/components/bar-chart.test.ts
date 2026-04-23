import { describe, it, expect, beforeAll, vi } from "vitest";
import { defineOnce } from "../core/index.js";
import { CeBarChart } from "./bar-chart.js";

beforeAll(() => defineOnce("ce-bar-chart", CeBarChart));

function widths(el: CeBarChart): number[] {
  return Array.from(el.shadowRoot!.querySelectorAll(".ce-bar-fill")).map((f) =>
    Number((f as HTMLElement).style.width.replace("%", ""))
  );
}

describe("<ce-bar-chart>", () => {
  it("renders one row per data entry", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.data = [
      { label: "A", value: 10 },
      { label: "B", value: 20 },
      { label: "C", value: 5 },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll(".ce-bar-row").length).toBe(3);
    el.remove();
  });

  it("auto-scales so the max row is 100%", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.data = [
      { label: "A", value: 10 },
      { label: "B", value: 20 },
      { label: "C", value: 5 },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    const w = widths(el);
    expect(w[1]).toBe(100);
    expect(w[0]).toBe(50);
    expect(w[2]).toBe(25);
    el.remove();
  });

  it("honors explicit max", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.max = 100;
    el.data = [{ label: "A", value: 50 }];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(widths(el)[0]).toBe(50);
    el.remove();
  });

  it("clamps values to 100% when they exceed max", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.max = 100;
    el.data = [{ label: "A", value: 150 }];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(widths(el)[0]).toBe(100);
    el.remove();
  });

  it("applies per-row color override when provided", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.data = [
      { label: "A", value: 10, color: "green" },
      { label: "B", value: 10, color: "red" },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    const fills = el.shadowRoot!.querySelectorAll(".ce-bar-fill");
    expect(fills[0].classList.contains("c-green")).toBe(true);
    expect(fills[1].classList.contains("c-red")).toBe(true);
    el.remove();
  });

  it("renders meta label when provided", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.data = [{ label: "A", value: 10, meta: "$8.2B" }];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-bar-meta")?.textContent).toBe("$8.2B");
    el.remove();
  });

  it("sets ARIA progressbar role per row", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.data = [{ label: "A", value: 10 }];
    document.body.appendChild(el);
    await el.updateComplete;
    const role = el.shadowRoot!.querySelector('[role="progressbar"]');
    expect(role?.getAttribute("aria-valuenow")).toBe("10");
    expect(role?.getAttribute("aria-label")).toBe("A");
    el.remove();
  });

  it("parses `data` from a JSON attribute set before connect", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    const rows = [
      { label: "A", value: 10 },
      { label: "B", value: 20 },
    ];
    el.setAttribute("data", JSON.stringify(rows));
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.data).toEqual(rows);
    expect(el.shadowRoot!.querySelectorAll(".ce-bar-row").length).toBe(2);
    el.remove();
  });

  it("falls back to [] and warns when `data` attribute is invalid JSON", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.setAttribute("data", "not json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.data).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    el.remove();
  });
});
