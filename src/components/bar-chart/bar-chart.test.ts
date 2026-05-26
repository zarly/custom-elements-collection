import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeBarChart } from "./bar-chart.js";
import { CeBarRow } from "../bar-row/bar-row.js";

beforeAll(() => {
  defineOnce("ce-bar-chart", CeBarChart);
  defineOnce("ce-bar-row", CeBarRow);
});

function widths(el: CeBarChart): number[] {
  return Array.from(el.shadowRoot!.querySelectorAll(".ce-fill")).map((f) =>
    Number((f as HTMLElement).style.width.replace("%", ""))
  );
}

function fills(el: CeBarChart): HTMLElement[] {
  return Array.from(
    el.shadowRoot!.querySelectorAll<HTMLElement>(".ce-fill")
  );
}

function rows(el: CeBarChart): HTMLElement[] {
  return Array.from(
    el.shadowRoot!.querySelectorAll<HTMLElement>(".ce-row")
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
    expect(rows(el).length).toBe(3);
    el.remove();
  });

  it("auto-scales so the largest row is 100%", async () => {
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

  it("honors explicit max and clamps overshoot to 100%", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.max = 100;
    el.data = [
      { label: "A", value: 50 },
      { label: "B", value: 150 },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    const w = widths(el);
    expect(w[0]).toBe(50);
    expect(w[1]).toBe(100);
    el.remove();
  });

  it("renders the empty-state slot when data is empty", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.emptyText = "Nothing here";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(rows(el).length).toBe(0);
    expect(el.shadowRoot!.querySelector(".ce-empty")?.textContent).toBe(
      "Nothing here"
    );
    el.remove();
  });

  it("routes named-token color through resolveColor() to a CSS var", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.data = [
      { label: "A", value: 10, color: "green" },
      { label: "B", value: 10 },
    ];
    el.color = "amber";
    document.body.appendChild(el);
    await el.updateComplete;
    const f = fills(el);
    expect(f[0].style.background).toContain("var(--ce-color-green)");
    expect(f[1].style.background).toContain("var(--ce-color-amber)");
    el.remove();
  });

  it("passes through arbitrary CSS color strings unchanged", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    // Use a `var(...)` token so jsdom doesn't normalise the literal — the
    // assertion is that resolveColor() does NOT wrap it as `var(--ce-color-…)`.
    el.data = [{ label: "A", value: 10, color: "var(--brand)" }];
    document.body.appendChild(el);
    await el.updateComplete;
    const fill = fills(el)[0];
    expect(fill.style.background).toContain("var(--brand)");
    expect(fill.style.background).not.toContain("--ce-color-");
    el.remove();
  });

  it("renders meta text and exposes ARIA progressbar on each row", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.data = [{ label: "A", value: 10, meta: "$8.2B" }];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-meta")?.textContent).toBe("$8.2B");
    const role = el.shadowRoot!.querySelector('[role="progressbar"]');
    expect(role?.getAttribute("aria-valuenow")).toBe("10");
    expect(role?.getAttribute("aria-label")).toBe("A");
    el.remove();
  });

  it("parses `data` from a JSON attribute and falls back on invalid JSON", async () => {
    const ok = document.createElement("ce-bar-chart") as CeBarChart;
    ok.setAttribute(
      "data",
      JSON.stringify([
        { label: "A", value: 10 },
        { label: "B", value: 20 },
      ])
    );
    document.body.appendChild(ok);
    await ok.updateComplete;
    expect(rows(ok).length).toBe(2);
    ok.remove();

    const bad = document.createElement("ce-bar-chart") as CeBarChart;
    bad.setAttribute("data", "not json");
    document.body.appendChild(bad);
    await bad.updateComplete;
    expect(bad.data).toEqual([]);
    bad.remove();
  });

  it("dispatches ce-chart-hover with the row payload on pointerenter", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.data = [
      { label: "A", value: 10 },
      { label: "B", value: 20 },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    const detail = await new Promise<{ kind: string; index: number }>(
      (resolve) => {
        el.addEventListener(
          "ce-chart-hover",
          (e) => resolve((e as CustomEvent).detail),
          { once: true }
        );
        rows(el)[1].dispatchEvent(
          new Event("pointerenter", { bubbles: true })
        );
      }
    );
    expect(detail.kind).toBe("row");
    expect(detail.index).toBe(1);
    el.remove();
  });

  it("dispatches ce-chart-select on click and on Enter key", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.data = [{ label: "A", value: 10 }];
    document.body.appendChild(el);
    await el.updateComplete;

    const seen: number[] = [];
    el.addEventListener("ce-chart-select", (e) => {
      seen.push((e as CustomEvent).detail.index);
    });
    rows(el)[0].click();
    rows(el)[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
    );
    rows(el)[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", bubbles: true })
    );
    expect(seen).toEqual([0, 0]);
    el.remove();
  });

  it("renders gridline ticks at 0/25/50/75/100% when gridlines is enabled", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.gridlines = true;
    el.max = 200;
    el.data = [{ label: "A", value: 100 }];
    document.body.appendChild(el);
    await el.updateComplete;
    const ticks = Array.from(
      el.shadowRoot!.querySelectorAll<HTMLElement>(".ce-grid-tick")
    );
    expect(ticks.length).toBe(5);
    expect(ticks[0].style.left).toBe("0%");
    expect(ticks[ticks.length - 1].style.left).toBe("100%");
    el.remove();
  });

  it("collapses to a sparkline strip with no labels, axis, or tooltip", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.sparkline = true;
    el.gridlines = true;
    el.data = [
      { label: "A", value: 1 },
      { label: "B", value: 4 },
      { label: "C", value: 2 },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(rows(el).length).toBe(3);
    expect(el.shadowRoot!.querySelector(".ce-label")).toBeNull();
    expect(el.shadowRoot!.querySelector(".ce-meta")).toBeNull();
    expect(el.shadowRoot!.querySelector(".ce-tooltip")).toBeNull();
    expect(el.shadowRoot!.querySelector(".ce-grid")).toBeNull();
    expect(
      el.shadowRoot!.querySelector(".ce-rows")?.getAttribute("role")
    ).toBe("img");
    el.remove();
  });

  it("uses the format() prop for inline values and tick labels", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.gridlines = true;
    el.max = 100;
    el.data = [{ label: "A", value: 42 }];
    el.format = (v) => `${v}%`;
    document.body.appendChild(el);
    await el.updateComplete;
    const fill = fills(el)[0];
    expect(fill.textContent?.trim()).toBe("42%");
    const tickTexts = Array.from(
      el.shadowRoot!.querySelectorAll(".ce-grid-tick")
    ).map((t) => t.textContent?.trim());
    expect(tickTexts).toEqual(["0%", "25%", "50%", "75%", "100%"]);
    el.remove();
  });

  // --- Slot mode (CDR-005) ---

  it("renders rows from <ce-bar-row> slot children when data is empty", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.innerHTML = `
      <ce-bar-row value="10"><span slot="label">A</span></ce-bar-row>
      <ce-bar-row value="20"><span slot="label">B</span></ce-bar-row>
    `;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(rows(el).length).toBe(2);
    el.remove();
  });

  it("slot mode auto-scales so the largest row is 100%", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.innerHTML = `
      <ce-bar-row value="10"><span slot="label">A</span></ce-bar-row>
      <ce-bar-row value="20"><span slot="label">B</span></ce-bar-row>
    `;
    document.body.appendChild(el);
    await el.updateComplete;
    const w = widths(el);
    expect(w[1]).toBe(100);
    expect(w[0]).toBe(50);
    el.remove();
  });

  it("slot mode respects per-row color attribute", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.innerHTML = `
      <ce-bar-row value="10" color="green"><span slot="label">A</span></ce-bar-row>
    `;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(fills(el)[0].style.background).toContain("var(--ce-color-green)");
    el.remove();
  });

  it("data prop takes priority over slot children", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.data = [{ label: "X", value: 99 }];
    el.innerHTML = `
      <ce-bar-row value="1"><span slot="label">Y</span></ce-bar-row>
    `;
    document.body.appendChild(el);
    await el.updateComplete;
    // Should use data prop → 1 row scaled to 100%
    expect(rows(el).length).toBe(1);
    expect(widths(el)[0]).toBe(100);
    el.remove();
  });

  it("gracefully ignores non-ce-bar-row slot children", async () => {
    const el = document.createElement("ce-bar-chart") as CeBarChart;
    el.innerHTML = `
      <p>This is not a bar row</p>
      <ce-bar-row value="50"><span slot="label">Valid</span></ce-bar-row>
    `;
    document.body.appendChild(el);
    await el.updateComplete;
    // Only the ce-bar-row counts; the <p> is ignored
    expect(rows(el).length).toBe(1);
    el.remove();
  });

  // --- Snapshot parity (CDR-005 core requirement) ---

  it("snapshot parity: JSON mode and slot mode produce the same row count and widths", async () => {
    const dataset = [
      { label: "Alpha", value: 10 },
      { label: "Beta", value: 20 },
    ];

    // JSON mode
    const jsonEl = document.createElement("ce-bar-chart") as CeBarChart;
    jsonEl.data = dataset;
    document.body.appendChild(jsonEl);
    await jsonEl.updateComplete;

    // Slot mode
    const slotEl = document.createElement("ce-bar-chart") as CeBarChart;
    slotEl.innerHTML = `
      <ce-bar-row value="10"><span slot="label">Alpha</span></ce-bar-row>
      <ce-bar-row value="20"><span slot="label">Beta</span></ce-bar-row>
    `;
    document.body.appendChild(slotEl);
    await slotEl.updateComplete;

    const jsonWidths = widths(jsonEl);
    const slotWidths = widths(slotEl);

    expect(jsonWidths).toEqual(slotWidths);
    expect(rows(jsonEl).length).toBe(rows(slotEl).length);

    // Check ARIA values match
    const jsonPbValues = Array.from(
      jsonEl.shadowRoot!.querySelectorAll('[role="progressbar"]')
    ).map((el) => el.getAttribute("aria-valuenow"));
    const slotPbValues = Array.from(
      slotEl.shadowRoot!.querySelectorAll('[role="progressbar"]')
    ).map((el) => el.getAttribute("aria-valuenow"));
    expect(jsonPbValues).toEqual(slotPbValues);

    jsonEl.remove();
    slotEl.remove();
  });
});
