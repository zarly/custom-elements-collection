import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeCenter } from "./center.js";

beforeAll(() => {
  defineOnce("ce-center", CeCenter);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeCenter).updateComplete;
}

describe("<ce-center>", () => {
  it("upgrades and renders a shadow root", async () => {
    const host = mount(`<ce-center>Hello</ce-center>`);
    const el = host.querySelector("ce-center")!;
    await ready(el);
    expect(el.shadowRoot).not.toBeNull();
    expect(el.textContent).toContain("Hello");
    host.remove();
  });

  it("defaults to max=prose and gutter=m with no attributes", async () => {
    const host = mount(`<ce-center>Content</ce-center>`);
    const el = host.querySelector("ce-center") as CeCenter;
    await ready(el);
    expect(el.max).toBe("prose");
    expect(el.gutter).toBe("m");
    expect(el.intrinsic).toBe(false);
    host.remove();
  });

  it("reflects the max attribute", async () => {
    const host = mount(`<ce-center max="wide">Content</ce-center>`);
    const el = host.querySelector("ce-center") as CeCenter;
    await ready(el);
    expect(el.getAttribute("max")).toBe("wide");
    expect(el.max).toBe("wide");
    host.remove();
  });

  it("reflects the gutter attribute", async () => {
    const host = mount(`<ce-center gutter="l">Content</ce-center>`);
    const el = host.querySelector("ce-center") as CeCenter;
    await ready(el);
    expect(el.getAttribute("gutter")).toBe("l");
    expect(el.gutter).toBe("l");
    host.remove();
  });

  it("reflects the intrinsic boolean attribute", async () => {
    const host = mount(`<ce-center intrinsic>Content</ce-center>`);
    const el = host.querySelector("ce-center") as CeCenter;
    await ready(el);
    expect(el.intrinsic).toBe(true);
    expect(el.hasAttribute("intrinsic")).toBe(true);
    host.remove();
  });

  it("renders children via the default slot", async () => {
    const host = mount(`
      <ce-center>
        <h1>Title</h1>
        <p>Body paragraph.</p>
      </ce-center>
    `);
    const el = host.querySelector("ce-center") as CeCenter;
    await ready(el);
    const shadow = el.shadowRoot!;
    const slot = shadow.querySelector("slot");
    expect(slot).not.toBeNull();
    // Slot has no name attribute (default slot)
    expect(slot!.getAttribute("name")).toBeNull();
    // Light-DOM children are still in the element
    expect(el.querySelector("h1")?.textContent).toBe("Title");
    expect(el.querySelector("p")?.textContent).toBe("Body paragraph.");
    host.remove();
  });

  it("setting max property updates the reflected attribute", async () => {
    const host = mount(`<ce-center>Content</ce-center>`);
    const el = host.querySelector("ce-center") as CeCenter;
    await ready(el);
    el.max = "narrow";
    await ready(el);
    expect(el.getAttribute("max")).toBe("narrow");
    host.remove();
  });

  it("toggling intrinsic off removes the attribute", async () => {
    const host = mount(`<ce-center intrinsic>Content</ce-center>`);
    const el = host.querySelector("ce-center") as CeCenter;
    await ready(el);
    expect(el.intrinsic).toBe(true);
    el.intrinsic = false;
    await ready(el);
    expect(el.hasAttribute("intrinsic")).toBe(false);
    host.remove();
  });

  it("accepts all valid max values without error", async () => {
    for (const max of ["prose", "narrow", "wide", "full"] as const) {
      const host = mount(`<ce-center max="${max}">x</ce-center>`);
      const el = host.querySelector("ce-center") as CeCenter;
      await ready(el);
      expect(el.max).toBe(max);
      host.remove();
    }
  });
});
