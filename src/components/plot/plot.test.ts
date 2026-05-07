import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CePlot, type PlotSeries } from "./plot.js";
import { CHART_HOVER, CHART_SELECT, CHART_TOGGLE } from "../../internal/charts/events.js";

beforeAll(() => defineOnce("ce-plot", CePlot));

function svgEl(el: CePlot): SVGSVGElement | null {
  return el.shadowRoot!.querySelector<SVGSVGElement>(".ce-plot-svg");
}

function chips(el: CePlot): HTMLButtonElement[] {
  return Array.from(
    el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".ce-plot-chip")
  );
}

function lines(el: CePlot): SVGPolylineElement[] {
  return Array.from(
    el.shadowRoot!.querySelectorAll<SVGPolylineElement>(".ce-plot-line")
  );
}

function bars(el: CePlot): SVGRectElement[] {
  return Array.from(
    el.shadowRoot!.querySelectorAll<SVGRectElement>(".ce-plot-bar")
  );
}

function tooltipEl(el: CePlot): HTMLElement | null {
  return el.shadowRoot!.querySelector<HTMLElement>(".ce-plot-tooltip");
}

const lineSeries: PlotSeries[] = [
  {
    name: "alpha",
    points: [
      { x: 0, y: 5 },
      { x: 1, y: 10 },
      { x: 2, y: 7 },
    ],
  },
  {
    name: "beta",
    points: [
      { x: 0, y: 2 },
      { x: 1, y: 4 },
      { x: 2, y: 9 },
    ],
  },
];

const categorySeries: PlotSeries[] = [
  {
    name: "rev",
    points: [
      { x: "Q1", y: 100 },
      { x: "Q2", y: 140 },
      { x: "Q3", y: 90 },
    ],
  },
];

