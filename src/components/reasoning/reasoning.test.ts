import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeReasoning } from "./reasoning.js";

beforeAll(() => defineOnce("ce-reasoning", CeReasoning));

describe("<ce-reasoning>", () => {
  it("upgrades and renders shadow root containing a button and a panel", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-reasoning></ce-reasoning>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-reasoning") as CeReasoning;
    await el.updateComplete;
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot!.querySelector("button")).not.toBeNull();
    expect(el.shadowRoot!.querySelector(".ce-reasoning__panel")).not.toBeNull();
    host.remove();
  });

  it("default open is false and default label is 'Reasoning'", async () => {
    const el = document.createElement("ce-reasoning") as CeReasoning;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.open).toBe(false);
    expect(el.label).toBe("Reasoning");
    expect(
      el.shadowRoot!.querySelector(".ce-reasoning__label")?.textContent?.trim()
    ).toBe("Reasoning");
    el.remove();
  });

  it("clicking the header toggles open and emits ce-reasoning-toggle with correct detail", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-reasoning></ce-reasoning>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-reasoning") as CeReasoning;
    await el.updateComplete;

    let detail: { open: boolean } | null = null;
    el.addEventListener("ce-reasoning-toggle", (e) => {
      detail = (e as CustomEvent).detail;
    });

    const btn = el.shadowRoot!.querySelector("button") as HTMLButtonElement;
    btn.click();
    await el.updateComplete;
    expect(el.open).toBe(true);
    expect(detail).toEqual({ open: true });

    btn.click();
    await el.updateComplete;
    expect(el.open).toBe(false);
    expect(detail).toEqual({ open: false });

    host.remove();
  });

  it("aria-expanded on the header mirrors the open prop", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-reasoning open></ce-reasoning>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-reasoning") as CeReasoning;
    await el.updateComplete;

    const btn = el.shadowRoot!.querySelector("button")!;
    expect(btn.getAttribute("aria-expanded")).toBe("true");

    el.open = false;
    await el.updateComplete;
    expect(btn.getAttribute("aria-expanded")).toBe("false");

    host.remove();
  });

  it("tokens prop shows in the header when set", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-reasoning tokens="12345"></ce-reasoning>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-reasoning") as CeReasoning;
    await el.updateComplete;

    const head = el.shadowRoot!.querySelector(".ce-reasoning__head")!;
    expect(head.textContent).toContain("12345");

    host.remove();
  });

  it("duration-ms='1234' formats to '1.2 s' in the header", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-reasoning duration-ms="1234"></ce-reasoning>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-reasoning") as CeReasoning;
    await el.updateComplete;

    const dur = el.shadowRoot!.querySelector(".ce-reasoning__duration");
    expect(dur?.textContent).toBe("1.2 s");

    host.remove();
  });

  it("streaming=true renders the pulse dot element in the shadow DOM", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-reasoning streaming></ce-reasoning>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-reasoning") as CeReasoning;
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector(".ce-reasoning__pulse")).not.toBeNull();

    host.remove();
  });

  it("setting open=true shows the slot via a non-hidden panel containing a slot element", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-reasoning open><p>chain of thought</p></ce-reasoning>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-reasoning") as CeReasoning;
    await el.updateComplete;

    const panel = el.shadowRoot!.querySelector(".ce-reasoning__panel")!;
    // Panel should not be hidden when open
    expect(panel.hasAttribute("hidden")).toBe(false);
    // Default slot should be present
    const slot = el.shadowRoot!.querySelector("slot:not([name])");
    expect(slot).not.toBeNull();

    host.remove();
  });
});
