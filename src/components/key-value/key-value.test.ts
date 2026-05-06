import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeKeyValue } from "./key-value.js";

beforeAll(() => {
  defineOnce("ce-key-value", CeKeyValue);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeKeyValue).updateComplete;
}

describe("<ce-key-value>", () => {
  it("renders dl wrapper with slot", async () => {
    const host = mount(`<ce-key-value><dt>k</dt><dd>v</dd></ce-key-value>`);
    const el = host.querySelector("ce-key-value") as CeKeyValue;
    await ready(el);
    expect(el.shadowRoot!.querySelector("dl")).not.toBeNull();
    expect(el.shadowRoot!.querySelector("slot")).not.toBeNull();
    host.remove();
  });

  it("projects dt/dd via default slot", async () => {
    const host = mount(`<ce-key-value>
      <dt>Name</dt><dd>Alice</dd>
      <dt>Role</dt><dd>Eng</dd>
    </ce-key-value>`);
    const el = host.querySelector("ce-key-value") as CeKeyValue;
    await ready(el);
    expect(el.querySelectorAll("dt").length).toBe(2);
    expect(el.querySelectorAll("dd").length).toBe(2);
    host.remove();
  });

  it("default columns is 1", async () => {
    const host = mount(`<ce-key-value></ce-key-value>`);
    const el = host.querySelector("ce-key-value") as CeKeyValue;
    await ready(el);
    expect(el.columns).toBe(1);
    host.remove();
  });

  it("reflects columns attribute", async () => {
    const host = mount(`<ce-key-value columns="3"></ce-key-value>`);
    const el = host.querySelector("ce-key-value") as CeKeyValue;
    await ready(el);
    expect(el.getAttribute("columns")).toBe("3");
    host.remove();
  });

  it("reflects wrap attribute", async () => {
    const host = mount(`<ce-key-value wrap="false"></ce-key-value>`);
    const el = host.querySelector("ce-key-value") as CeKeyValue;
    await ready(el);
    expect(el.getAttribute("wrap")).toBe("false");
    host.remove();
  });

  it("accepts JS property updates", async () => {
    const host = mount(`<ce-key-value></ce-key-value>`);
    const el = host.querySelector("ce-key-value") as CeKeyValue;
    await ready(el);
    el.columns = 2;
    await ready(el);
    expect(el.getAttribute("columns")).toBe("2");
    host.remove();
  });
});
