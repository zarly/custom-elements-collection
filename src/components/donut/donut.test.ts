import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeDonut } from "./donut.js";

beforeAll(() => {
  defineOnce("ce-donut", CeDonut);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeDonut).updateComplete;
}

describe("<ce-donut>", () => {
  it("renders SVG", async () => {
    const host = mount(`<ce-donut values="[1,2,3]"></ce-donut>`);
    const el = host.querySelector("ce-donut") as CeDonut;
    await ready(el);
    expect(el.shadowRoot!.querySelector("svg")).not.toBeNull();
    host.remove();
  });

  it("renders 3 segment paths for 3 values", async () => {
    const host = mount(`<ce-donut values="[10,20,30]"></ce-donut>`);
    const el = host.querySelector("ce-donut") as CeDonut;
    await ready(el);
    const paths = el.shadowRoot!.querySelectorAll("path");
    expect(paths.length).toBe(3);
    host.remove();
  });

  it("single value renders full circle", async () => {
    const host = mount(`<ce-donut values="[5]"></ce-donut>`);
    const el = host.querySelector("ce-donut") as CeDonut;
    await ready(el);
    const circles = el.shadowRoot!.querySelectorAll("circle");
    // outer + inner hole circle
    expect(circles.length).toBeGreaterThanOrEqual(1);
    host.remove();
  });

  it("aria-label summarises segments", async () => {
    const host = mount(`<ce-donut values="[50,50]" labels='["A","B"]'></ce-donut>`);
    const el = host.querySelector("ce-donut") as CeDonut;
    await ready(el);
    const svg = el.shadowRoot!.querySelector("svg")!;
    expect(svg.getAttribute("aria-label")).toContain("A");
    expect(svg.getAttribute("aria-label")).toContain("50%");
    host.remove();
  });

  it("center-label renders inside the hole", async () => {
    const host = mount(`<ce-donut values="[1,1,1]" center-label="N=3"></ce-donut>`);
    const el = host.querySelector("ce-donut") as CeDonut;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".center")!.textContent).toContain("N=3");
    host.remove();
  });

  it("thickness=0 produces a pie (no inner hole)", async () => {
    const host = mount(`<ce-donut values="[1,2]" thickness="0"></ce-donut>`);
    const el = host.querySelector("ce-donut") as CeDonut;
    await ready(el);
    const circles = el.shadowRoot!.querySelectorAll("circle");
    expect(circles.length).toBe(0);
    host.remove();
  });

  it("empty values produces empty svg", async () => {
    const host = mount(`<ce-donut values="[]"></ce-donut>`);
    const el = host.querySelector("ce-donut") as CeDonut;
    await ready(el);
    expect(el.shadowRoot!.querySelectorAll("path").length).toBe(0);
    host.remove();
  });

  it("sets data-multi when there are ≥ 2 segments (legend visible by default)", async () => {
    const host = mount(`<ce-donut values="[10,20,30]"></ce-donut>`);
    const el = host.querySelector("ce-donut") as CeDonut;
    await ready(el);
    expect(el.hasAttribute("data-multi")).toBe(true);
    host.remove();
  });

  it("omits data-multi for a single segment (legend hidden by default)", async () => {
    const host = mount(`<ce-donut values="[100]"></ce-donut>`);
    const el = host.querySelector("ce-donut") as CeDonut;
    await ready(el);
    expect(el.hasAttribute("data-multi")).toBe(false);
    host.remove();
  });

  it("auto-generated legend lists every segment with label and percent", async () => {
    const host = mount(
      `<ce-donut values="[60,40]" labels='["Hits","Misses"]'></ce-donut>`
    );
    const el = host.querySelector("ce-donut") as CeDonut;
    await ready(el);
    const rows = el.shadowRoot!.querySelectorAll(".legend__row");
    expect(rows.length).toBe(2);
    const text = el.shadowRoot!.querySelector(".legend")!.textContent ?? "";
    expect(text).toContain("Hits");
    expect(text).toContain("60%");
    expect(text).toContain("Misses");
    expect(text).toContain("40%");
    host.remove();
  });

  it("legend slot exists for per-instance overrides", async () => {
    const host = mount(`<ce-donut values="[1,2,3]"></ce-donut>`);
    const el = host.querySelector("ce-donut") as CeDonut;
    await ready(el);
    expect(el.shadowRoot!.querySelector('slot[name="legend"]')).not.toBeNull();
    host.remove();
  });
});
