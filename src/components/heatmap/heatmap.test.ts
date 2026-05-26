import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeHeatmap } from "./heatmap.js";
import { CeHeatRow } from "../heat-row/heat-row.js";
import { CeHeatCell } from "../heat-cell/heat-cell.js";

beforeAll(() => {
  defineOnce("ce-heatmap", CeHeatmap);
  defineOnce("ce-heat-row", CeHeatRow);
  defineOnce("ce-heat-cell", CeHeatCell);
});

// ─── Regression: existing number[][] API unchanged ──────────────────────────

describe("<ce-heatmap> — JSON number[][] (regression)", () => {
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

  it("falls back to [] when `rows` attribute is invalid JSON", async () => {
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.setAttribute("rows", "not json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.rows).toEqual([]);
    el.remove();
  });

  it("parses `cols` from a JSON attribute set before connect", async () => {
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.setAttribute("cols", JSON.stringify(["x", "y", "z"]));
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.cols).toEqual(["x", "y", "z"]);
    const headerThs = el.shadowRoot!.querySelectorAll("thead th");
    expect(headerThs.length).toBe(4);
    el.remove();
  });

  it("falls back to [] when `cols` attribute is invalid JSON", async () => {
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.setAttribute("cols", "not json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.cols).toEqual([]);
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

  it("falls back to [] when `data` attribute is invalid JSON", async () => {
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.setAttribute("data", "not json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.data).toEqual([]);
    el.remove();
  });
});

// ─── New: CellInput object shape ─────────────────────────────────────────────

describe("<ce-heatmap> — CellInput object cells", () => {
  it("renders cells from CellInput objects with value", async () => {
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.rows = ["r"];
    el.cols = ["a", "b"];
    el.data = [[{ value: 0 }, { value: 10 }]];
    el.max = 10;
    document.body.appendChild(el);
    await el.updateComplete;
    const tds = el.shadowRoot!.querySelectorAll("td");
    expect(tds.length).toBe(2);
    expect((tds[0] as HTMLElement).style.background).toContain("0.05");
    expect((tds[1] as HTMLElement).style.background).toContain("0.55");
    el.remove();
  });

  it("tone override bypasses value-based alpha", async () => {
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.rows = ["r"];
    el.cols = ["a"];
    // value=0 would normally produce alpha=0.05; tone=5 should produce alpha=0.55
    el.data = [[{ value: 0, tone: 5 }]];
    el.max = 100;
    document.body.appendChild(el);
    await el.updateComplete;
    const td = el.shadowRoot!.querySelector("td") as HTMLElement;
    expect(td.style.background).toContain("0.55");
    el.remove();
  });

  it("title attribute is set on td from CellInput.title", async () => {
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.rows = ["r"];
    el.cols = ["a"];
    el.data = [[{ value: 5, title: "Important cell" }]];
    document.body.appendChild(el);
    await el.updateComplete;
    const td = el.shadowRoot!.querySelector("td") as HTMLElement;
    expect(td.getAttribute("title")).toBe("Important cell");
    el.remove();
  });

  it("mixed row: plain numbers and CellInput objects", async () => {
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.rows = ["r"];
    el.cols = ["a", "b"];
    el.data = [[5, { value: 5, tone: 1 }]];
    el.max = 10;
    document.body.appendChild(el);
    await el.updateComplete;
    const tds = el.shadowRoot!.querySelectorAll("td");
    expect(tds.length).toBe(2);
    // cell[0]: number 5/10 → alpha 0.05 + 0.5*0.5 = 0.30
    expect((tds[0] as HTMLElement).style.background).toContain("0.3");
    // cell[1]: tone=1 → alpha 0.05
    expect((tds[1] as HTMLElement).style.background).toContain("0.05");
    el.remove();
  });
});

// ─── New: slot mode ──────────────────────────────────────────────────────────

describe("<ce-heatmap> — slot mode", () => {
  it("renders rows from ce-heat-row + ce-heat-cell children", async () => {
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.setAttribute("cols", JSON.stringify(["Jan", "Feb"]));

    const row = document.createElement("ce-heat-row");
    row.setAttribute("label", "Revenue");
    const c1 = document.createElement("ce-heat-cell");
    c1.setAttribute("tone", "2");
    c1.textContent = "12";
    const c2 = document.createElement("ce-heat-cell");
    c2.setAttribute("tone", "4");
    c2.textContent = "38";
    row.appendChild(c1);
    row.appendChild(c2);
    el.appendChild(row);

    document.body.appendChild(el);
    await el.updateComplete;

    const trs = el.shadowRoot!.querySelectorAll("tbody tr");
    expect(trs.length).toBe(1);
    const tds = trs[0].querySelectorAll("td");
    expect(tds.length).toBe(2);
    expect((tds[0] as HTMLElement).textContent?.trim()).toBe("12");
    expect((tds[1] as HTMLElement).textContent?.trim()).toBe("38");
    el.remove();
  });

  it("slot mode uses tone from ce-heat-cell to determine color", async () => {
    const el = document.createElement("ce-heatmap") as CeHeatmap;

    const row = document.createElement("ce-heat-row");
    row.setAttribute("label", "R");
    const cell = document.createElement("ce-heat-cell");
    cell.setAttribute("tone", "5");
    cell.textContent = "X";
    row.appendChild(cell);
    el.appendChild(row);

    document.body.appendChild(el);
    await el.updateComplete;

    const td = el.shadowRoot!.querySelector("tbody td") as HTMLElement;
    expect(td.style.background).toContain("0.55");
    el.remove();
  });

  it("slot mode row label appears in th", async () => {
    const el = document.createElement("ce-heatmap") as CeHeatmap;

    const row = document.createElement("ce-heat-row");
    row.setAttribute("label", "Errors");
    const cell = document.createElement("ce-heat-cell");
    cell.setAttribute("tone", "3");
    cell.textContent = "7";
    row.appendChild(cell);
    el.appendChild(row);

    document.body.appendChild(el);
    await el.updateComplete;

    const rowLabelTh = el.shadowRoot!.querySelector("tbody th");
    expect(rowLabelTh?.textContent?.trim()).toBe("Errors");
    el.remove();
  });

  it("data non-empty takes priority over slot children (CDR-005 resolution order)", async () => {
    const el = document.createElement("ce-heatmap") as CeHeatmap;
    el.rows = ["JSON row"];
    el.cols = ["c"];
    el.data = [[42]];

    const row = document.createElement("ce-heat-row");
    row.setAttribute("label", "Slot row");
    const cell = document.createElement("ce-heat-cell");
    cell.textContent = "99";
    row.appendChild(cell);
    el.appendChild(row);

    document.body.appendChild(el);
    await el.updateComplete;

    // JSON row should win
    const th = el.shadowRoot!.querySelector("tbody th");
    expect(th?.textContent?.trim()).toBe("JSON row");
    const td = el.shadowRoot!.querySelector("tbody td") as HTMLElement;
    expect(td.textContent?.trim()).toBe("42");
    el.remove();
  });
});

// ─── Snapshot parity: JSON number[][] vs equivalent slot mode ────────────────

describe("<ce-heatmap> — snapshot parity (JSON vs slot mode)", () => {
  it("JSON number[][] and slot mode produce identical background colors for equal data", async () => {
    // JSON version
    const jsonEl = document.createElement("ce-heatmap") as CeHeatmap;
    jsonEl.rows = ["Row"];
    jsonEl.cols = ["A", "B", "C"];
    jsonEl.data = [[1, 5, 10]];
    jsonEl.max = 10;
    document.body.appendChild(jsonEl);
    await jsonEl.updateComplete;
    const jsonTds = jsonEl.shadowRoot!.querySelectorAll("tbody td");
    const jsonBgs = Array.from(jsonTds).map((td) => (td as HTMLElement).style.background);

    // Slot version with matching numeric values (tone derived from value/max ratio)
    const slotEl = document.createElement("ce-heatmap") as CeHeatmap;
    slotEl.setAttribute("cols", JSON.stringify(["A", "B", "C"]));
    slotEl.max = 10;
    const row = document.createElement("ce-heat-row");
    row.setAttribute("label", "Row");
    [1, 5, 10].forEach((v) => {
      const cell = document.createElement("ce-heat-cell");
      // No tone attr — let the parent scale by value just like JSON mode.
      cell.textContent = String(v);
      row.appendChild(cell);
    });
    slotEl.appendChild(row);
    document.body.appendChild(slotEl);
    await slotEl.updateComplete;
    const slotTds = slotEl.shadowRoot!.querySelectorAll("tbody td");
    const slotBgs = Array.from(slotTds).map((td) => (td as HTMLElement).style.background);

    expect(slotBgs).toEqual(jsonBgs);
    jsonEl.remove();
    slotEl.remove();
  });
});
