import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeKbd } from "./kbd.js";

beforeAll(() => {
  defineOnce("ce-kbd", CeKbd);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeKbd).updateComplete;
}

describe("<ce-kbd>", () => {
  it("renders slotted text", async () => {
    const host = mount(`<ce-kbd>K</ce-kbd>`);
    const el = host.querySelector("ce-kbd") as CeKbd;
    await ready(el);
    expect(el.textContent?.trim()).toBe("K");
    host.remove();
  });

  it("attaches a shadow root with a default slot", async () => {
    const host = mount(`<ce-kbd>Esc</ce-kbd>`);
    const el = host.querySelector("ce-kbd") as CeKbd;
    await ready(el);
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot!.querySelector("slot")).not.toBeNull();
    host.remove();
  });

  it("sets role=text for screen readers", async () => {
    const host = mount(`<ce-kbd>⌘</ce-kbd>`);
    const el = host.querySelector("ce-kbd") as CeKbd;
    await ready(el);
    expect(el.getAttribute("role")).toBe("text");
    host.remove();
  });

  it("preserves a caller-supplied role", async () => {
    const host = mount(`<ce-kbd role="kbd">K</ce-kbd>`);
    const el = host.querySelector("ce-kbd") as CeKbd;
    await ready(el);
    expect(el.getAttribute("role")).toBe("kbd");
    host.remove();
  });

  it("renders next to a separator for chords", async () => {
    const host = mount(`<div><ce-kbd>⌘</ce-kbd>+<ce-kbd>K</ce-kbd></div>`);
    const keys = host.querySelectorAll("ce-kbd");
    for (const k of keys) await ready(k);
    expect(keys.length).toBe(2);
    expect(host.textContent?.replace(/\s+/g, "")).toBe("⌘+K");
    host.remove();
  });

  it("accepts unicode and multi-character labels", async () => {
    const host = mount(`<ce-kbd>Shift</ce-kbd>`);
    const el = host.querySelector("ce-kbd") as CeKbd;
    await ready(el);
    expect(el.textContent?.trim()).toBe("Shift");
    host.remove();
  });
});
