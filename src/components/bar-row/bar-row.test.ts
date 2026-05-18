import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeBarRow } from "./bar-row.js";

beforeAll(() => {
  defineOnce("ce-bar-row", CeBarRow);
});

describe("<ce-bar-row> standalone", () => {
  it("renders a progressbar with aria-valuenow matching value when standalone", async () => {
    const el = document.createElement("ce-bar-row") as CeBarRow;
    el.value = 42;
    document.body.appendChild(el);
    await el.updateComplete;

    const pb = el.shadowRoot!.querySelector<HTMLElement>('[role="progressbar"]');
    expect(pb).not.toBeNull();
    expect(pb?.getAttribute("aria-valuenow")).toBe("42");
    el.remove();
  });

  it("sets data-standalone attribute when not inside ce-bar-chart", async () => {
    const el = document.createElement("ce-bar-row") as CeBarRow;
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.hasAttribute("data-standalone")).toBe(true);
    el.remove();
  });

  it("resolves named token color to CSS var in standalone fill", async () => {
    const el = document.createElement("ce-bar-row") as CeBarRow;
    el.value = 30;
    el.color = "green";
    document.body.appendChild(el);
    await el.updateComplete;

    const fill = el.shadowRoot!.querySelector<HTMLElement>(".ce-sr-fill");
    expect(fill?.style.background).toContain("var(--ce-color-green)");
    el.remove();
  });

  it("renders label slot content in the label cell", async () => {
    const el = document.createElement("ce-bar-row") as CeBarRow;
    el.value = 10;
    el.innerHTML = `<span slot="label">Alpha</span>`;
    document.body.appendChild(el);
    await el.updateComplete;

    const labelSlot = el.querySelector<HTMLElement>("[slot='label']");
    expect(labelSlot?.textContent).toBe("Alpha");
    el.remove();
  });

  it("renders meta slot content in the meta cell", async () => {
    const el = document.createElement("ce-bar-row") as CeBarRow;
    el.value = 10;
    el.innerHTML = `<span slot="meta">+15%</span>`;
    document.body.appendChild(el);
    await el.updateComplete;

    const metaSlot = el.querySelector<HTMLElement>("[slot='meta']");
    expect(metaSlot?.textContent).toBe("+15%");
    el.remove();
  });

  it("does NOT render visible bar content when nested inside ce-bar-chart", async () => {
    const { CeBarChart } = await import("../bar-chart/bar-chart.js");
    defineOnce("ce-bar-chart", CeBarChart);

    const chart = document.createElement("ce-bar-chart") as CeBarChart;
    chart.innerHTML = `<ce-bar-row value="20"><span slot="label">X</span></ce-bar-row>`;
    document.body.appendChild(chart);
    await chart.updateComplete;

    const row = chart.querySelector("ce-bar-row") as CeBarRow;
    await row.updateComplete;

    // When nested, data-standalone should be absent and no .ce-sr-wrap rendered
    expect(row.hasAttribute("data-standalone")).toBe(false);
    expect(row.shadowRoot?.querySelector(".ce-sr-wrap") ?? null).toBeNull();
    chart.remove();
  });

  it("honors max attribute: fill percentage is value/max*100", async () => {
    const el = document.createElement("ce-bar-row") as CeBarRow;
    el.value = 25;
    el.max = 50;
    document.body.appendChild(el);
    await el.updateComplete;

    const fill = el.shadowRoot!.querySelector<HTMLElement>(".ce-sr-fill");
    // 25/50 * 100 = 50%
    expect(fill?.style.width).toBe("50%");
    el.remove();
  });

  it("label attribute is used when no label slot is present", async () => {
    const el = document.createElement("ce-bar-row") as CeBarRow;
    el.value = 10;
    el.label = "Conversions";
    document.body.appendChild(el);
    await el.updateComplete;

    const sr = el.shadowRoot!;
    expect(sr.querySelector(".ce-sr-label")?.textContent?.trim()).toBe("Conversions");
    el.remove();
  });

  it("meta attribute renders when no meta slot is present", async () => {
    const el = document.createElement("ce-bar-row") as CeBarRow;
    el.value = 10;
    el.meta = "9 agents";
    document.body.appendChild(el);
    await el.updateComplete;

    const sr = el.shadowRoot!;
    const metaEl = sr.querySelector(".ce-sr-meta");
    expect(metaEl?.textContent?.trim()).toBe("9 agents");
    el.remove();
  });

  it("value-display=inside renders value text inside the fill bar", async () => {
    const el = document.createElement("ce-bar-row") as CeBarRow;
    el.value = 56;
    el.valueDisplay = "inside";
    document.body.appendChild(el);
    await el.updateComplete;

    const fill = el.shadowRoot!.querySelector<HTMLElement>(".ce-sr-fill");
    expect(fill?.textContent?.trim()).not.toBe("");
    expect(el.shadowRoot!.querySelector(".ce-sr-value-outside")).toBeNull();
    el.remove();
  });

  it("value-display=outside renders value outside the track, not inside fill", async () => {
    const el = document.createElement("ce-bar-row") as CeBarRow;
    el.value = 56;
    el.valueDisplay = "outside";
    document.body.appendChild(el);
    await el.updateComplete;

    const fill = el.shadowRoot!.querySelector<HTMLElement>(".ce-sr-fill");
    expect(fill?.textContent?.trim()).toBe("");
    expect(el.shadowRoot!.querySelector(".ce-sr-value-outside")).not.toBeNull();
    el.remove();
  });

  it("value-display=hidden renders no value text anywhere", async () => {
    const el = document.createElement("ce-bar-row") as CeBarRow;
    el.value = 56;
    el.valueDisplay = "hidden";
    document.body.appendChild(el);
    await el.updateComplete;

    const fill = el.shadowRoot!.querySelector<HTMLElement>(".ce-sr-fill");
    expect(fill?.textContent?.trim()).toBe("");
    expect(el.shadowRoot!.querySelector(".ce-sr-value-outside")).toBeNull();
    el.remove();
  });

  it("aria-label is set from label attribute for accessibility", async () => {
    const el = document.createElement("ce-bar-row") as CeBarRow;
    el.value = 42;
    el.label = "Engineering";
    document.body.appendChild(el);
    await el.updateComplete;

    const pb = el.shadowRoot!.querySelector<HTMLElement>('[role="progressbar"]');
    expect(pb?.getAttribute("aria-label")).toBe("Engineering");
    el.remove();
  });

  it("aria-valuemax reflects the max attribute", async () => {
    const el = document.createElement("ce-bar-row") as CeBarRow;
    el.value = 7;
    el.max = 10;
    document.body.appendChild(el);
    await el.updateComplete;

    const pb = el.shadowRoot!.querySelector<HTMLElement>('[role="progressbar"]');
    expect(pb?.getAttribute("aria-valuemax")).toBe("10");
    el.remove();
  });

  it("clamps fill to 100% when value exceeds max", async () => {
    const el = document.createElement("ce-bar-row") as CeBarRow;
    el.value = 150;
    el.max = 100;
    document.body.appendChild(el);
    await el.updateComplete;

    const fill = el.shadowRoot!.querySelector<HTMLElement>(".ce-sr-fill");
    expect(fill?.style.width).toBe("100%");
    el.remove();
  });
});
