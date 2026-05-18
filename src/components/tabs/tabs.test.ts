import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeTabs } from "./tabs.js";

beforeAll(() => {
  defineOnce("ce-tabs", CeTabs);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}
async function ready(el: Element): Promise<void> {
  await (el as CeTabs).updateComplete;
  // Slot change events fire after first paint; wait an extra microtask.
  await new Promise((r) => setTimeout(r, 0));
  await (el as CeTabs).updateComplete;
}

describe("<ce-tabs> — prop-based mode", () => {
  it("renders one chip per tab + a tablist with the correct aria-orientation", async () => {
    const host = mount(`
      <ce-tabs tabs='["A","B","C"]'>
        <div slot="panel">A</div>
        <div slot="panel">B</div>
        <div slot="panel">C</div>
      </ce-tabs>`);
    const el = host.querySelector("ce-tabs") as CeTabs;
    await ready(el);
    const chips = el.shadowRoot!.querySelectorAll(".chip");
    expect(chips.length).toBe(3);
    const list = el.shadowRoot!.querySelector("[role='tablist']")!;
    expect(list.getAttribute("aria-orientation")).toBe("horizontal");
    host.remove();
  });

  it("active tab gets aria-selected=true + tabindex=0; rest are -1", async () => {
    const host = mount(`
      <ce-tabs tabs='["A","B","C"]' active="1">
        <div slot="panel">A</div><div slot="panel">B</div><div slot="panel">C</div>
      </ce-tabs>`);
    const el = host.querySelector("ce-tabs") as CeTabs;
    await ready(el);
    const chips = el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".chip");
    expect(chips[1].getAttribute("aria-selected")).toBe("true");
    expect(chips[1].getAttribute("tabindex")).toBe("0");
    expect(chips[0].getAttribute("aria-selected")).toBe("false");
    expect(chips[0].getAttribute("tabindex")).toBe("-1");
    host.remove();
  });

  it("clicking a tab switches active and fires ce-tab-change", async () => {
    const host = mount(`
      <ce-tabs tabs='["A","B","C"]' active="0">
        <div slot="panel">A</div><div slot="panel">B</div><div slot="panel">C</div>
      </ce-tabs>`);
    const el = host.querySelector("ce-tabs") as CeTabs;
    await ready(el);
    let detail: any = null;
    el.addEventListener("ce-tab-change", (e) => (detail = (e as CustomEvent).detail));
    const chips = el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".chip");
    chips[2].click();
    await ready(el);
    expect(el.active).toBe(2);
    expect(detail).toEqual({ active: 2 });
    host.remove();
  });

  it("hides the inactive panels via the hidden attribute", async () => {
    const host = mount(`
      <ce-tabs tabs='["A","B"]' active="0">
        <div slot="panel" data-x="0">A</div>
        <div slot="panel" data-x="1">B</div>
      </ce-tabs>`);
    const el = host.querySelector("ce-tabs") as CeTabs;
    await ready(el);
    const a = host.querySelector('[data-x="0"]') as HTMLElement;
    const b = host.querySelector('[data-x="1"]') as HTMLElement;
    expect(a.hasAttribute("hidden")).toBe(false);
    expect(b.hasAttribute("hidden")).toBe(true);
    host.remove();
  });

  it("ArrowRight moves to next tab and switches active", async () => {
    const host = mount(`
      <ce-tabs tabs='["A","B","C"]' active="0">
        <div slot="panel">A</div><div slot="panel">B</div><div slot="panel">C</div>
      </ce-tabs>`);
    const el = host.querySelector("ce-tabs") as CeTabs;
    await ready(el);
    const chips = el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".chip");
    chips[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await ready(el);
    expect(el.active).toBe(1);
    host.remove();
  });

  it("ArrowLeft from index 0 wraps to last", async () => {
    const host = mount(`
      <ce-tabs tabs='["A","B","C"]' active="0">
        <div slot="panel">A</div><div slot="panel">B</div><div slot="panel">C</div>
      </ce-tabs>`);
    const el = host.querySelector("ce-tabs") as CeTabs;
    await ready(el);
    const chips = el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".chip");
    chips[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    await ready(el);
    expect(el.active).toBe(2);
    host.remove();
  });

  it("Home + End jump to first/last enabled", async () => {
    const host = mount(`
      <ce-tabs active="1" tabs='[{"label":"A"},{"label":"B"},{"label":"C","disabled":true},{"label":"D"}]'>
        <div slot="panel">A</div><div slot="panel">B</div><div slot="panel">C</div><div slot="panel">D</div>
      </ce-tabs>`);
    const el = host.querySelector("ce-tabs") as CeTabs;
    await ready(el);
    const chips = el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".chip");
    chips[1].dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await ready(el);
    // End should jump to last enabled (index 3, since 2 is disabled but 3 isn't)
    expect(el.active).toBe(3);
    host.remove();
  });

  it("disabled tabs are skipped during arrow navigation", async () => {
    const host = mount(`
      <ce-tabs active="0" tabs='[{"label":"A"},{"label":"B","disabled":true},{"label":"C"}]'>
        <div slot="panel">A</div><div slot="panel">B</div><div slot="panel">C</div>
      </ce-tabs>`);
    const el = host.querySelector("ce-tabs") as CeTabs;
    await ready(el);
    const chips = el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".chip");
    chips[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await ready(el);
    expect(el.active).toBe(2); // jumped over B
    host.remove();
  });

  it("badge prop renders inside the chip", async () => {
    const host = mount(`
      <ce-tabs tabs='[{"label":"Inbox","badge":4},{"label":"Archive"}]' active="0">
        <div slot="panel">A</div><div slot="panel">B</div>
      </ce-tabs>`);
    const el = host.querySelector("ce-tabs") as CeTabs;
    await ready(el);
    const badges = el.shadowRoot!.querySelectorAll(".badge");
    expect(badges.length).toBe(1);
    expect(badges[0].textContent).toBe("4");
    host.remove();
  });

  it("vertical attribute switches aria-orientation and key bindings", async () => {
    const host = mount(`
      <ce-tabs vertical tabs='["A","B","C"]' active="0">
        <div slot="panel">A</div><div slot="panel">B</div><div slot="panel">C</div>
      </ce-tabs>`);
    const el = host.querySelector("ce-tabs") as CeTabs;
    await ready(el);
    const list = el.shadowRoot!.querySelector("[role='tablist']")!;
    expect(list.getAttribute("aria-orientation")).toBe("vertical");
    const chips = el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".chip");
    chips[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await ready(el);
    expect(el.active).toBe(1);
    host.remove();
  });
});

