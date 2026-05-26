import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CePage } from "./page.js";

beforeAll(() => {
  defineOnce("ce-page", CePage);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CePage).updateComplete;
}

describe("<ce-page>", () => {
  it("upgrades and renders a shadow root", async () => {
    const host = mount(`<ce-page><p>Content</p></ce-page>`);
    const page = host.querySelector("ce-page")!;
    await ready(page);
    expect(page.shadowRoot).not.toBeNull();
    host.remove();
  });

  it("defaults to layout=stacked when no attribute is set", async () => {
    const host = mount(`<ce-page><p>Body</p></ce-page>`);
    const page = host.querySelector("ce-page") as CePage;
    await ready(page);
    expect(page.layout).toBe("stacked");
    expect(page.getAttribute("layout")).toBe("stacked");
    host.remove();
  });

  it("reflects layout attribute for all three values", async () => {
    for (const value of ["stacked", "sidebar-left", "sidebar-right"] as const) {
      const host = mount(`<ce-page layout="${value}"><p>x</p></ce-page>`);
      const page = host.querySelector("ce-page") as CePage;
      await ready(page);
      expect(page.getAttribute("layout")).toBe(value);
      expect(page.layout).toBe(value);
      host.remove();
    }
  });

  it("reflects sticky-header boolean attribute", async () => {
    const host = mount(`<ce-page sticky-header><p>x</p></ce-page>`);
    const page = host.querySelector("ce-page") as CePage;
    await ready(page);
    expect(page.stickyHeader).toBe(true);
    expect(page.hasAttribute("sticky-header")).toBe(true);
    host.remove();
  });

  it("reflects sticky-footer boolean attribute", async () => {
    const host = mount(`<ce-page sticky-footer><p>x</p></ce-page>`);
    const page = host.querySelector("ce-page") as CePage;
    await ready(page);
    expect(page.stickyFooter).toBe(true);
    expect(page.hasAttribute("sticky-footer")).toBe(true);
    host.remove();
  });

  it("exposes named slots: header, nav, footer, and default in shadow DOM", async () => {
    const host = mount(`
      <ce-page>
        <header slot="header">Top</header>
        <nav slot="nav">Rail</nav>
        Main content
        <footer slot="footer">Bottom</footer>
      </ce-page>
    `);
    const page = host.querySelector("ce-page") as CePage;
    await ready(page);
    const shadow = page.shadowRoot!;
    const slots = Array.from(shadow.querySelectorAll("slot"));
    const names = slots.map((s) => s.getAttribute("name") ?? "default");
    expect(names).toContain("header");
    expect(names).toContain("nav");
    expect(names).toContain("footer");
    expect(names).toContain("default");
    host.remove();
  });

  it("applies rail-width as inline custom property on the host", async () => {
    const host = mount(`<ce-page layout="sidebar-left" rail-width="20rem"><p>x</p></ce-page>`);
    const page = host.querySelector("ce-page") as CePage;
    await ready(page);
    const value = page.style.getPropertyValue("--ce-page-rail-width");
    expect(value).toBe("20rem");
    host.remove();
  });

  it("removes rail-width custom property when attribute is removed", async () => {
    const host = mount(`<ce-page layout="sidebar-left" rail-width="24rem"><p>x</p></ce-page>`);
    const page = host.querySelector("ce-page") as CePage;
    await ready(page);
    page.removeAttribute("rail-width");
    await ready(page);
    const value = page.style.getPropertyValue("--ce-page-rail-width");
    expect(value).toBe("");
    host.remove();
  });

  it("default slot content is accessible inside the main wrapper", async () => {
    const host = mount(`<ce-page><article id="main-art">Article body</article></ce-page>`);
    const page = host.querySelector("ce-page") as CePage;
    await ready(page);
    // The article is slotted into the default slot inside .ce-page__main
    const shadow = page.shadowRoot!;
    const mainDiv = shadow.querySelector(".ce-page__main");
    expect(mainDiv).not.toBeNull();
    const defaultSlot = mainDiv!.querySelector("slot:not([name])");
    expect(defaultSlot).not.toBeNull();
    host.remove();
  });
});
