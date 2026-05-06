import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeClock } from "./clock.js";

beforeAll(() => {
  defineOnce("ce-clock", CeClock);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeClock).updateComplete;
}

describe("<ce-clock>", () => {
  it("renders absolute time by default", async () => {
    const host = mount(`<ce-clock tick-ms="0"></ce-clock>`);
    const el = host.querySelector("ce-clock") as CeClock;
    await ready(el);
    const abs = el.shadowRoot!.querySelector(".abs")!;
    expect(abs.textContent).toMatch(/\d{1,2}:\d{2}/);
    host.remove();
  });

  it("renders relative time when format=relative and since is set", async () => {
    const host = mount(
      `<ce-clock format="relative" tick-ms="0" since="${new Date(
        Date.now() - 5 * 60_000
      ).toISOString()}"></ce-clock>`
    );
    const el = host.querySelector("ce-clock") as CeClock;
    await ready(el);
    const rel = el.shadowRoot!.querySelector(".rel")!;
    expect(rel).not.toBeNull();
    expect(rel.textContent!.length).toBeGreaterThan(0);
    host.remove();
  });

  it("format=both renders absolute and relative when since is set", async () => {
    const host = mount(
      `<ce-clock format="both" tick-ms="0" since="${new Date(
        Date.now() - 60_000
      ).toISOString()}"></ce-clock>`
    );
    const el = host.querySelector("ce-clock") as CeClock;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".abs")).not.toBeNull();
    expect(el.shadowRoot!.querySelector(".rel")).not.toBeNull();
    host.remove();
  });

  it("does not render relative without since", async () => {
    const host = mount(`<ce-clock format="relative" tick-ms="0"></ce-clock>`);
    const el = host.querySelector("ce-clock") as CeClock;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".rel")).toBeNull();
    host.remove();
  });

  it("reflects format attribute", async () => {
    const host = mount(`<ce-clock format="both" tick-ms="0"></ce-clock>`);
    const el = host.querySelector("ce-clock") as CeClock;
    await ready(el);
    expect(el.getAttribute("format")).toBe("both");
    host.remove();
  });

  it("respects tz attribute", async () => {
    const host = mount(`<ce-clock tz="UTC" tick-ms="0"></ce-clock>`);
    const el = host.querySelector("ce-clock") as CeClock;
    await ready(el);
    expect(el.tz).toBe("UTC");
    expect(el.shadowRoot!.querySelector(".abs")).not.toBeNull();
    host.remove();
  });

  it("does not start an interval timer when tick-ms=0", async () => {
    const host = mount(`<ce-clock tick-ms="0"></ce-clock>`);
    const el = host.querySelector("ce-clock") as CeClock;
    await ready(el);
    expect(el.tickMs).toBe(0);
    host.remove();
  });
});
