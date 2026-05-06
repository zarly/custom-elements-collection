import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeBadge } from "./badge.js";

beforeAll(() => {
  defineOnce("ce-badge", CeBadge);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeBadge).updateComplete;
}

describe("<ce-badge>", () => {
  it("renders count as text", async () => {
    const host = mount(`<ce-badge count="3">Inbox</ce-badge>`);
    const el = host.querySelector("ce-badge") as CeBadge;
    await ready(el);
    const pip = el.shadowRoot!.querySelector(".ce-badge__pip")!;
    expect(pip.textContent?.trim()).toBe("3");
    host.remove();
  });

  it("clamps to max with + suffix", async () => {
    const host = mount(`<ce-badge count="500" max="99">Inbox</ce-badge>`);
    const el = host.querySelector("ce-badge") as CeBadge;
    await ready(el);
    const pip = el.shadowRoot!.querySelector(".ce-badge__pip")!;
    expect(pip.textContent?.trim()).toBe("99+");
    host.remove();
  });

  it("dot mode renders empty pip", async () => {
    const host = mount(`<ce-badge dot variant="green">Updates</ce-badge>`);
    const el = host.querySelector("ce-badge") as CeBadge;
    await ready(el);
    const pip = el.shadowRoot!.querySelector(".ce-badge__pip")!;
    expect(pip.textContent?.trim()).toBe("");
    expect(el.hasAttribute("dot")).toBe(true);
    host.remove();
  });

  it("variant attribute reflects", async () => {
    const host = mount(`<ce-badge variant="blue" count="2">x</ce-badge>`);
    const el = host.querySelector("ce-badge") as CeBadge;
    await ready(el);
    expect(el.getAttribute("variant")).toBe("blue");
    host.remove();
  });

  it("renders empty pip when no count and no dot", async () => {
    const host = mount(`<ce-badge>x</ce-badge>`);
    const el = host.querySelector("ce-badge") as CeBadge;
    await ready(el);
    const pip = el.shadowRoot!.querySelector(".ce-badge__pip");
    expect(pip).not.toBeNull();
    expect(pip!.textContent?.trim()).toBe("");
    expect(el.hasAttribute("count")).toBe(false);
    expect(el.hasAttribute("dot")).toBe(false);
    host.remove();
  });

  it("default slot passes through", async () => {
    const host = mount(`<ce-badge count="1"><span class="x">child</span></ce-badge>`);
    const el = host.querySelector("ce-badge") as CeBadge;
    await ready(el);
    expect(el.querySelector(".x")).not.toBeNull();
    host.remove();
  });

  it("accepts JS property update", async () => {
    const host = mount(`<ce-badge count="1">x</ce-badge>`);
    const el = host.querySelector("ce-badge") as CeBadge;
    await ready(el);
    el.count = 7;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".ce-badge__pip")!.textContent?.trim()).toBe("7");
    host.remove();
  });
});
