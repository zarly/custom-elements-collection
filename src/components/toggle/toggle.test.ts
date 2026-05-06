import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeToggle } from "./toggle.js";

beforeAll(() => {
  defineOnce("ce-toggle", CeToggle);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeToggle).updateComplete;
}

describe("<ce-toggle>", () => {
  it("renders track and knob", async () => {
    const host = mount(`<ce-toggle></ce-toggle>`);
    const el = host.querySelector("ce-toggle") as CeToggle;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".track")).not.toBeNull();
    expect(el.shadowRoot!.querySelector(".knob")).not.toBeNull();
    host.remove();
  });

  it("sets role=switch and aria-checked", async () => {
    const host = mount(`<ce-toggle></ce-toggle>`);
    const el = host.querySelector("ce-toggle") as CeToggle;
    await ready(el);
    expect(el.getAttribute("role")).toBe("switch");
    expect(el.getAttribute("aria-checked")).toBe("false");
    host.remove();
  });

  it("toggles and emits ce-change on click", async () => {
    const host = mount(`<ce-toggle></ce-toggle>`);
    const el = host.querySelector("ce-toggle") as CeToggle;
    await ready(el);
    let detail: any = null;
    el.addEventListener("ce-change", (e) => {
      detail = (e as CustomEvent).detail;
    });
    el.click();
    await ready(el);
    expect(el.checked).toBe(true);
    expect(detail).toEqual({ checked: true });
    expect(el.getAttribute("aria-checked")).toBe("true");
    host.remove();
  });

  it("Space key toggles", async () => {
    const host = mount(`<ce-toggle></ce-toggle>`);
    const el = host.querySelector("ce-toggle") as CeToggle;
    await ready(el);
    el.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(el.checked).toBe(true);
    host.remove();
  });

  it("Enter key toggles", async () => {
    const host = mount(`<ce-toggle></ce-toggle>`);
    const el = host.querySelector("ce-toggle") as CeToggle;
    await ready(el);
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(el.checked).toBe(true);
    host.remove();
  });

  it("disabled does not toggle", async () => {
    const host = mount(`<ce-toggle disabled></ce-toggle>`);
    const el = host.querySelector("ce-toggle") as CeToggle;
    await ready(el);
    el.click();
    expect(el.checked).toBe(false);
    host.remove();
  });

  it("renders label attribute", async () => {
    const host = mount(`<ce-toggle label="Notifications"></ce-toggle>`);
    const el = host.querySelector("ce-toggle") as CeToggle;
    await ready(el);
    expect(el.shadowRoot!.textContent).toContain("Notifications");
    host.remove();
  });
});
