import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeProsCons } from "./pros-cons.js";

beforeAll(() => {
  defineOnce("ce-pros-cons", CeProsCons);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeProsCons).updateComplete;
}

describe("<ce-pros-cons>", () => {
  it("renders two columns: pros and cons", async () => {
    const host = mount(
      `<ce-pros-cons pros='["a","b"]' cons='["x"]'></ce-pros-cons>`,
    );
    const pc = host.querySelector("ce-pros-cons") as CeProsCons;
    await ready(pc);
    expect(pc.shadowRoot!.querySelector('[data-kind="pros"]')).not.toBeNull();
    expect(pc.shadowRoot!.querySelector('[data-kind="cons"]')).not.toBeNull();
    host.remove();
  });

  it("renders items from JSON arrays", async () => {
    const host = mount(
      `<ce-pros-cons pros='["fast","cheap"]' cons='["risky"]'></ce-pros-cons>`,
    );
    const pc = host.querySelector("ce-pros-cons") as CeProsCons;
    await ready(pc);
    const prosItems = pc.shadowRoot!.querySelectorAll('[data-kind="pros"] li');
    const consItems = pc.shadowRoot!.querySelectorAll('[data-kind="cons"] li');
    expect(prosItems.length).toBe(2);
    expect(consItems.length).toBe(1);
    expect(prosItems[0].textContent).toContain("fast");
    expect(consItems[0].textContent).toContain("risky");
    host.remove();
  });

  it("uses default headers Pros and Cons when no label attrs are set", async () => {
    const host = mount(`<ce-pros-cons pros='["x"]' cons='["y"]'></ce-pros-cons>`);
    const pc = host.querySelector("ce-pros-cons") as CeProsCons;
    await ready(pc);
    const headers = pc.shadowRoot!.querySelectorAll(".head");
    expect(headers[0].textContent).toContain("Pros");
    expect(headers[1].textContent).toContain("Cons");
    host.remove();
  });

  it("uses pros-label and cons-label attrs when provided", async () => {
    const host = mount(
      `<ce-pros-cons pros='["a"]' cons='["b"]' pros-label="Benefits" cons-label="Risks"></ce-pros-cons>`,
    );
    const pc = host.querySelector("ce-pros-cons") as CeProsCons;
    await ready(pc);
    const headers = pc.shadowRoot!.querySelectorAll(".head");
    expect(headers[0].textContent).toContain("Benefits");
    expect(headers[1].textContent).toContain("Risks");
    host.remove();
  });

  it("falls back to slotted children when the corresponding array is empty (CDR-005)", async () => {
    const host = mount(`
      <ce-pros-cons>
        <li slot="pros">handwritten pro</li>
        <li slot="cons">handwritten con</li>
      </ce-pros-cons>
    `);
    const pc = host.querySelector("ce-pros-cons") as CeProsCons;
    await ready(pc);
    const slotNames = Array.from(pc.shadowRoot!.querySelectorAll("slot")).map(
      (s) => s.getAttribute("name"),
    );
    expect(slotNames).toContain("pros");
    expect(slotNames).toContain("cons");
    expect(pc.textContent).toContain("handwritten pro");
    host.remove();
  });

  it("supports mixing JSON for one column and slot for the other", async () => {
    const host = mount(`
      <ce-pros-cons pros='["json pro 1","json pro 2"]'>
        <li slot="cons">slotted con</li>
      </ce-pros-cons>
    `);
    const pc = host.querySelector("ce-pros-cons") as CeProsCons;
    await ready(pc);
    const prosItems = pc.shadowRoot!.querySelectorAll('[data-kind="pros"] li');
    expect(prosItems.length).toBe(2);
    const consSlot = pc.shadowRoot!.querySelector('[data-kind="cons"] slot[name="cons"]');
    expect(consSlot).not.toBeNull();
    host.remove();
  });

  it("renders icons with aria-hidden=true (decorative)", async () => {
    const host = mount(`<ce-pros-cons pros='["a"]' cons='["b"]'></ce-pros-cons>`);
    const pc = host.querySelector("ce-pros-cons") as CeProsCons;
    await ready(pc);
    const icons = pc.shadowRoot!.querySelectorAll(".icon");
    expect(icons.length).toBe(2);
    icons.forEach((i) => expect(i.getAttribute("aria-hidden")).toBe("true"));
    host.remove();
  });
});
