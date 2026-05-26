/**
 * `<ce-popover>` unit tests.
 *
 * jsdom does NOT implement the native Popover API or CSS layout. Mitigations:
 *   - showPopover / hidePopover are mocked via vi.spyOn on HTMLElement.prototype.
 *   - The `:popover-open` pseudo-class is not matched in jsdom; #openPanel / #closePanel
 *     are exercised via the public attribute / method surface.
 *   - Positioning assertions are skipped (getBoundingClientRect returns all-zeros in jsdom).
 *   - The ToggleEvent dispatched by the native popover is simulated manually.
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CePopover } from "./popover.js";

// ─── Popover API mock ────────────────────────────────────────────────────────
// jsdom does not implement the Popover API. We define stub methods on the
// prototype before spying, so vi.spyOn has something to wrap.

beforeAll(() => {
  // Define stubs if not present (jsdom doesn't ship these)
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
  // matches(":popover-open") always returns false in jsdom — the guard clauses
  // in #openPanel/#closePanel will simply proceed rather than bail.

  defineOnce("ce-popover", CePopover);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mount(markup: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = markup;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CePopover).updateComplete;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("<ce-popover>", () => {
  let host: HTMLElement;

  beforeEach(() => {
    // Reset between tests
    if (host) host.remove();
  });

  // 1 — Upgrades and renders, closed by default
  it("upgrades and renders with a shadow root, closed by default", async () => {
    host = mount(`<ce-popover></ce-popover>`);
    const el = host.querySelector("ce-popover") as CePopover;
    await ready(el);

    expect(el.shadowRoot).not.toBeNull();
    expect(el.open).toBe(false);
    expect(el.hasAttribute("open")).toBe(false);

    host.remove();
  });

  // 2 — `open` attribute reflects
  it("reflects the open attribute to property and back", async () => {
    host = mount(`<ce-popover open></ce-popover>`);
    const el = host.querySelector("ce-popover") as CePopover;
    await ready(el);

    expect(el.open).toBe(true);
    expect(el.getAttribute("open")).not.toBeNull();

    el.open = false;
    await ready(el);

    expect(el.hasAttribute("open")).toBe(false);
    host.remove();
  });

  // 3 — show() sets open=true and emits ce-popover-open
  it("show() sets open=true and emits ce-popover-open", async () => {
    host = mount(`<ce-popover></ce-popover>`);
    const el = host.querySelector("ce-popover") as CePopover;
    await ready(el);

    let fired = 0;
    el.addEventListener("ce-popover-open", () => fired++);

    el.show();
    await ready(el);

    expect(el.open).toBe(true);
    expect(fired).toBe(1);
    host.remove();
  });

  // 4 — hide() sets open=false and emits ce-popover-close
  it("hide() sets open=false and emits ce-popover-close", async () => {
    host = mount(`<ce-popover open></ce-popover>`);
    const el = host.querySelector("ce-popover") as CePopover;
    await ready(el);

    let fired = 0;
    el.addEventListener("ce-popover-close", () => fired++);

    el.hide();
    await ready(el);

    expect(el.open).toBe(false);
    expect(fired).toBe(1);
    host.remove();
  });

  // 5 — toggle() flips the state
  it("toggle() flips open from false to true and back", async () => {
    host = mount(`<ce-popover></ce-popover>`);
    const el = host.querySelector("ce-popover") as CePopover;
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

  // 6 — Clicking the trigger slot calls toggle
  it("clicking the slotted trigger toggles open", async () => {
    host = mount(`
      <ce-popover>
        <button slot="trigger" id="t">Open</button>
        <p>Content</p>
      </ce-popover>
    `);
    const el = host.querySelector("ce-popover") as CePopover;
    await ready(el);

    const trigger = host.querySelector("#t") as HTMLButtonElement;
    expect(el.open).toBe(false);

    trigger.click();
    await ready(el);
    expect(el.open).toBe(true);

    trigger.click();
    await ready(el);
    expect(el.open).toBe(false);
    host.remove();
  });

  // 7 — Reflects placement attribute
  it("reflects placement attribute correctly", async () => {
    host = mount(`<ce-popover placement="right"></ce-popover>`);
    const el = host.querySelector("ce-popover") as CePopover;
    await ready(el);

    expect(el.placement).toBe("right");
    expect(el.getAttribute("placement")).toBe("right");

    el.placement = "top-end";
    await ready(el);
    expect(el.getAttribute("placement")).toBe("top-end");
    host.remove();
  });

  // 8 — Native popover toggle event syncs open back to false
  it("syncs open=false when the native popover fires toggle with newState=closed", async () => {
    host = mount(`<ce-popover></ce-popover>`);
    const el = host.querySelector("ce-popover") as CePopover;
    await ready(el);

    el.show();
    await ready(el);
    expect(el.open).toBe(true);

    // Simulate what the native Popover API fires on outside-click or Escape
    const panel = el.shadowRoot!.querySelector(".ce-popover__panel") as HTMLElement;
    const toggleEvent = new Event("toggle");
    Object.defineProperty(toggleEvent, "newState", { value: "closed" });
    panel.dispatchEvent(toggleEvent);
    await ready(el);

    expect(el.open).toBe(false);
    host.remove();
  });

  // 9 — aria-expanded set on the trigger
  it("sets aria-expanded on the trigger when opened/closed", async () => {
    host = mount(`
      <ce-popover>
        <button slot="trigger" id="btn">Toggle</button>
        <p>Body</p>
      </ce-popover>
    `);
    const el = host.querySelector("ce-popover") as CePopover;
    await ready(el);

    const btn = host.querySelector("#btn") as HTMLButtonElement;
    // Initially closed
    expect(btn.getAttribute("aria-expanded")).toBe("false");

    el.show();
    await ready(el);
    expect(btn.getAttribute("aria-expanded")).toBe("true");

    el.hide();
    await ready(el);
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    host.remove();
  });

  // 10 — light-dismiss attribute controls popover mode
  it("sets popover='manual' when light-dismiss is false", async () => {
    host = mount(`<ce-popover light-dismiss="false"></ce-popover>`);
    // Note: attribute "light-dismiss" on a boolean @property with reflect
    // needs to be set as a property; we mount with no attr and set post-upgrade.
    const el = host.querySelector("ce-popover") as CePopover;
    await ready(el);
    el.lightDismiss = false;
    await ready(el);

    const panel = el.shadowRoot!.querySelector(".ce-popover__panel") as HTMLElement;
    expect(panel.getAttribute("popover")).toBe("manual");
    host.remove();
  });

  // 11 — default placement is bottom-start
  it("defaults placement to bottom-start", async () => {
    host = mount(`<ce-popover></ce-popover>`);
    const el = host.querySelector("ce-popover") as CePopover;
    await ready(el);
    expect(el.placement).toBe("bottom-start");
    host.remove();
  });

  // 12 — disconnectedCallback does not throw (listener cleanup)
  it("removes cleanly on disconnect without errors", async () => {
    host = mount(`
      <ce-popover>
        <button slot="trigger">T</button>
      </ce-popover>
    `);
    const el = host.querySelector("ce-popover") as CePopover;
    await ready(el);
    el.show();
    await ready(el);
    expect(() => host.remove()).not.toThrow();
  });
});
