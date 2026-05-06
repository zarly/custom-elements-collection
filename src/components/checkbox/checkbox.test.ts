import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeCheckbox } from "./checkbox.js";

beforeAll(() => {
  defineOnce("ce-checkbox", CeCheckbox);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeCheckbox).updateComplete;
}

describe("<ce-checkbox>", () => {
  it("renders box and accepts label", async () => {
    const host = mount(`<ce-checkbox label="Agree"></ce-checkbox>`);
    const el = host.querySelector("ce-checkbox") as CeCheckbox;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".box")).not.toBeNull();
    expect(el.shadowRoot!.textContent).toContain("Agree");
    host.remove();
  });

  it("role=checkbox + aria-checked=false initially", async () => {
    const host = mount(`<ce-checkbox></ce-checkbox>`);
    const el = host.querySelector("ce-checkbox") as CeCheckbox;
    await ready(el);
    expect(el.getAttribute("role")).toBe("checkbox");
    expect(el.getAttribute("aria-checked")).toBe("false");
    host.remove();
  });

  it("click toggles and fires ce-change", async () => {
    const host = mount(`<ce-checkbox></ce-checkbox>`);
    const el = host.querySelector("ce-checkbox") as CeCheckbox;
    await ready(el);
    let detail: any = null;
    el.addEventListener("ce-change", (e) => (detail = (e as CustomEvent).detail));
    el.click();
    await ready(el);
    expect(el.checked).toBe(true);
    expect(detail).toEqual({ checked: true });
    expect(el.getAttribute("aria-checked")).toBe("true");
    host.remove();
  });

  it("indeterminate sets aria-checked=mixed", async () => {
    const host = mount(`<ce-checkbox indeterminate></ce-checkbox>`);
    const el = host.querySelector("ce-checkbox") as CeCheckbox;
    await ready(el);
    expect(el.getAttribute("aria-checked")).toBe("mixed");
    host.remove();
  });

  it("clicking indeterminate makes it checked", async () => {
    const host = mount(`<ce-checkbox indeterminate></ce-checkbox>`);
    const el = host.querySelector("ce-checkbox") as CeCheckbox;
    await ready(el);
    el.click();
    await ready(el);
    expect(el.indeterminate).toBe(false);
    expect(el.checked).toBe(true);
    host.remove();
  });

  it("disabled blocks clicks", async () => {
    const host = mount(`<ce-checkbox disabled></ce-checkbox>`);
    const el = host.querySelector("ce-checkbox") as CeCheckbox;
    await ready(el);
    el.click();
    expect(el.checked).toBe(false);
    host.remove();
  });

  it("Space key toggles", async () => {
    const host = mount(`<ce-checkbox></ce-checkbox>`);
    const el = host.querySelector("ce-checkbox") as CeCheckbox;
    await ready(el);
    el.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(el.checked).toBe(true);
    host.remove();
  });
});
