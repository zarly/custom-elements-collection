import { describe, it, expect, beforeAll, vi } from "vitest";
import { defineOnce } from "../core/index.js";
import { CeHeatmap } from "./heatmap.js";

beforeAll(() => defineOnce("ce-heatmap", CeHeatmap));

describe("<ce-heatmap>", () => {
  it("renders a table with R+1 rows (header + data) and C+1 cols (label + cells)", async () => {
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.rows = ["a", "b"];
    el.cols = ["x", "y", "z"];
    el.data = [[1, 2, 3], [4, 5, 6]];
    document.body.appendChild(el);
    await el.updateComplete;
    const trs = el.shadowRoot!.querySelectorAll("tr");
    expect(trs.length).toBe(3);
    const firstHead = trs[0].querySelectorAll("th");
    expect(firstHead.length).toBe(4);
    const firstDataRow = trs[1];
    expect(firstDataRow.querySelectorAll("th").length).toBe(1);
    expect(firstDataRow.querySelectorAll("td").length).toBe(3);
    el.remove();
  });

  it("auto-detects max when not set", async () => {
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.rows = ["a"];
    el.cols = ["x"];
    el.data = [[7]];
    document.body.appendChild(el);
    await el.updateComplete;
    const td = el.shadowRoot!.querySelector("td") as HTMLElement;
    // The single cell should be max → highest alpha = 0.55
    expect(td.style.background).toContain("0.55");
    el.remove();
  });

  it("scales alpha from min to max", async () => {
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.rows = ["r"];
    el.cols = ["a", "b"];
    el.data = [[0, 10]];
    el.max = 10;
    document.body.appendChild(el);
    await el.updateComplete;
    const tds = el.shadowRoot!.querySelectorAll("td");
    expect((tds[0] as HTMLElement).style.background).toContain("0.05");
    expect((tds[1] as HTMLElement).style.background).toContain("0.55");
    el.remove();
  });

  it("uses red palette when set", async () => {
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.palette = "red";
    el.rows = ["r"];
    el.cols = ["a"];
    el.data = [[5]];
    document.body.appendChild(el);
    await el.updateComplete;
    const td = el.shadowRoot!.querySelector("td") as HTMLElement;
    expect(td.style.background).toContain("248, 81, 73");
    el.remove();
  });

  it("renders col headers", async () => {
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.rows = [];
    el.cols = ["alpha", "beta"];
    el.data = [];
    document.body.appendChild(el);
    await el.updateComplete;
    const ths = el.shadowRoot!.querySelectorAll("thead th");
    expect(ths[1].textContent).toBe("alpha");
    expect(ths[2].textContent).toBe("beta");
    el.remove();
  });

  it("parses `rows` from a JSON attribute set before connect", async () => {
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.setAttribute("rows", JSON.stringify(["r1", "r2"]));
    el.cols = ["c1"];
    el.data = [[1], [2]];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.rows).toEqual(["r1", "r2"]);
    expect(el.shadowRoot!.querySelectorAll("tbody tr").length).toBe(2);
    el.remove();
  });

  it("falls back to [] and warns when `rows` attribute is invalid JSON", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.setAttribute("rows", "not json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.rows).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    el.remove();
  });

  it("parses `cols` from a JSON attribute set before connect", async () => {
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.setAttribute("cols", JSON.stringify(["x", "y", "z"]));
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.cols).toEqual(["x", "y", "z"]);
    // header row: 1 empty label cell + 3 col headers = 4 th cells
    const headerThs = el.shadowRoot!.querySelectorAll("thead th");
    expect(headerThs.length).toBe(4);
    el.remove();
  });

  it("falls back to [] and warns when `cols` attribute is invalid JSON", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.setAttribute("cols", "not json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.cols).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    el.remove();
  });

  it("parses `data` from a JSON attribute set before connect", async () => {
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.rows = ["a", "b"];
    el.cols = ["x", "y"];
    el.setAttribute("data", JSON.stringify([[1, 2], [3, 4]]));
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.data).toEqual([[1, 2], [3, 4]]);
    expect(el.shadowRoot!.querySelectorAll("tbody td").length).toBe(4);
    el.remove();
  });

  it("falls back to [] and warns when `data` attribute is invalid JSON", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.setAttribute("data", "not json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.data).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    el.remove();
  });
});
