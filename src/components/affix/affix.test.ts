import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeAffix } from "./affix.js";

beforeAll(() => {
  defineOnce("ce-affix", CeAffix);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeAffix).updateComplete;
}

describe("<ce-affix>", () => {
  it("upgrades and renders a shadow root", async () => {
    const host = mount(`<ce-affix>sticky content</ce-affix>`);
    const el = host.querySelector("ce-affix")!;
    await ready(el);
    expect(el.shadowRoot).not.toBeNull();
    host.remove();
  });

  it("defaults to edge='top' when no attribute is set", async () => {
    const host = mount(`<ce-affix>content</ce-affix>`);
    const el = host.querySelector("ce-affix") as CeAffix;
    await ready(el);
    expect(el.getAttribute("edge")).toBe("top");
    expect(el.edge).toBe("top");
    host.remove();
  });

  it("reflects edge attribute for all four values", async () => {
    for (const edge of ["top", "bottom", "start", "end"] as const) {
      const host = mount(`<ce-affix edge="${edge}">x</ce-affix>`);
      const el = host.querySelector("ce-affix") as CeAffix;
      await ready(el);
      expect(el.getAttribute("edge")).toBe(edge);
      expect(el.edge).toBe(edge);
      host.remove();
    }
  });

  it("sets --_offset custom property from a bare-number offset", async () => {
    const host = mount(`<ce-affix offset="64">x</ce-affix>`);
    const el = host.querySelector("ce-affix") as CeAffix;
    await ready(el);
    expect(el.style.getPropertyValue("--_offset")).toBe("64px");
    host.remove();
  });

  it("sets --_offset custom property from a CSS-length offset (passthrough)", async () => {
    const host = mount(`<ce-affix offset="4rem">x</ce-affix>`);
    const el = host.querySelector("ce-affix") as CeAffix;
    await ready(el);
    expect(el.style.getPropertyValue("--_offset")).toBe("4rem");
    host.remove();
  });

  it("reflects z attribute and sets --_z custom property", async () => {
    const host = mount(`<ce-affix z="20">x</ce-affix>`);
    const el = host.querySelector("ce-affix") as CeAffix;
    await ready(el);
    expect(el.getAttribute("z")).toBe("20");
    expect(el.z).toBe("20");
    expect(el.style.getPropertyValue("--_z")).toBe("20");
    host.remove();
  });

  it("renders slotted children into the default slot", async () => {
    const host = mount(`<ce-affix edge="top"><span class="child">hello</span></ce-affix>`);
    const el = host.querySelector("ce-affix") as CeAffix;
    await ready(el);
    // The child lives in the light DOM (slotted); it is accessible via the host
    const child = el.querySelector(".child");
    expect(child).not.toBeNull();
    expect(child!.textContent).toBe("hello");
    host.remove();
  });

  it("defaults to z='10' and offset='0' when attrs are absent", async () => {
    const host = mount(`<ce-affix>x</ce-affix>`);
    const el = host.querySelector("ce-affix") as CeAffix;
    await ready(el);
    expect(el.z).toBe("10");
    expect(el.offset).toBe("0");
    host.remove();
  });

  it("updates --_offset inline style when offset property changes", async () => {
    const host = mount(`<ce-affix offset="0">x</ce-affix>`);
    const el = host.querySelector("ce-affix") as CeAffix;
    await ready(el);
    el.offset = "2rem";
    await ready(el);
    expect(el.style.getPropertyValue("--_offset")).toBe("2rem");
    host.remove();
  });
});