describe("<ce-plot>", () => {
  it("renders one polyline per visible series for type=line", async () => {
    const el = document.createElement("ce-plot") as CePlot;
    el.data = lineSeries;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(lines(el).length).toBe(2);
    el.remove();
  });

  it("renders an area path on top of the line for type=area", async () => {
    const el = document.createElement("ce-plot") as CePlot;
    el.type = "area";
    el.data = lineSeries;
    document.body.appendChild(el);
    await el.updateComplete;
    const areas = el.shadowRoot!.querySelectorAll(".ce-plot-area");
    expect(areas.length).toBe(2);
    expect(lines(el).length).toBe(2);
    el.remove();
  });

  it("renders one rect per category × series for type=bar (grouped)", async () => {
    const el = document.createElement("ce-plot") as CePlot;
    el.type = "bar";
    el.data = [
      ...categorySeries,
      {
        name: "cost",
        points: [
          { x: "Q1", y: 60 },
          { x: "Q2", y: 80 },
          { x: "Q3", y: 50 },
        ],
      },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(bars(el).length).toBe(6);
    el.remove();
  });

  it("renders the in-svg notice when type=bar gets non-category x", async () => {
    const el = document.createElement("ce-plot") as CePlot;
    el.type = "bar";
    el.data = lineSeries; // numeric x
    document.body.appendChild(el);
    await el.updateComplete;
    const text = el.shadowRoot!.textContent ?? "";
    expect(text).toContain("Bar charts require category x");
    expect(bars(el).length).toBe(0);
    el.remove();
  });

  it("emits the empty state when every series is hidden", async () => {
    const el = document.createElement("ce-plot") as CePlot;
    el.data = lineSeries.map((s) => ({ ...s, hidden: true }));
    el.emptyText = "Nothing here";
    document.body.appendChild(el);
    await el.updateComplete;
    const empty = el.shadowRoot!.querySelector(".ce-plot-empty");
    expect(empty?.textContent?.trim()).toBe("Nothing here");
    expect(lines(el).length).toBe(0);
    el.remove();
  });

  it("legend renders one button per series, aria-pressed reflects visibility", async () => {
    const el = document.createElement("ce-plot") as CePlot;
    el.data = lineSeries;
    document.body.appendChild(el);
    await el.updateComplete;
    const buttons = chips(el);
    expect(buttons.length).toBe(2);
    for (const b of buttons) {
      expect(b.getAttribute("aria-pressed")).toBe("true");
      expect(b.tagName).toBe("BUTTON");
    }
    el.remove();
  });

  it("clicking a legend chip toggles the series and dispatches ce-chart-toggle", async () => {
    const el = document.createElement("ce-plot") as CePlot;
    el.data = lineSeries;
    document.body.appendChild(el);
    await el.updateComplete;
    const events: { name: string; hidden: boolean }[] = [];
    el.addEventListener(CHART_TOGGLE, (e: Event) => {
      events.push((e as CustomEvent).detail);
    });
    const [betaChip] = chips(el).filter(
      (c) => c.dataset.series === "beta"
    );
    betaChip.click();
    await el.updateComplete;
    expect(events).toEqual([{ name: "beta", hidden: true }]);
    expect(lines(el).length).toBe(1); // beta hidden, alpha drawn
    expect(
      chips(el).find((c) => c.dataset.series === "beta")!
        .getAttribute("aria-pressed")
    ).toBe("false");
    // Toggle back on
    chips(el).find((c) => c.dataset.series === "beta")!.click();
    await el.updateComplete;
    expect(events.length).toBe(2);
    expect(events[1]).toEqual({ name: "beta", hidden: false });
    expect(lines(el).length).toBe(2);
    el.remove();
  });

  it("dispatches ce-chart-hover on pointermove with snapped points", async () => {
    const el = document.createElement("ce-plot") as CePlot;
    el.data = lineSeries;
    el.style.width = "800px";
    el.style.height = "320px";
    document.body.appendChild(el);
    await el.updateComplete;
    const detail: Array<{
      x: number | string | Date;
      points: { series: PlotSeries }[];
    }> = [];
    el.addEventListener(CHART_HOVER, (e: Event) => {
      detail.push((e as CustomEvent).detail);
    });
    const svg = svgEl(el)!;
    // Patch getBoundingClientRect since jsdom returns zeroes by default.
    svg.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 800,
        height: 320,
        right: 800,
        bottom: 320,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
    el.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 800,
        height: 320,
        right: 800,
        bottom: 320,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
    // Dispatch a synthetic pointermove. jsdom does not implement
    // PointerEvent — use a generic Event with the fields ce-plot reads.
    // currentTarget is read-only on Event but is set automatically by the
    // dispatcher during the listener's invocation, so we don't assign it.
    const ev = new Event("pointermove", { bubbles: true });
    Object.assign(ev, { clientX: 400, clientY: 160 });
    svg.dispatchEvent(ev);
    expect(detail.length).toBe(1);
    expect(detail[0].points.length).toBe(2);
    el.remove();
  });

  it("clicking a hover marker dispatches ce-chart-select with the series + point", async () => {
    const el = document.createElement("ce-plot") as CePlot;
    el.data = lineSeries;
    document.body.appendChild(el);
    await el.updateComplete;
    // Force hover state directly so the markers render.
    (el as unknown as { _hoverViewX: number })._hoverViewX = 400;
    (el as unknown as { _tooltipPx: { left: number; top: number } })
      ._tooltipPx = { left: 400, top: 160 };
    el.requestUpdate();
    await el.updateComplete;
    const markers = el.shadowRoot!.querySelectorAll<SVGCircleElement>(
      ".ce-plot-marker"
    );
    expect(markers.length).toBeGreaterThan(0);
    const selects: Array<{ series: PlotSeries; type: string }> = [];
    el.addEventListener(CHART_SELECT, (e: Event) => {
      selects.push((e as CustomEvent).detail);
    });
    const click = new Event("click", { bubbles: true });
    markers[0].dispatchEvent(click);
    expect(selects.length).toBe(1);
    expect(selects[0].type).toBe("line");
    expect(selects[0].series.name).toBeDefined();
    el.remove();
  });

  it("series.color routes through resolveColor — named token → CSS var", async () => {
    const el = document.createElement("ce-plot") as CePlot;
    el.data = [
      { name: "named", color: "green", points: [{ x: 0, y: 1 }, { x: 1, y: 2 }] },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    const line = lines(el)[0];
    expect(line.getAttribute("stroke")).toContain("var(--ce-color-green)");
    el.remove();
  });

  it("series.color accepts arbitrary CSS colors — passthrough via resolveColor", async () => {
    const el = document.createElement("ce-plot") as CePlot;
    el.data = [
      { name: "branded", color: "var(--brand)", points: [{ x: 0, y: 1 }, { x: 1, y: 2 }] },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    const line = lines(el)[0];
    // Arbitrary CSS values are not wrapped — they must reach the DOM untouched
    // (resolveColor only wraps named tokens in `var(--ce-color-*)`).
    expect(line.getAttribute("stroke")).toBe("var(--brand)");
    el.remove();
  });

  it("aria-label summarises series count, names, and y-range", async () => {
    const el = document.createElement("ce-plot") as CePlot;
    el.data = lineSeries;
    document.body.appendChild(el);
    await el.updateComplete;
    const svg = svgEl(el)!;
    const label = svg.getAttribute("aria-label") ?? "";
    expect(label).toContain("line chart");
    expect(label).toContain("alpha");
    expect(label).toContain("beta");
    expect(label).toContain("y range");
    el.remove();
  });

  it("renders gridlines when gridlines='y' (default)", async () => {
    const el = document.createElement("ce-plot") as CePlot;
    el.data = lineSeries;
    document.body.appendChild(el);
    await el.updateComplete;
    const yGrid = el.shadowRoot!.querySelectorAll(".ce-plot-grid-y");
    expect(yGrid.length).toBeGreaterThan(0);
    el.remove();
  });

  it("stacked bars use total per category for y-domain", async () => {
    const el = document.createElement("ce-plot") as CePlot;
    el.type = "bar";
    el.stacked = true;
    el.data = [
      {
        name: "a",
        points: [
          { x: "X", y: 30 },
          { x: "Y", y: 40 },
        ],
      },
      {
        name: "b",
        points: [
          { x: "X", y: 70 },
          { x: "Y", y: 60 },
        ],
      },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    // Two categories × two series = up to 4 rects, but stacked still renders
    // each segment.
    expect(bars(el).length).toBe(4);
    // The y-axis tick labels should reach 100 (the per-category total).
    const yTickText = Array.from(
      el.shadowRoot!.querySelectorAll<SVGTextElement>(".ce-plot-tick-y")
    )
      .map((t) => t.textContent ?? "")
      .join(",");
    expect(yTickText).toContain("100");
    el.remove();
  });

  it("tooltip is hidden by default (data-visible=false) and present in DOM", async () => {
    const el = document.createElement("ce-plot") as CePlot;
    el.data = lineSeries;
    document.body.appendChild(el);
    await el.updateComplete;
    const tip = tooltipEl(el)!;
    expect(tip).toBeTruthy();
    expect(tip.getAttribute("data-visible")).toBe("false");
    el.remove();
  });
});
