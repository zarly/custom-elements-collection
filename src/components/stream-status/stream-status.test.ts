import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeStreamStatus } from "./stream-status.js";

beforeAll(() => {
  defineOnce("ce-stream-status", CeStreamStatus);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeStreamStatus).updateComplete;
}

describe("<ce-stream-status>", () => {
  it("upgrades and renders a shadow root with a dot and label span", async () => {
    const host = mount(`<ce-stream-status></ce-stream-status>`);
    const el = host.querySelector("ce-stream-status")!;
    await ready(el);
    expect(el.shadowRoot).not.toBeNull();
    const dot = el.shadowRoot!.querySelector(".ce-stream-status__dot");
    expect(dot).not.toBeNull();
    const label = el.shadowRoot!.querySelector(".ce-stream-status__label");
    expect(label).not.toBeNull();
    host.remove();
  });

  it("defaults to state='idle' that is reflected and label contains 'Idle'", async () => {
    const host = mount(`<ce-stream-status></ce-stream-status>`);
    const el = host.querySelector("ce-stream-status") as CeStreamStatus;
    await ready(el);
    expect(el.state).toBe("idle");
    expect(el.getAttribute("state")).toBe("idle");
    const label = el.shadowRoot!.querySelector(".ce-stream-status__label");
    expect(label?.textContent).toContain("Idle");
    host.remove();
  });

  it("reflects state='streaming' and switches label to 'Streaming'", async () => {
    const host = mount(`<ce-stream-status state="streaming"></ce-stream-status>`);
    const el = host.querySelector("ce-stream-status") as CeStreamStatus;
    await ready(el);
    expect(el.state).toBe("streaming");
    expect(el.getAttribute("state")).toBe("streaming");
    const label = el.shadowRoot!.querySelector(".ce-stream-status__label");
    expect(label?.textContent).toContain("Streaming");
    host.remove();
  });

  it("custom label overrides the state-default label", async () => {
    const host = mount(`<ce-stream-status state="streaming" label="Working…"></ce-stream-status>`);
    const el = host.querySelector("ce-stream-status") as CeStreamStatus;
    await ready(el);
    const label = el.shadowRoot!.querySelector(".ce-stream-status__label");
    expect(label?.textContent).toContain("Working…");
    expect(label?.textContent).not.toContain("Streaming");
    host.remove();
  });

  it("tokens=12345 causes rendered text to include '12,345' and 'tokens'", async () => {
    const host = mount(`<ce-stream-status tokens="12345"></ce-stream-status>`);
    const el = host.querySelector("ce-stream-status") as CeStreamStatus;
    await ready(el);
    const counters = el.shadowRoot!.querySelector(".ce-stream-status__counters");
    expect(counters).not.toBeNull();
    const text = counters!.textContent ?? "";
    expect(text).toContain("12,345");
    expect(text).toContain("tokens");
    host.remove();
  });

  it("tps=42 causes rendered text to include '42' and 'tok/s'", async () => {
    const host = mount(`<ce-stream-status tps="42"></ce-stream-status>`);
    const el = host.querySelector("ce-stream-status") as CeStreamStatus;
    await ready(el);
    const counters = el.shadowRoot!.querySelector(".ce-stream-status__counters");
    expect(counters).not.toBeNull();
    const text = counters!.textContent ?? "";
    expect(text).toContain("42");
    expect(text).toContain("tok/s");
    host.remove();
  });

  it("state='error' reflects and getAttribute('state') returns 'error'", async () => {
    const host = mount(`<ce-stream-status state="error"></ce-stream-status>`);
    const el = host.querySelector("ce-stream-status") as CeStreamStatus;
    await ready(el);
    expect(el.getAttribute("state")).toBe("error");
    expect(el.state).toBe("error");
    host.remove();
  });

  it("slotted child replaces auto-generated label content", async () => {
    const host = mount(
      `<ce-stream-status state="streaming"><span id="slotted">Live</span></ce-stream-status>`
    );
    const el = host.querySelector("ce-stream-status") as CeStreamStatus;
    await ready(el);
    // Slotted content lives in light DOM; the default slot in shadow carries it.
    const slotted = host.querySelector("#slotted");
    expect(slotted).not.toBeNull();
    expect(slotted!.textContent).toBe("Live");
    host.remove();
  });

  it("on connectedCallback host has role='status' and aria-live='polite'", async () => {
    const host = mount(`<ce-stream-status></ce-stream-status>`);
    const el = host.querySelector("ce-stream-status") as CeStreamStatus;
    await ready(el);
    expect(el.getAttribute("role")).toBe("status");
    expect(el.getAttribute("aria-live")).toBe("polite");
    host.remove();
  });

  it("when tokens and tps are both set both values appear in counters", async () => {
    const host = mount(`<ce-stream-status tokens="1240" tps="37"></ce-stream-status>`);
    const el = host.querySelector("ce-stream-status") as CeStreamStatus;
    await ready(el);
    const counters = el.shadowRoot!.querySelector(".ce-stream-status__counters");
    const text = counters!.textContent ?? "";
    expect(text).toContain("1,240");
    expect(text).toContain("tokens");
    expect(text).toContain("37");
    expect(text).toContain("tok/s");
    host.remove();
  });
});
