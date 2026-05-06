import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeStatusLight } from "./status-light.js";

beforeAll(() => {
  defineOnce("ce-status-light", CeStatusLight);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeStatusLight).updateComplete;
}

describe("<ce-status-light>", () => {
  it("upgrades and renders shadow root", async () => {
    const host = mount(`<ce-status-light state="ok"></ce-status-light>`);
    const el = host.querySelector("ce-status-light") as CeStatusLight;
    await ready(el);
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot!.querySelector(".dot")).not.toBeNull();
    host.remove();
  });

  it("reflects state attribute", async () => {
    const host = mount(`<ce-status-light state="warn"></ce-status-light>`);
    const el = host.querySelector("ce-status-light") as CeStatusLight;
    await ready(el);
    expect(el.getAttribute("state")).toBe("warn");
    expect(el.state).toBe("warn");
    host.remove();
  });

  it("renders label attribute as text", async () => {
    const host = mount(`<ce-status-light state="ok" label="All systems go"></ce-status-light>`);
    const el = host.querySelector("ce-status-light") as CeStatusLight;
    await ready(el);
    expect(el.shadowRoot!.textContent).toContain("All systems go");
    host.remove();
  });

  it("default state is neutral", async () => {
    const host = mount(`<ce-status-light></ce-status-light>`);
    const el = host.querySelector("ce-status-light") as CeStatusLight;
    await ready(el);
    expect(el.state).toBe("neutral");
    host.remove();
  });

  it("pulse attribute reflects", async () => {
    const host = mount(`<ce-status-light state="bad" pulse></ce-status-light>`);
    const el = host.querySelector("ce-status-light") as CeStatusLight;
    await ready(el);
    expect(el.pulse).toBe(true);
    expect(el.hasAttribute("pulse")).toBe(true);
    host.remove();
  });

  it("size attribute reflects", async () => {
    const host = mount(`<ce-status-light size="lg"></ce-status-light>`);
    const el = host.querySelector("ce-status-light") as CeStatusLight;
    await ready(el);
    expect(el.getAttribute("size")).toBe("lg");
    host.remove();
  });

  it("default slot overrides label attribute", async () => {
    const host = mount(`<ce-status-light state="ok" label="from-attr">slotted</ce-status-light>`);
    const el = host.querySelector("ce-status-light") as CeStatusLight;
    await ready(el);
    expect(el.textContent).toContain("slotted");
    host.remove();
  });
});
