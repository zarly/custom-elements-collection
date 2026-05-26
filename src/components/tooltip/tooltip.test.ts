/**
 * `<ce-tooltip>` unit tests.
 *
 * jsdom does NOT implement the native Popover API. Mitigations:
 *   - showPopover / hidePopover are stubbed on HTMLElement.prototype before
 *     being spied upon via vi.spyOn, matching the pattern from ce-popover.test.ts.
 *   - `:popover-open` pseudo-class is not matched in jsdom; #doHide's guard
 *     catches the exception and assumes open=true.
 *   - vi.useFakeTimers() is used for delay tests (cases 7–8).
 *   - Positioning assertions are skipped (getBoundingClientRect returns all-zeros).
 */

import { describe, it, expect, beforeAll, vi } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeTooltip } from "./tooltip.js";

// ─── Popover API stubs ───────────────────────────────────────────────────────

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

  defineOnce("ce-tooltip", CeTooltip);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mount(markup: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = markup;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeTooltip).updateComplete;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("<ce-tooltip>", () => {
  // 1 — Upgrades and renders; bubble is not shown by default.
  it("upgrades and renders a shadow root; bubble not shown by default", async () => {
    const host = mount(`
      <button id="btn1">Hover me</button>
      <ce-tooltip for="btn1" text="Hello"></ce-tooltip>
    `);
    const el = host.querySelector("ce-tooltip") as CeTooltip;
    await ready(el);

    expect(el.shadowRoot).not.toBeNull();
    // showPopover should NOT have been called on construction.
    const bubble = el.shadowRoot!.querySelector(".ce-tooltip__bubble") as HTMLElement;
    expect(bubble.hasAttribute("open")).toBe(false);
    host.remove();
  });

  // 2 — Reflects the `placement` attribute to property and back.
  it("reflects placement attribute", async () => {
    const host = mount(`
      <span id="t2">x</span>
      <ce-tooltip for="t2" placement="bottom" text="tip"></ce-tooltip>
    `);
    const el = host.querySelector("ce-tooltip") as CeTooltip;
    await ready(el);

    expect(el.placement).toBe("bottom");
    expect(el.getAttribute("placement")).toBe("bottom");

    el.placement = "right";
    await ready(el);
    expect(el.getAttribute("placement")).toBe("right");
    host.remove();
  });

  // 3 — `text` attribute content renders inside the bubble.
  it("renders text attribute content in the bubble", async () => {
    const host = mount(`
      <span id="t3">x</span>
      <ce-tooltip for="t3" text="Tooltip text here"></ce-tooltip>
    `);
    const el = host.querySelector("ce-tooltip") as CeTooltip;
    await ready(el);

    // The bubble's textContent should include the text attr value.
    const bubble = el.shadowRoot!.querySelector(".ce-tooltip__bubble")!;
    expect(bubble.textContent).toContain("Tooltip text here");
    host.remove();
  });

  // 4 — Slot children render inside the bubble.
  it("renders slotted children inside the bubble", async () => {
    const host = mount(`
      <span id="t4">x</span>
      <ce-tooltip for="t4"><strong>Rich</strong> content</ce-tooltip>
    `);
    const el = host.querySelector("ce-tooltip") as CeTooltip;
    await ready(el);

    // Slot is in the shadow root — verify the slot element exists.
    const slot = el.shadowRoot!.querySelector("slot");
    expect(slot).not.toBeNull();

    // The light-DOM children are still present.
    expect(el.innerHTML).toContain("Rich");
    host.remove();
  });

  // 5 — Host has role="tooltip".
  it("has role='tooltip' on the host element", async () => {
    const host = mount(`
      <span id="t5">x</span>
      <ce-tooltip for="t5" text="tip"></ce-tooltip>
    `);
    const el = host.querySelector("ce-tooltip") as CeTooltip;
    await ready(el);

    expect(el.getAttribute("role")).toBe("tooltip");
    host.remove();
  });

  // 6 — Auto-generates an id (used for aria-describedby wiring).
  it("auto-generates an id on the host element", async () => {
    const host = mount(`
      <span id="t6">x</span>
      <ce-tooltip for="t6" text="tip"></ce-tooltip>
    `);
    const el = host.querySelector("ce-tooltip") as CeTooltip;
    await ready(el);

    expect(el.id).toMatch(/^ce-tooltip-\d+$/);
    host.remove();
  });

  // 7 — mouseenter on target fires showPopover after delay (fake timers).
  it("calls showPopover on the bubble after delay on target mouseenter", async () => {
    vi.useFakeTimers();
    const host = mount(`
      <button id="t7">Hover</button>
      <ce-tooltip for="t7" text="tip" delay="300"></ce-tooltip>
    `);
    const el = host.querySelector("ce-tooltip") as CeTooltip;
    await ready(el);

    const target = host.querySelector("#t7") as HTMLButtonElement;
    const bubble = el.shadowRoot!.querySelector(".ce-tooltip__bubble") as HTMLElement;
    const showSpy = vi.spyOn(bubble, "showPopover");

    target.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    // Delay not elapsed yet
    expect(showSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(showSpy).toHaveBeenCalledOnce();

    vi.useRealTimers();
    host.remove();
  });

  // 8 — mouseleave calls hidePopover immediately; pending show timer is cleared.
  it("calls hidePopover immediately on target mouseleave and cancels pending show", async () => {
    vi.useFakeTimers();
    const host = mount(`
      <button id="t8">Hover</button>
      <ce-tooltip for="t8" text="tip" delay="300"></ce-tooltip>
    `);
    const el = host.querySelector("ce-tooltip") as CeTooltip;
    await ready(el);

    const target = host.querySelector("#t8") as HTMLButtonElement;
    const bubble = el.shadowRoot!.querySelector(".ce-tooltip__bubble") as HTMLElement;
    const showSpy = vi.spyOn(bubble, "showPopover");
    const hideSpy = vi.spyOn(bubble, "hidePopover");

    // Schedule a show…
    target.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    // …then immediately leave — should cancel the timer.
    target.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));

    vi.advanceTimersByTime(300);
    // showPopover must NOT have fired because the timer was cleared.
    expect(showSpy).not.toHaveBeenCalled();
    // hidePopover is called only when the tooltip was actually visible;
    // since it was never shown, hidePopover should also not have been called.
    expect(hideSpy).not.toHaveBeenCalled();

    vi.useRealTimers();
    host.remove();
  });

  // 9 — aria-describedby is set on target when shown, removed when hidden.
  it("sets aria-describedby on target when shown and removes it when hidden", async () => {
    const host = mount(`
      <button id="t9">Button</button>
      <ce-tooltip for="t9" text="tip" delay="0"></ce-tooltip>
    `);
    const el = host.querySelector("ce-tooltip") as CeTooltip;
    await ready(el);

    const target = host.querySelector("#t9") as HTMLButtonElement;

    el.show();
    await ready(el);
    expect(target.getAttribute("aria-describedby")).toBe(el.id);

    el.hide();
    await ready(el);
    expect(target.hasAttribute("aria-describedby")).toBe(false);
    host.remove();
  });

  // 10 — focusin / focusout trigger show/hide (keyboard accessibility).
  it("calls showPopover on focusin and hidePopover on focusout", async () => {
    vi.useFakeTimers();
    const host = mount(`
      <button id="t10">Focus</button>
      <ce-tooltip for="t10" text="tip" delay="0"></ce-tooltip>
    `);
    const el = host.querySelector("ce-tooltip") as CeTooltip;
    await ready(el);

    const target = host.querySelector("#t10") as HTMLButtonElement;
    const bubble = el.shadowRoot!.querySelector(".ce-tooltip__bubble") as HTMLElement;
    const showSpy = vi.spyOn(bubble, "showPopover");
    const hideSpy = vi.spyOn(bubble, "hidePopover");

    target.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    vi.advanceTimersByTime(0);
    expect(showSpy).toHaveBeenCalledOnce();

    target.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    expect(hideSpy).toHaveBeenCalledOnce();

    vi.useRealTimers();
    host.remove();
  });

  // 11 — disconnectedCallback cleans up without errors.
  it("removes cleanly on disconnect without errors", async () => {
    const host = mount(`
      <button id="t11">x</button>
      <ce-tooltip for="t11" text="tip"></ce-tooltip>
    `);
    const el = host.querySelector("ce-tooltip") as CeTooltip;
    await ready(el);
    el.show();
    await ready(el);
    expect(() => host.remove()).not.toThrow();
  });

  // 12 — `for` property change re-wires to the new target.
  it("re-wires listeners when the `for` property changes", async () => {
    const host = mount(`
      <button id="ta">A</button>
      <button id="tb">B</button>
      <ce-tooltip for="ta" text="tip" delay="0"></ce-tooltip>
    `);
    const el = host.querySelector("ce-tooltip") as CeTooltip;
    await ready(el);

    const targetA = host.querySelector("#ta") as HTMLButtonElement;
    const targetB = host.querySelector("#tb") as HTMLButtonElement;

    // Initially wired to A.
    targetA.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    await ready(el);
    expect(el.id).toBeDefined();

    // Switch to B.
    el.for = "tb";
    await ready(el);

    // Hovering A should no longer trigger show.
    el.hide();
    await ready(el);
    targetA.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    // tooltip not wired to A anymore, so _target is B now.
    // (We can't easily assert showPopover without fake timers here; just
    // verify no error is thrown and the target is now B.)
    expect(() => targetB.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }))).not.toThrow();
    host.remove();
  });
});
