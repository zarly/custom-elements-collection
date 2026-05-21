import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeIcon } from "./icon.js";

beforeAll(() => {
  defineOnce("ce-icon", CeIcon);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeIcon).updateComplete;
}

describe("<ce-icon>", () => {
  it("passes through SVG content via the default slot", async () => {
    const host = mount(`<ce-icon><svg data-x="ok" viewBox="0 0 1 1"></svg></ce-icon>`);
    const el = host.querySelector("ce-icon") as CeIcon;
    await ready(el);
    expect(el.querySelector("svg[data-x='ok']")).not.toBeNull();
    host.remove();
  });

  it("reflects size attribute", async () => {
    const host = mount(`<ce-icon size="lg"></ce-icon>`);
    const el = host.querySelector("ce-icon") as CeIcon;
    await ready(el);
    expect(el.getAttribute("size")).toBe("lg");
    host.remove();
  });

  it("is decorative (aria-hidden) when label is empty", async () => {
    const host = mount(`<ce-icon>★</ce-icon>`);
    const el = host.querySelector("ce-icon") as CeIcon;
    await ready(el);
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.hasAttribute("role")).toBe(false);
    host.remove();
  });

  it("exposes role=img + aria-label when label is set", async () => {
    const host = mount(`<ce-icon label="Search">🔍</ce-icon>`);
    const el = host.querySelector("ce-icon") as CeIcon;
    await ready(el);
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Search");
    expect(el.hasAttribute("aria-hidden")).toBe(false);
    host.remove();
  });

  it("accepts an <img> via slot", async () => {
    const host = mount(`<ce-icon><img src="x" alt=""/></ce-icon>`);
    const el = host.querySelector("ce-icon") as CeIcon;
    await ready(el);
    expect(el.querySelector("img")).not.toBeNull();
    host.remove();
  });

  it("toggles aria when label changes at runtime", async () => {
    const host = mount(`<ce-icon>★</ce-icon>`);
    const el = host.querySelector("ce-icon") as CeIcon;
    await ready(el);
    expect(el.getAttribute("aria-hidden")).toBe("true");
    el.label = "Favorite";
    await ready(el);
    expect(el.getAttribute("aria-hidden")).toBe(null);
    expect(el.getAttribute("aria-label")).toBe("Favorite");
    host.remove();
  });
});
