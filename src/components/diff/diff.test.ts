import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeDiff } from "./diff.js";

beforeAll(() => {
  defineOnce("ce-diff", CeDiff);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeDiff).updateComplete;
}

describe("<ce-diff>", () => {
  it("renders unified rows with markers", async () => {
    const host = mount(
      `<ce-diff before="a\nb\nc" after="a\nB\nc"></ce-diff>`
    );
    const el = host.querySelector("ce-diff") as CeDiff;
    await ready(el);
    const adds = el.shadowRoot!.querySelectorAll("tr.add").length;
    const dels = el.shadowRoot!.querySelectorAll("tr.del").length;
    expect(adds).toBe(1);
    expect(dels).toBe(1);
    host.remove();
  });

  it("identical inputs render context-only", async () => {
    const host = mount(`<ce-diff before="x" after="x"></ce-diff>`);
    const el = host.querySelector("ce-diff") as CeDiff;
    await ready(el);
    expect(el.shadowRoot!.querySelectorAll("tr.add").length).toBe(0);
    expect(el.shadowRoot!.querySelectorAll("tr.del").length).toBe(0);
    host.remove();
  });

  it("split layout reflects + emits 4-column rows", async () => {
    const host = mount(
      `<ce-diff layout="split" before="a" after="b"></ce-diff>`
    );
    const el = host.querySelector("ce-diff") as CeDiff;
    await ready(el);
    expect(el.getAttribute("layout")).toBe("split");
    const cells = el.shadowRoot!.querySelectorAll("tr.del td").length;
    expect(cells).toBe(4);
    host.remove();
  });

  it("language attribute renders as pill", async () => {
    const host = mount(
      `<ce-diff language="ts" before="a" after="b"></ce-diff>`
    );
    const el = host.querySelector("ce-diff") as CeDiff;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".pill")!.textContent).toContain("ts");
    host.remove();
  });

  it("header reports add/del counts", async () => {
    const host = mount(
      `<ce-diff before="x\ny" after="X\nY\nZ"></ce-diff>`
    );
    const el = host.querySelector("ce-diff") as CeDiff;
    await ready(el);
    const header = el.shadowRoot!.querySelector("header")!;
    expect(header.textContent).toContain("+3");
    expect(header.textContent).toContain("−2");
    host.remove();
  });

  it("supports text via slots", async () => {
    const host = mount(
      `<ce-diff><pre slot="before">old</pre><pre slot="after">new</pre></ce-diff>`
    );
    const el = host.querySelector("ce-diff") as CeDiff;
    await ready(el);
    expect(el.shadowRoot!.querySelectorAll("tr.add").length).toBe(1);
    expect(el.shadowRoot!.querySelectorAll("tr.del").length).toBe(1);
    host.remove();
  });

  it("renders empty diff when both sides empty", async () => {
    const host = mount(`<ce-diff></ce-diff>`);
    const el = host.querySelector("ce-diff") as CeDiff;
    await ready(el);
    // Single empty line on both sides → 1 ctx row
    const rows = el.shadowRoot!.querySelectorAll("tbody tr").length;
    expect(rows).toBe(1);
    host.remove();
  });
});
