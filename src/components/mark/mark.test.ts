import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeMark } from "./mark.js";

beforeAll(() => {
  defineOnce("ce-mark", CeMark);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeMark).updateComplete;
}

describe("<ce-mark>", () => {
  it("renders slotted text", async () => {
    const host = mount(`<p>The <ce-mark>quick brown</ce-mark> fox.</p>`);
    const el = host.querySelector("ce-mark") as CeMark;
    await ready(el);
    expect(el.textContent?.trim()).toBe("quick brown");
    host.remove();
  });

  it("reflects color attribute", async () => {
    const host = mount(`<ce-mark color="green">ok</ce-mark>`);
    const el = host.querySelector("ce-mark") as CeMark;
    await ready(el);
    expect(el.getAttribute("color")).toBe("green");
    host.remove();
  });

  it("reflects weight attribute", async () => {
    const host = mount(`<ce-mark weight="strong">bold</ce-mark>`);
    const el = host.querySelector("ce-mark") as CeMark;
    await ready(el);
    expect(el.getAttribute("weight")).toBe("strong");
    host.remove();
  });

  it("attaches a shadow root with a default slot", async () => {
    const host = mount(`<ce-mark>x</ce-mark>`);
    const el = host.querySelector("ce-mark") as CeMark;
    await ready(el);
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot!.querySelector("slot")).not.toBeNull();
    host.remove();
  });

  it("accepts inline nested elements in the slot", async () => {
    const host = mount(`<ce-mark><strong>bold</strong> normal</ce-mark>`);
    const el = host.querySelector("ce-mark") as CeMark;
    await ready(el);
    expect(el.querySelector("strong")?.textContent).toBe("bold");
    host.remove();
  });

  it("defaults to no explicit color and subtle weight", async () => {
    const host = mount(`<ce-mark>x</ce-mark>`);
    const el = host.querySelector("ce-mark") as CeMark;
    await ready(el);
    expect(el.color).toBeNull();
    expect(el.weight).toBe("subtle");
    host.remove();
  });
});
