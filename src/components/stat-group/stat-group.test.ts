import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeStatGroup } from "./stat-group.js";

beforeAll(() => {
  defineOnce("ce-stat-group", CeStatGroup);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeStatGroup).updateComplete;
}

describe("<ce-stat-group>", () => {
  it("upgrades and renders shadow slot", async () => {
    const host = mount(`<ce-stat-group><span>x</span></ce-stat-group>`);
    const el = host.querySelector("ce-stat-group") as CeStatGroup;
    await ready(el);
    expect(el.shadowRoot!.querySelector("slot")).not.toBeNull();
    host.remove();
  });

  it("default columns is auto", async () => {
    const host = mount(`<ce-stat-group></ce-stat-group>`);
    const el = host.querySelector("ce-stat-group") as CeStatGroup;
    await ready(el);
    expect(el.columns).toBe("auto");
    host.remove();
  });

  it("reflects columns attribute", async () => {
    const host = mount(`<ce-stat-group columns="4"></ce-stat-group>`);
    const el = host.querySelector("ce-stat-group") as CeStatGroup;
    await ready(el);
    expect(el.getAttribute("columns")).toBe("4");
    host.remove();
  });

  it("reflects gap attribute", async () => {
    const host = mount(`<ce-stat-group gap="lg"></ce-stat-group>`);
    const el = host.querySelector("ce-stat-group") as CeStatGroup;
    await ready(el);
    expect(el.getAttribute("gap")).toBe("lg");
    host.remove();
  });

  it("default slot projects children", async () => {
    const host = mount(`<ce-stat-group><span class="kpi">A</span><span class="kpi">B</span></ce-stat-group>`);
    const el = host.querySelector("ce-stat-group") as CeStatGroup;
    await ready(el);
    expect(el.querySelectorAll(".kpi").length).toBe(2);
    host.remove();
  });

  it("accepts JS property updates", async () => {
    const host = mount(`<ce-stat-group></ce-stat-group>`);
    const el = host.querySelector("ce-stat-group") as CeStatGroup;
    await ready(el);
    el.columns = "3";
    await ready(el);
    expect(el.getAttribute("columns")).toBe("3");
    host.remove();
  });
});
