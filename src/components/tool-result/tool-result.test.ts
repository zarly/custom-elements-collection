import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeToolResult } from "./tool-result.js";

beforeAll(() => {
  defineOnce("ce-tool-result", CeToolResult);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeToolResult).updateComplete;
}

describe("<ce-tool-result>", () => {
  it("upgrades and renders shadow root with a default slot", async () => {
    const host = mount(`<ce-tool-result></ce-tool-result>`);
    const tr = host.querySelector("ce-tool-result") as CeToolResult;
    await ready(tr);
    expect(tr.shadowRoot).not.toBeNull();
    const defaultSlot = tr.shadowRoot!.querySelector("slot:not([name])");
    expect(defaultSlot).not.toBeNull();
    host.remove();
  });

  it("default status is 'ok' and is reflected as an attribute", async () => {
    const host = mount(`<ce-tool-result></ce-tool-result>`);
    const tr = host.querySelector("ce-tool-result") as CeToolResult;
    await ready(tr);
    expect(tr.status).toBe("ok");
    expect(tr.getAttribute("status")).toBe("ok");
    host.remove();
  });

  it("status='error' reflects and the error named slot is present in shadow DOM", async () => {
    const host = mount(`<ce-tool-result status="error"></ce-tool-result>`);
    const tr = host.querySelector("ce-tool-result") as CeToolResult;
    await ready(tr);
    expect(tr.getAttribute("status")).toBe("error");
    const errorSlot = tr.shadowRoot!.querySelector('slot[name="error"]');
    expect(errorSlot).not.toBeNull();
    host.remove();
  });

  it("renders the name in the header when name attribute is set", async () => {
    const host = mount(`<ce-tool-result name="search">result</ce-tool-result>`);
    const tr = host.querySelector("ce-tool-result") as CeToolResult;
    await ready(tr);
    const nameEl = tr.shadowRoot!.querySelector(".ce-tr__name");
    expect(nameEl).not.toBeNull();
    expect(nameEl!.textContent).toBe("search");
    host.remove();
  });

  it("formats duration-ms below 1s as '234 ms' and above as '1.2 s'", async () => {
    const host = mount(
      `<ce-tool-result duration-ms="234">a</ce-tool-result>
       <ce-tool-result duration-ms="1234">b</ce-tool-result>`,
    );
    const [a, b] = host.querySelectorAll("ce-tool-result");
    await ready(a);
    await ready(b);
    expect(a.shadowRoot!.querySelector(".ce-tr__duration")!.textContent).toBe("234 ms");
    expect(b.shadowRoot!.querySelector(".ce-tr__duration")!.textContent).toBe("1.2 s");
    host.remove();
  });

  it("shows '(no result)' placeholder when status='empty' and no children", async () => {
    const host = mount(`<ce-tool-result status="empty"></ce-tool-result>`);
    const tr = host.querySelector("ce-tool-result") as CeToolResult;
    await ready(tr);
    // Trigger slot update (empty slot fires slotchange once attached)
    await ready(tr);
    const placeholder = tr.shadowRoot!.querySelector(".ce-tr__empty");
    expect(placeholder).not.toBeNull();
    expect(placeholder!.textContent).toBe("(no result)");
    host.remove();
  });

  it("does NOT show placeholder when status='empty' and children are present", async () => {
    const host = mount(`<ce-tool-result status="empty"><span>some data</span></ce-tool-result>`);
    const tr = host.querySelector("ce-tool-result") as CeToolResult;
    await ready(tr);
    // Trigger slotchange by waiting for updates to settle
    await ready(tr);
    const slot = tr.shadowRoot!.querySelector("slot:not([name])") as HTMLSlotElement;
    // Manually fire slotchange since jsdom doesn't auto-fire it on initial attach
    slot.dispatchEvent(new Event("slotchange"));
    await ready(tr);
    const placeholder = tr.shadowRoot!.querySelector(".ce-tr__empty");
    expect(placeholder).toBeNull();
    host.remove();
  });

  it("compact attribute reflects to the host", async () => {
    const host = mount(`<ce-tool-result compact></ce-tool-result>`);
    const tr = host.querySelector("ce-tool-result") as CeToolResult;
    await ready(tr);
    expect(tr.compact).toBe(true);
    expect(tr.getAttribute("compact")).not.toBeNull();
    host.remove();
  });

  it("renders meta slot in shadow DOM", async () => {
    const host = mount(`<ce-tool-result><span slot="meta">cached</span></ce-tool-result>`);
    const tr = host.querySelector("ce-tool-result") as CeToolResult;
    await ready(tr);
    const metaSlot = tr.shadowRoot!.querySelector('slot[name="meta"]');
    expect(metaSlot).not.toBeNull();
    host.remove();
  });

  it("does not render default slot when status='error' (renders error slot instead)", async () => {
    const host = mount(`<ce-tool-result status="error"><span slot="error">boom</span></ce-tool-result>`);
    const tr = host.querySelector("ce-tool-result") as CeToolResult;
    await ready(tr);
    // When status=error, the .ce-tr__body div is replaced by .ce-tr__error
    const body = tr.shadowRoot!.querySelector(".ce-tr__body");
    expect(body).toBeNull();
    const errorContainer = tr.shadowRoot!.querySelector(".ce-tr__error");
    expect(errorContainer).not.toBeNull();
    host.remove();
  });
});
