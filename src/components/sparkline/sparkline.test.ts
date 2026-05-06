import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeSparkline } from "./sparkline.js";

beforeAll(() => {
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
});
