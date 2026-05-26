/**
 * `<ce-dropdown-menu>` unit tests.
 *
 * jsdom does NOT implement the native Popover API or CSS layout. Mitigations:
 *   - showPopover / hidePopover are stubbed on HTMLElement.prototype before tests run.
 *   - The `:popover-open` pseudo-class is not matched in jsdom; open/close methods
 *     are exercised via the public attribute / method surface.
 *   - Positioning assertions are skipped (getBoundingClientRect returns all-zeros in jsdom).
 *   - The ToggleEvent dispatched by the native popover is simulated manually.
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeDropdownMenu, CeMenuItem, CeMenuSeparator, CeMenuGroup } from "./dropdown-menu.js";

// ─── Popover API mock ────────────────────────────────────────────────────────

beforeAll(() => {
  if (!("showPopover" in HTMLElement.prototype)) {
    HTMLElement.prototype.showPopover = function (this: HTMLElement) {
      this.setAttribute("open", "");
    };
  }
  if (!("hidePopover" in HTMLElement.prototype)) {
    HTMLElement.prototype.hidePopover = function (this: HTMLElement) {
      this.removeAttribute("open");
    };
  }

  vi.spyOn(HTMLElement.prototype, "showPopover").mockImplementation(function (this: HTMLElement) {
    this.setAttribute("open", "");
  });
  vi.spyOn(HTMLElement.prototype, "hidePopover").mockImplementation(function (this: HTMLElement) {
    this.removeAttribute("open");
  });

  defineOnce("ce-dropdown-menu", CeDropdownMenu);
  defineOnce("ce-menu-item", CeMenuItem);
  defineOnce("ce-menu-separator", CeMenuSeparator);
  defineOnce("ce-menu-group", CeMenuGroup);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mount(markup: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = markup;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeDropdownMenu).updateComplete;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("<ce-dropdown-menu>", () => {
  let host: HTMLElement;

  beforeEach(() => {
    if (host) host.remove();
  });

  // 1 — Upgrades and renders, closed by default
  it("upgrades with shadow root and is closed by default", async () => {
    host = mount(`<ce-dropdown-menu></ce-dropdown-menu>`);
    const el = host.querySelector("ce-dropdown-menu") as CeDropdownMenu;
    await ready(el);

    expect(el.shadowRoot).not.toBeNull();
    expect(el.open).toBe(false);
    expect(el.hasAttribute("open")).toBe(false);
  });

  // 2 — open reflects
  it("reflects the open attribute to property and back", async () => {
    host = mount(`<ce-dropdown-menu open></ce-dropdown-menu>`);
    const el = host.querySelector("ce-dropdown-menu") as CeDropdownMenu;
    await ready(el);

    expect(el.open).toBe(true);
    expect(el.hasAttribute("open")).toBe(true);

    el.open = false;
    await ready(el);

    expect(el.open).toBe(false);
    expect(el.hasAttribute("open")).toBe(false);
  });

  // 3 — Clicking trigger calls showPopover (mocked) and sets open=true
  it("clicking the trigger calls showPopover and sets open=true", async () => {
    host = mount(`
      <ce-dropdown-menu>
        <button slot="trigger" id="t">Open</button>
        <ce-menu-item value="a">Item A</ce-menu-item>
      </ce-dropdown-menu>
    `);
    const el = host.querySelector("ce-dropdown-menu") as CeDropdownMenu;
    await ready(el);

    const trigger = host.querySelector("#t") as HTMLButtonElement;
    expect(el.open).toBe(false);

    const showSpy = vi.spyOn(HTMLElement.prototype, "showPopover");
    trigger.click();
    await ready(el);

    expect(el.open).toBe(true);
    expect(showSpy).toHaveBeenCalled();
  });

  // 4 — Clicking a menu item emits ce-menu-select with the item's value
  it("clicking a menu item emits ce-menu-select with the correct value", async () => {
    host = mount(`
      <ce-dropdown-menu open>
        <button slot="trigger">Trigger</button>
        <ce-menu-item value="edit">Edit</ce-menu-item>
        <ce-menu-item value="del">Delete</ce-menu-item>
      </ce-dropdown-menu>
    `);
    const el = host.querySelector("ce-dropdown-menu") as CeDropdownMenu;
    await ready(el);

    let detail: { value: string } | null = null;
    el.addEventListener("ce-menu-select", (e: Event) => {
      detail = (e as CustomEvent).detail;
    });

    const editItem = host.querySelector("ce-menu-item[value='edit']") as CeMenuItem;
    await (editItem as CeMenuItem).updateComplete;
    editItem.click();
    await ready(el);

    expect(detail).not.toBeNull();
    expect(detail!.value).toBe("edit");
  });

  // 5 — Reflects placement attribute
  it("reflects placement attribute", async () => {
    host = mount(`<ce-dropdown-menu placement="top-end"></ce-dropdown-menu>`);
    const el = host.querySelector("ce-dropdown-menu") as CeDropdownMenu;
    await ready(el);

    expect(el.placement).toBe("top-end");
    expect(el.getAttribute("placement")).toBe("top-end");

    el.placement = "bottom-end";
    await ready(el);
    expect(el.getAttribute("placement")).toBe("bottom-end");
  });

  // 6 — Menu items have role="menuitem"
  it("menu items have role=menuitem", async () => {
    host = mount(`
      <ce-dropdown-menu>
        <button slot="trigger">T</button>
        <ce-menu-item value="x">Item</ce-menu-item>
      </ce-dropdown-menu>
    `);
    const item = host.querySelector("ce-menu-item") as CeMenuItem;
    await (item as CeMenuItem).updateComplete;

    expect(item.getAttribute("role")).toBe("menuitem");
  });

  // 7 — Separator has role="separator"
  it("menu separator has role=separator", async () => {
    host = mount(`
      <ce-dropdown-menu>
        <button slot="trigger">T</button>
        <ce-menu-item value="a">A</ce-menu-item>
        <ce-menu-separator></ce-menu-separator>
        <ce-menu-item value="b">B</ce-menu-item>
      </ce-dropdown-menu>
    `);
    const sep = host.querySelector("ce-menu-separator") as CeMenuSeparator;
    await (sep as CeMenuSeparator).updateComplete;

    expect(sep.getAttribute("role")).toBe("separator");
  });

  // 8 — ArrowDown on focused item moves focus to next item
  it("ArrowDown moves focus to the next enabled item", async () => {
    host = mount(`
      <ce-dropdown-menu open>
        <button slot="trigger">T</button>
        <ce-menu-item value="a" id="item-a">A</ce-menu-item>
        <ce-menu-item value="b" id="item-b">B</ce-menu-item>
        <ce-menu-item value="c" id="item-c">C</ce-menu-item>
      </ce-dropdown-menu>
    `);
    const el = host.querySelector("ce-dropdown-menu") as CeDropdownMenu;
    await ready(el);

    // After open, first item should have tabindex=0
    const itemA = host.querySelector("#item-a") as CeMenuItem;
    const itemB = host.querySelector("#item-b") as CeMenuItem;
    await (itemA as CeMenuItem).updateComplete;
    await (itemB as CeMenuItem).updateComplete;

    // Focus item A
    itemA.focus();

    // Dispatch ArrowDown — the keydown listener is on document (capture)
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true })
    );
    await ready(el);

    // tabindex=0 should now be on item B
    expect(itemB.getAttribute("tabindex")).toBe("0");
  });

  // 9 — Escape closes the menu (mocked hidePopover)
  it("Escape key closes the menu and calls hidePopover", async () => {
    host = mount(`
      <ce-dropdown-menu open>
        <button slot="trigger">T</button>
        <ce-menu-item value="x">X</ce-menu-item>
      </ce-dropdown-menu>
    `);
    const el = host.querySelector("ce-dropdown-menu") as CeDropdownMenu;
    await ready(el);

    expect(el.open).toBe(true);

    const hideSpy = vi.spyOn(HTMLElement.prototype, "hidePopover");
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })
    );
    await ready(el);

    expect(el.open).toBe(false);
    expect(hideSpy).toHaveBeenCalled();
  });

  // 10 — Disabled items are skipped in keyboard nav
  it("disabled menu items are skipped when navigating with ArrowDown", async () => {
    host = mount(`
      <ce-dropdown-menu open>
        <button slot="trigger">T</button>
        <ce-menu-item value="a" id="item-a">A</ce-menu-item>
        <ce-menu-item value="b" id="item-b" disabled>B (disabled)</ce-menu-item>
        <ce-menu-item value="c" id="item-c">C</ce-menu-item>
      </ce-dropdown-menu>
    `);
    const el = host.querySelector("ce-dropdown-menu") as CeDropdownMenu;
    await ready(el);

    // _getItems() filters out disabled items, so enabled items are A and C
    const itemA = host.querySelector("#item-a") as CeMenuItem;
    const itemC = host.querySelector("#item-c") as CeMenuItem;
    await (itemA as CeMenuItem).updateComplete;
    await (itemC as CeMenuItem).updateComplete;

    itemA.focus();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true })
    );
    await ready(el);

    // Should skip B (disabled) and land on C
    expect(itemC.getAttribute("tabindex")).toBe("0");
  });

  // 11 — Menu group has role=group and aria-labelledby
  it("ce-menu-group has role=group and aria-labelledby set", async () => {
    host = mount(`
      <ce-dropdown-menu>
        <button slot="trigger">T</button>
        <ce-menu-group label="Date">
          <ce-menu-item value="newest">Newest</ce-menu-item>
        </ce-menu-group>
      </ce-dropdown-menu>
    `);
    const group = host.querySelector("ce-menu-group") as CeMenuGroup;
    await (group as CeMenuGroup).updateComplete;

    expect(group.getAttribute("role")).toBe("group");
    expect(group.hasAttribute("aria-labelledby")).toBe(true);
  });

  // 12 — cleanup on disconnect does not throw
  it("removes cleanly on disconnect without errors", async () => {
    host = mount(`
      <ce-dropdown-menu>
        <button slot="trigger">T</button>
        <ce-menu-item value="x">X</ce-menu-item>
      </ce-dropdown-menu>
    `);
    const el = host.querySelector("ce-dropdown-menu") as CeDropdownMenu;
    await ready(el);
    el.open = true;
    await ready(el);
    expect(() => host.remove()).not.toThrow();
  });
});
