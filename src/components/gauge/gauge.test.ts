import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeGauge } from "./gauge.js";

beforeAll(() => {
  defineOnce("ce-gauge", CeGauge);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeGauge).updateComplete;
}

describe("<ce-gauge>", () => {
  it("renders SVG with track and fill arcs", async () => {
    const host = mount(`<ce-gauge value="50"></ce-gauge>`);
    const el = host.querySelector("ce-gauge") as CeGauge;
    await ready(el);
    expect(el.shadowRoot!.querySelector("svg")).not.toBeNull();
    expect(el.shadowRoot!.querySelector("path.track")).not.toBeNull();
    expect(el.shadowRoot!.querySelector("path.fill")).not.toBeNull();
    host.remove();
  });

  it("displays the current value", async () => {
    const host = mount(`<ce-gauge value="42" label="cpu"></ce-gauge>`);
    const el = host.querySelector("ce-gauge") as CeGauge;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".value")!.textContent).toContain("42");
    expect(el.shadowRoot!.querySelector(".label")!.textContent).toContain("cpu");
    host.remove();
  });

  it("does not render fill arc when value=min", async () => {
    const host = mount(`<ce-gauge value="0" min="0" max="100"></ce-gauge>`);
    const el = host.querySelector("ce-gauge") as CeGauge;
    await ready(el);
    expect(el.shadowRoot!.querySelector("path.fill")).toBeNull();
    host.remove();
  });

  it("renders a target tick when target is set", async () => {
    const host = mount(`<ce-gauge value="40" target="80"></ce-gauge>`);
    const el = host.querySelector("ce-gauge") as CeGauge;
    await ready(el);
    expect(el.shadowRoot!.querySelector("line.tick")).not.toBeNull();
    host.remove();
  });

  it("aria-valuenow reflects value", async () => {
    const host = mount(`<ce-gauge value="73" max="100"></ce-gauge>`);
    const el = host.querySelector("ce-gauge") as CeGauge;
    await ready(el);
    const svg = el.shadowRoot!.querySelector("svg")!;
    expect(svg.getAttribute("aria-valuenow")).toBe("73");
    expect(svg.getAttribute("aria-valuemax")).toBe("100");
    host.remove();
  });

  it("renders SVG <title> tooltip with value, range, and target", async () => {
    const host = mount(`<ce-gauge value="68" target="80" label="CPU load"></ce-gauge>`);
    const el = host.querySelector("ce-gauge") as CeGauge;
    await ready(el);
    const svg = el.shadowRoot!.querySelector("svg")!;
    const titles = svg.querySelectorAll("title");
    const svgTitle = Array.from(titles).find((t) => t.parentElement === svg)!;
    expect(svgTitle.textContent).toBe("CPU load: 68 of 100 (target 80)");
    expect(svg.getAttribute("aria-label")).toBe(
      "CPU load: 68 of 100 (target 80)"
    );
    const tickTitle = el.shadowRoot!.querySelector("line.tick > title")!;
    expect(tickTitle.textContent).toBe("Target: 80");
    host.remove();
  });

  it("omits target from tooltip when no target is set", async () => {
    const host = mount(`<ce-gauge value="40"></ce-gauge>`);
    const el = host.querySelector("ce-gauge") as CeGauge;
    await ready(el);
    const title = el.shadowRoot!.querySelector("svg > title")!;
    expect(title.textContent).toBe("Value: 40 of 100");
    host.remove();
  });

  it("color attribute reflects", async () => {
    const host = mount(`<ce-gauge color="green" value="10"></ce-gauge>`);
    const el = host.querySelector("ce-gauge") as CeGauge;
    await ready(el);
    expect(el.getAttribute("color")).toBe("green");
    host.remove();
  });

  it("clamps value above max to max-pct", async () => {
    const host = mount(`<ce-gauge value="500" max="100"></ce-gauge>`);
    const el = host.querySelector("ce-gauge") as CeGauge;
    await ready(el);
    // Should not throw and should still render a fill
    expect(el.shadowRoot!.querySelector("path.fill")).not.toBeNull();
    host.remove();
  });
});
