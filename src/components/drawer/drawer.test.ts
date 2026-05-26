import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeDrawer } from "./drawer.js";

beforeAll(() => {
  defineOnce("ce-drawer", CeDrawer);

  // jsdom 25 does not implement HTMLDialogElement.showModal() or .close() as
  // top-layer APIs. Polyfill them so the component's open/close logic can be
  // exercised without a real browser.
  if (!HTMLDialogElement.prototype.showModal) {
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      writable: true,
      value(this: HTMLDialogElement) {
        this.setAttribute("open", "");
      },
    });
  }
  if (!HTMLDialogElement.prototype.close) {
    Object.defineProperty(HTMLDialogElement.prototype, "close", {
      configurable: true,
      writable: true,
      value(this: HTMLDialogElement) {
        this.removeAttribute("open");
      },
    });
  }
});

function mount(markup: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = markup;
  document.body.appendChild(host);
  return host;
}

async function ready(el: CeDrawer): Promise<void> {
  await el.updateComplete;
}

describe("<ce-drawer>", () => {
  // ── 1. Upgrades and renders, closed by default ──────────────────────────

  it("upgrades and renders with a shadow root, closed by default", async () => {
    const host = mount(`<ce-drawer></ce-drawer>`);
    const el = host.querySelector("ce-drawer") as CeDrawer;
    await ready(el);

    expect(el.shadowRoot).not.toBeNull();
    expect(el.open).toBe(false);
    expect(el.hasAttribute("open")).toBe(false);

    // In modal mode (default), the inner <dialog> should NOT have the open attr
    const dialog = el.shadowRoot!.querySelector("dialog")!;
    expect(dialog.hasAttribute("open")).toBe(false);

    host.remove();
  });

  // ── 2. open attribute reflects ───────────────────────────────────────────

  it("open attribute reflects to the open property and vice versa", async () => {
    const host = mount(`<ce-drawer open></ce-drawer>`);
    const el = host.querySelector("ce-drawer") as CeDrawer;
    await ready(el);

    expect(el.open).toBe(true);
    expect(el.hasAttribute("open")).toBe(true);

    el.open = false;
    await ready(el);
    expect(el.hasAttribute("open")).toBe(false);

    host.remove();
  });

  // ── 3. show() sets open=true and emits ce-drawer-open ───────────────────

  it("show() sets open=true and dispatches ce-drawer-open", async () => {
    const host = mount(`<ce-drawer></ce-drawer>`);
    const el = host.querySelector("ce-drawer") as CeDrawer;
    await ready(el);

    let openCount = 0;
    el.addEventListener("ce-drawer-open", () => openCount++);

    el.show();
    await ready(el);

    expect(el.open).toBe(true);
    expect(openCount).toBe(1);

    host.remove();
  });

  // ── 4. hide() sets open=false and emits ce-drawer-close ─────────────────

  it("hide() sets open=false and dispatches ce-drawer-close", async () => {
    const host = mount(`<ce-drawer open></ce-drawer>`);
    const el = host.querySelector("ce-drawer") as CeDrawer;
    await ready(el);

    let closeCount = 0;
    el.addEventListener("ce-drawer-close", () => closeCount++);

    el.hide();
    await ready(el);

    expect(el.open).toBe(false);
    expect(closeCount).toBe(1);

    host.remove();
  });

  // ── 5. toggle() flips state ──────────────────────────────────────────────

  it("toggle() flips the open state each time it is called", async () => {
    const host = mount(`<ce-drawer></ce-drawer>`);
    const el = host.querySelector("ce-drawer") as CeDrawer;
    await ready(el);

    expect(el.open).toBe(false);

    el.toggle();
    await ready(el);
    expect(el.open).toBe(true);

    el.toggle();
    await ready(el);
    expect(el.open).toBe(false);

    host.remove();
  });

  // ── 6. Reflects side and size attributes ────────────────────────────────

  it("reflects side and size attributes to properties", async () => {
    const host = mount(`<ce-drawer side="start" size="lg"></ce-drawer>`);
    const el = host.querySelector("ce-drawer") as CeDrawer;
    await ready(el);

    expect(el.side).toBe("start");
    expect(el.getAttribute("side")).toBe("start");
    expect(el.size).toBe("lg");
    expect(el.getAttribute("size")).toBe("lg");

    // Mutate via property and check attr sync
    el.side = "bottom";
    el.size = "full";
    await ready(el);
    expect(el.getAttribute("side")).toBe("bottom");
    expect(el.getAttribute("size")).toBe("full");

    host.remove();
  });

  // ── 7. Clicking the trigger calls show() ────────────────────────────────

  it("clicking the slotted trigger element opens the drawer", async () => {
    const host = mount(`
      <ce-drawer>
        <button slot="trigger" id="btn">Open</button>
      </ce-drawer>
    `);
    const el = host.querySelector("ce-drawer") as CeDrawer;
    const btn = host.querySelector("#btn") as HTMLButtonElement;
    await ready(el);

    expect(el.open).toBe(false);

    btn.click();
    await ready(el);

    expect(el.open).toBe(true);

    host.remove();
  });

  // ── 8. dismissible=false prevents close on Escape (cancel event) ────────

  it("dismissible=false prevents close when the cancel event fires", async () => {
    const host = mount(`<ce-drawer open></ce-drawer>`);
    const el = host.querySelector("ce-drawer") as CeDrawer;
    await ready(el);

    el.dismissible = false;
    await ready(el);

    let closedCount = 0;
    el.addEventListener("ce-drawer-close", () => closedCount++);

    // Simulate ESC via the native cancel event on the dialog element
    const dialog = el.shadowRoot!.querySelector("dialog")!;
    const cancelEvt = new Event("cancel", { bubbles: false, cancelable: true });
    dialog.dispatchEvent(cancelEvt);
    await ready(el);

    // Drawer must still be open; close event must not have fired
    expect(el.open).toBe(true);
    expect(closedCount).toBe(0);

    host.remove();
  });

  // ── Extra: modal=false renders the panel div (non-modal path) ───────────

  it("modal=false renders a .ce-drawer__panel div instead of <dialog>", async () => {
    const host = mount(`<ce-drawer modal="false"></ce-drawer>`);
    // Lit Boolean attributes: attribute "modal" present = true. For false we
    // must set via property after mount.
    const el = host.querySelector("ce-drawer") as CeDrawer;
    el.modal = false;
    await ready(el);

    const dialog = el.shadowRoot!.querySelector("dialog");
    const panel = el.shadowRoot!.querySelector(".ce-drawer__panel");

    expect(dialog).toBeNull();
    expect(panel).not.toBeNull();

    host.remove();
  });

  // ── Extra: slot structure is present in shadow DOM ───────────────────────

  it("renders trigger, header, default, and footer slots in shadow DOM", async () => {
    const host = mount(`
      <ce-drawer>
        <span slot="trigger">T</span>
        <span slot="header">H</span>
        <span>Body</span>
        <span slot="footer">F</span>
      </ce-drawer>
    `);
    const el = host.querySelector("ce-drawer") as CeDrawer;
    await ready(el);

    const shadow = el.shadowRoot!;
    const slots = Array.from(shadow.querySelectorAll("slot"));
    const names = slots.map((s) => s.getAttribute("name") ?? "default");

    expect(names).toContain("trigger");
    expect(names).toContain("header");
    expect(names).toContain("footer");
    expect(names).toContain("default");

    host.remove();
  });
});
