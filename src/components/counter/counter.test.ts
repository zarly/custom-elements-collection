import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeCounter } from "./counter.js";

beforeAll(() => {
  defineOnce("ce-counter", CeCounter);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeCounter).updateComplete;
}

describe("<ce-counter>", () => {
  it("renders initial value (no animation when from=value)", async () => {
    const host = mount(`<ce-counter value="42" duration-ms="0"></ce-counter>`);
    const el = host.querySelector("ce-counter") as CeCounter;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".num")!.textContent).toBe("42");
    host.remove();
  });

  it("renders prefix and suffix", async () => {
    const host = mount(
      `<ce-counter value="2500" prefix="$" suffix=" USD" duration-ms="0"></ce-counter>`
    );
    const el = host.querySelector("ce-counter") as CeCounter;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".prefix")!.textContent).toBe("$");
    expect(el.shadowRoot!.querySelector(".suffix")!.textContent).toBe(" USD");
    host.remove();
  });

  it("decimals formatting", async () => {
    const host = mount(
      `<ce-counter value="3.14" decimals="2" duration-ms="0"></ce-counter>`
    );
    const el = host.querySelector("ce-counter") as CeCounter;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".num")!.textContent).toBe("3.14");
    host.remove();
  });

  it("trend up renders caret", async () => {
    const host = mount(`<ce-counter value="10" trend="up" duration-ms="0"></ce-counter>`);
    const el = host.querySelector("ce-counter") as CeCounter;
    await ready(el);
    const trend = el.shadowRoot!.querySelector(".trend")!;
    expect(trend.textContent).toContain("▲");
    expect(el.getAttribute("trend")).toBe("up");
    host.remove();
  });

  it("trend down renders caret", async () => {
    const host = mount(`<ce-counter value="10" trend="down" duration-ms="0"></ce-counter>`);
    const el = host.querySelector("ce-counter") as CeCounter;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".trend")!.textContent).toContain("▼");
    host.remove();
  });

  it("updates value via property assignment", async () => {
    const host = mount(`<ce-counter value="1" duration-ms="0"></ce-counter>`);
    const el = host.querySelector("ce-counter") as CeCounter;
    await ready(el);
    el.value = 99;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".num")!.textContent).toBe("99");
    host.remove();
  });

  it("from attribute sets starting value", async () => {
    const host = mount(`<ce-counter value="100" from="10" duration-ms="0"></ce-counter>`);
    const el = host.querySelector("ce-counter") as CeCounter;
    await ready(el);
    expect(el.from).toBe(10);
    host.remove();
  });
});
