import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeModal } from "./modal.js";

beforeAll(() => {
  defineOnce("ce-modal", CeModal);

  // jsdom 25 does not implement HTMLDialogElement.showModal() or .close() as
  // top-layer APIs. Polyfill them here so the component's open/close logic
  // can be tested without a real browser.
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

async function ready(el: CeModal): Promise<void> {
  await el.updateComplete;
}

describe("<ce-modal>", () => {
  it("renders closed by default — open attribute absent, dialog not open", async () => {
    const host = mount(`<ce-modal title="Test"></ce-modal>`);
    const el = host.querySelector("ce-modal") as CeModal;
    await ready(el);
    expect(el.hasAttribute("open")).toBe(false);
    const dialog = el.shadowRoot!.querySelector("dialog")!;
    expect(dialog.hasAttribute("open")).toBe(false);
    host.remove();
  });

  it("setting open=true makes the dialog visible", async () => {
    const host = mount(`<ce-modal title="Hello" open></ce-modal>`);
    const el = host.querySelector("ce-modal") as CeModal;
    await ready(el);
    const dialog = el.shadowRoot!.querySelector("dialog")!;
    expect(dialog.hasAttribute("open")).toBe(true);
    host.remove();
  });

  it("default slot content renders inside the dialog body", async () => {
    const host = mount(`<ce-modal title="Slots" open><p>Body text</p></ce-modal>`);
    const el = host.querySelector("ce-modal") as CeModal;
    await ready(el);
    // Light DOM children are assigned to the default slot
    expect(el.textContent).toContain("Body text");
    host.remove();
  });

  it("title attribute renders as the header text", async () => {
    const host = mount(`<ce-modal title="My Title" open></ce-modal>`);
    const el = host.querySelector("ce-modal") as CeModal;
    await ready(el);
    const titleEl = el.shadowRoot!.querySelector(".ce-modal__title")!;
    expect(titleEl.textContent?.trim()).toBe("My Title");
    host.remove();
  });

  it("dispatches ce-modal-open when opened", async () => {
    const host = mount(`<ce-modal title="Open event"></ce-modal>`);
    const el = host.querySelector("ce-modal") as CeModal;
    await ready(el);
    let fired = 0;
    el.addEventListener("ce-modal-open", () => fired++);
    el.show();
    await ready(el);
    expect(fired).toBe(1);
    host.remove();
  });

  it("ESC key closes the modal and fires ce-modal-close (dismissible default)", async () => {
    const host = mount(`<ce-modal title="ESC test" open></ce-modal>`);
    const el = host.querySelector("ce-modal") as CeModal;
    await ready(el);
    let closed = 0;
    el.addEventListener("ce-modal-close", () => closed++);
    const dialog = el.shadowRoot!.querySelector("dialog")!;
    // Simulate native ESC via the cancel event (jsdom fires cancel on ESC)
    dialog.dispatchEvent(new Event("cancel", { bubbles: false, cancelable: true }));
    await ready(el);
    expect(closed).toBe(1);
    expect(el.open).toBe(false);
    host.remove();
  });

  it("backdrop click closes when dismissible (default)", async () => {
    const host = mount(`<ce-modal title="Backdrop" open></ce-modal>`);
    const el = host.querySelector("ce-modal") as CeModal;
    await ready(el);
    let closed = 0;
    el.addEventListener("ce-modal-close", () => closed++);
    const dialog = el.shadowRoot!.querySelector("dialog")!;
    // Simulate backdrop click: event.target === dialog element itself
    const event = new MouseEvent("click", { bubbles: true });
    Object.defineProperty(event, "target", { value: dialog, configurable: true });
    dialog.dispatchEvent(event);
    await ready(el);
    expect(closed).toBe(1);
    expect(el.open).toBe(false);
    host.remove();
  });

  it("dismissible=false suppresses ESC close", async () => {
    const host = mount(`<ce-modal title="Locked" open></ce-modal>`);
    const el = host.querySelector("ce-modal") as CeModal;
    await ready(el);
    // Set via property (Lit boolean: attribute presence = true, so set false via property)
    el.dismissible = false;
    await ready(el);
    let closed = 0;
    el.addEventListener("ce-modal-close", () => closed++);
    const dialog = el.shadowRoot!.querySelector("dialog")!;
    dialog.dispatchEvent(new Event("cancel", { bubbles: false, cancelable: true }));
    await ready(el);
    expect(closed).toBe(0);
    expect(el.open).toBe(true);
    host.remove();
  });

  it("dismissible=false suppresses backdrop click and hides close button", async () => {
    const host = mount(`<ce-modal title="Locked" open></ce-modal>`);
    const el = host.querySelector("ce-modal") as CeModal;
    await ready(el);
    el.dismissible = false;
    await ready(el);
    // Close button should be absent
    const closeBtn = el.shadowRoot!.querySelector(".ce-modal__close");
    expect(closeBtn).toBeNull();
    // Backdrop click should not close
    let closed = 0;
    el.addEventListener("ce-modal-close", () => closed++);
    const dialog = el.shadowRoot!.querySelector("dialog")!;
    const event = new MouseEvent("click", { bubbles: true });
    Object.defineProperty(event, "target", { value: dialog, configurable: true });
    dialog.dispatchEvent(event);
    await ready(el);
    expect(closed).toBe(0);
    host.remove();
  });

  it("show() and close() methods open and close the modal, firing the right events", async () => {
    const host = mount(`<ce-modal title="Programmatic"></ce-modal>`);
    const el = host.querySelector("ce-modal") as CeModal;
    await ready(el);
    let openCount = 0;
    let closeCount = 0;
    el.addEventListener("ce-modal-open", () => openCount++);
    el.addEventListener("ce-modal-close", () => closeCount++);

    el.show();
    await ready(el);
    expect(el.open).toBe(true);
    expect(openCount).toBe(1);

    el.close();
    await ready(el);
    expect(el.open).toBe(false);
    expect(closeCount).toBe(1);
    host.remove();
  });

  it("focus returns to the invoker element after close", async () => {
    // Create a focusable element to act as invoker
    const host = mount(`<button id="trigger">Open</button><ce-modal title="Focus return"></ce-modal>`);
    const trigger = host.querySelector("#trigger") as HTMLButtonElement;
    const el = host.querySelector("ce-modal") as CeModal;
    await ready(el);

    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    el.show();
    await ready(el);
    el.close();
    await ready(el);

    // Focus should return to trigger
    expect(document.activeElement).toBe(trigger);
    host.remove();
  });
});
