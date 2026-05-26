import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeSparkline } from "./sparkline.js";
import { CeData } from "../data/data.js";

beforeAll(() => {
  defineOnce("ce-data", CeData);
  defineOnce("ce-sparkline", CeSparkline);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeSparkline).updateComplete;
}

describe("<ce-sparkline>", () => {
  it("renders polyline for line shape", async () => {
    const host = mount(`<ce-sparkline values="[1,2,3,4]"></ce-sparkline>`);
    const el = host.querySelector("ce-sparkline") as CeSparkline;
    await ready(el);
    expect(el.shadowRoot!.querySelector("polyline")).not.toBeNull();
    host.remove();
  });

  it("renders bars for bar shape", async () => {
    const host = mount(`<ce-sparkline shape="bar" values="[1,2,3]"></ce-sparkline>`);
    const el = host.querySelector("ce-sparkline") as CeSparkline;
    await ready(el);
    const bars = el.shadowRoot!.querySelectorAll("rect.bar");
    expect(bars.length).toBe(3);
    host.remove();
  });

  it("renders area path for area shape", async () => {
    const host = mount(`<ce-sparkline shape="area" values="[1,3,2,4]"></ce-sparkline>`);
    const el = host.querySelector("ce-sparkline") as CeSparkline;
    await ready(el);
    expect(el.shadowRoot!.querySelector("path.area")).not.toBeNull();
    expect(el.shadowRoot!.querySelector("polyline.stroke")).not.toBeNull();
    host.remove();
  });

  it("empty values produces empty svg", async () => {
    const host = mount(`<ce-sparkline values="[]"></ce-sparkline>`);
    const el = host.querySelector("ce-sparkline") as CeSparkline;
    await ready(el);
    const svg = el.shadowRoot!.querySelector("svg")!;
    expect(svg).not.toBeNull();
    expect(svg.querySelector("polyline")).toBeNull();
    expect(svg.querySelector("rect")).toBeNull();
    host.remove();
  });

  it("reflects color attribute", async () => {
    const host = mount(`<ce-sparkline color="green" values="[1,2]"></ce-sparkline>`);
    const el = host.querySelector("ce-sparkline") as CeSparkline;
    await ready(el);
    expect(el.getAttribute("color")).toBe("green");
    host.remove();
  });

  it("respects width and height attributes", async () => {
    const host = mount(`<ce-sparkline width="160" height="48" values="[0,1]"></ce-sparkline>`);
    const el = host.querySelector("ce-sparkline") as CeSparkline;
    await ready(el);
    const svg = el.shadowRoot!.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("160");
    expect(svg.getAttribute("height")).toBe("48");
    host.remove();
  });

  it("aria-label describes data range", async () => {
    const host = mount(`<ce-sparkline values="[2,5,9]"></ce-sparkline>`);
    const el = host.querySelector("ce-sparkline") as CeSparkline;
    await ready(el);
    const svg = el.shadowRoot!.querySelector("svg")!;
    expect(svg.getAttribute("aria-label")).toContain("2");
    expect(svg.getAttribute("aria-label")).toContain("9");
    host.remove();
  });

  it("parses whitespace-separated numbers from text content when values is omitted", async () => {
    const host = mount(`<ce-sparkline>0.02 0.03 0.02 0.04 0.03</ce-sparkline>`);
    const el = host.querySelector("ce-sparkline") as CeSparkline;
    await ready(el);
    const poly = el.shadowRoot!.querySelector("polyline.stroke") as SVGPolylineElement;
    expect(poly).not.toBeNull();
    expect(poly.getAttribute("points")!.trim().split(/\s+/).length).toBe(5);
    host.remove();
  });

  it("parses comma-separated text content (mixed whitespace + commas)", async () => {
    const host = mount(`<ce-sparkline shape="bar">1, 2 , 3,4   5</ce-sparkline>`);
    const el = host.querySelector("ce-sparkline") as CeSparkline;
    await ready(el);
    const bars = el.shadowRoot!.querySelectorAll("rect.bar");
    expect(bars.length).toBe(5);
    host.remove();
  });

  it("values attribute wins over text content when both are present", async () => {
    const host = mount(`<ce-sparkline values="[1,2,3]" shape="bar">9 9 9 9 9 9 9</ce-sparkline>`);
    const el = host.querySelector("ce-sparkline") as CeSparkline;
    await ready(el);
    expect(el.shadowRoot!.querySelectorAll("rect.bar").length).toBe(3);
    host.remove();
  });

  it("updates the chart when text content is streamed in after upgrade", async () => {
    const host = mount(`<ce-sparkline></ce-sparkline>`);
    const el = host.querySelector("ce-sparkline") as CeSparkline;
    await ready(el);
    expect(el.shadowRoot!.querySelector("polyline.stroke")).toBeNull();
    el.textContent = "1 2 3 4";
    await new Promise((r) => setTimeout(r, 0));
    await ready(el);
    expect(el.shadowRoot!.querySelector("polyline.stroke")).not.toBeNull();
    host.remove();
  });

  it("reads values from a <ce-data> child carrying a {values:[...]} payload", async () => {
    const host = mount(`<ce-sparkline shape="bar"><ce-data>{"values":[1,2,3,4,5]}</ce-data></ce-sparkline>`);
    const el = host.querySelector("ce-sparkline") as CeSparkline;
    await ready(el);
    expect(el.shadowRoot!.querySelectorAll("rect.bar").length).toBe(5);
    host.remove();
  });

  it("reads values from a <ce-data> child carrying a bare JSON array", async () => {
    const host = mount(`<ce-sparkline shape="bar"><ce-data>[10,20,30]</ce-data></ce-sparkline>`);
    const el = host.querySelector("ce-sparkline") as CeSparkline;
    await ready(el);
    expect(el.shadowRoot!.querySelectorAll("rect.bar").length).toBe(3);
    host.remove();
  });

  it("ce-data child wins over loose text content", async () => {
    const host = mount(`<ce-sparkline shape="bar">99 99 99 99 99 99 99<ce-data>[1,2]</ce-data></ce-sparkline>`);
    const el = host.querySelector("ce-sparkline") as CeSparkline;
    await ready(el);
    expect(el.shadowRoot!.querySelectorAll("rect.bar").length).toBe(2);
    host.remove();
  });

  it("values attribute still wins over a <ce-data> child", async () => {
    const host = mount(`<ce-sparkline values="[7,8]" shape="bar"><ce-data>[1,2,3,4,5]</ce-data></ce-sparkline>`);
    const el = host.querySelector("ce-sparkline") as CeSparkline;
    await ready(el);
    expect(el.shadowRoot!.querySelectorAll("rect.bar").length).toBe(2);
    host.remove();
  });
});
