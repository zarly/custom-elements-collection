import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeList } from "./list.js";

beforeAll(() => {
  defineOnce("ce-list", CeList);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeList).updateComplete;
}

describe("<ce-list>", () => {
  it("upgrades and renders a shadow root", async () => {
    const host = mount(`<ce-list><span>Item</span></ce-list>`);
    const list = host.querySelector("ce-list")!;
    await ready(list);
    expect(list.shadowRoot).not.toBeNull();
    host.remove();
  });

  it("applies default attributes when no attrs are set (dividers=hair, density=comfortable)", async () => {
    const host = mount(`<ce-list><span>A</span></ce-list>`);
    const list = host.querySelector("ce-list") as CeList;
    await ready(list);
    // Reflected props match defaults
    expect(list.dividers).toBe("hair");
    expect(list.density).toBe("comfortable");
    expect(list.interactive).toBe(false);
    // Attrs are reflected onto the element
    expect(list.getAttribute("dividers")).toBe("hair");
    expect(list.getAttribute("density")).toBe("comfortable");
    expect(list.hasAttribute("interactive")).toBe(false);
    host.remove();
  });

  it("reflects dividers attribute — all 3 values", async () => {
    for (const value of ["none", "hair", "line"] as const) {
      const host = mount(`<ce-list dividers="${value}"><span>x</span></ce-list>`);
      const list = host.querySelector("ce-list") as CeList;
      await ready(list);
      expect(list.getAttribute("dividers")).toBe(value);
      expect(list.dividers).toBe(value);
      host.remove();
    }
  });

  it("reflects density attribute — all 3 values", async () => {
    for (const value of ["comfortable", "cozy", "compact"] as const) {
      const host = mount(`<ce-list density="${value}"><span>x</span></ce-list>`);
      const list = host.querySelector("ce-list") as CeList;
      await ready(list);
      expect(list.getAttribute("density")).toBe(value);
      expect(list.density).toBe(value);
      host.remove();
    }
  });

  it("reflects interactive boolean attribute", async () => {
    const host = mount(`<ce-list interactive><span>x</span></ce-list>`);
    const list = host.querySelector("ce-list") as CeList;
    await ready(list);
    expect(list.interactive).toBe(true);
    expect(list.hasAttribute("interactive")).toBe(true);
    // Toggle off via property
    list.interactive = false;
    await ready(list);
    expect(list.hasAttribute("interactive")).toBe(false);
    host.remove();
  });

  it("renders children via the default slot (counts slotted children)", async () => {
    const host = mount(`
      <ce-list>
        <span>One</span>
        <span>Two</span>
        <span>Three</span>
      </ce-list>
    `);
    const list = host.querySelector("ce-list") as CeList;
    await ready(list);
    // Children are in light DOM, not shadow DOM
    const items = Array.from(list.children);
    expect(items).toHaveLength(3);
    expect(items[0].textContent?.trim()).toBe("One");
    expect(items[2].textContent?.trim()).toBe("Three");
    host.remove();
  });

  it("slot in shadow root has no name (is the default slot)", async () => {
    const host = mount(`<ce-list><span>x</span></ce-list>`);
    const list = host.querySelector("ce-list") as CeList;
    await ready(list);
    const slot = list.shadowRoot!.querySelector("slot");
    expect(slot).not.toBeNull();
    // Default slot has no name attribute
    expect(slot!.hasAttribute("name")).toBe(false);
    host.remove();
  });

  it("appending a child after upgrade is reflected in the DOM", async () => {
    const host = mount(`<ce-list><span>Initial</span></ce-list>`);
    const list = host.querySelector("ce-list") as CeList;
    await ready(list);
    expect(Array.from(list.children)).toHaveLength(1);

    const newItem = document.createElement("span");
    newItem.textContent = "Streamed";
    list.appendChild(newItem);
    await ready(list);

    expect(Array.from(list.children)).toHaveLength(2);
    expect(list.children[1].textContent).toBe("Streamed");
    host.remove();
  });

  it("zero-attr usage renders without errors (CDR-007)", async () => {
    const host = mount(`<ce-list></ce-list>`);
    const list = host.querySelector("ce-list") as CeList;
    await ready(list);
    expect(list.shadowRoot).not.toBeNull();
    // No children — should still render the slot
    const slot = list.shadowRoot!.querySelector("slot");
    expect(slot).not.toBeNull();
    host.remove();
  });
});