describe("<ce-tabs> — slot-based mode", () => {
  it("uses slotted buttons as the tab strip when tabs prop is empty", async () => {
    const host = mount(`
      <ce-tabs active="0">
        <button slot="tab">Overview</button>
        <button slot="tab">Settings</button>
        <div slot="panel">Overview content</div>
        <div slot="panel">Settings content</div>
      </ce-tabs>`);
    const el = host.querySelector("ce-tabs") as CeTabs;
    await ready(el);
    const tabs = host.querySelectorAll<HTMLButtonElement>("button[slot='tab']");
    expect(tabs.length).toBe(2);
    expect(tabs[0].getAttribute("role")).toBe("tab");
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[1].getAttribute("aria-selected")).toBe("false");
    expect(tabs[0].tabIndex).toBe(0);
    expect(tabs[1].tabIndex).toBe(-1);
    host.remove();
  });

  it("clicking a slotted tab switches active + fires ce-tab-change", async () => {
    const host = mount(`
      <ce-tabs active="0">
        <button slot="tab">A</button>
        <button slot="tab">B</button>
        <div slot="panel">A</div>
        <div slot="panel">B</div>
      </ce-tabs>`);
    const el = host.querySelector("ce-tabs") as CeTabs;
    await ready(el);
    let detail: any = null;
    el.addEventListener("ce-tab-change", (e) => (detail = (e as CustomEvent).detail));
    const tabs = host.querySelectorAll<HTMLButtonElement>("button[slot='tab']");
    tabs[1].click();
    await ready(el);
    expect(el.active).toBe(1);
    expect(detail).toEqual({ active: 1 });
    host.remove();
  });
});
