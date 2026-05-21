import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeCountdown } from "./countdown.js";

beforeAll(() => {
  defineOnce("ce-countdown", CeCountdown);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeCountdown).updateComplete;
}

function isoMinutesFromNow(min: number): string {
  return new Date(Date.now() + min * 60_000).toISOString();
}

describe("<ce-countdown>", () => {
  it("renders hms segments for a near-future target", async () => {
    const host = mount(
      `<ce-countdown target=${JSON.stringify(isoMinutesFromNow(65))} format="hms"></ce-countdown>`
    );
    const el = host.querySelector("ce-countdown") as CeCountdown;
    await ready(el);
    const segs = Array.from(el.shadowRoot!.querySelectorAll(".ce-countdown__seg .value")).map(
      (n) => n.textContent
    );
    expect(segs.length).toBe(3);
    expect(segs[0]).toBe("01");
    expect(segs[1]).toMatch(/^0[45]$/);
    expect(segs[2]).toMatch(/^\d{2}$/);
    host.remove();
  });

  it("auto-trims the days segment when 0 in dhms", async () => {
    const host = mount(
      `<ce-countdown target=${JSON.stringify(isoMinutesFromNow(30))} format="dhms"></ce-countdown>`
    );
    const el = host.querySelector("ce-countdown") as CeCountdown;
    await ready(el);
    const segs = el.shadowRoot!.querySelectorAll(".ce-countdown__seg");
    expect(segs.length).toBe(3); // h, m, s — no d
    host.remove();
  });

  it("renders all four segments when days > 0", async () => {
    const host = mount(
      `<ce-countdown target=${JSON.stringify(isoMinutesFromNow(60 * 24 * 3))} format="dhms"></ce-countdown>`
    );
    const el = host.querySelector("ce-countdown") as CeCountdown;
    await ready(el);
    const segs = el.shadowRoot!.querySelectorAll(".ce-countdown__seg");
    expect(segs.length).toBe(4); // d h m s
    host.remove();
  });

  it("renders ms format with two segments", async () => {
    const host = mount(
      `<ce-countdown target=${JSON.stringify(isoMinutesFromNow(2))} format="ms"></ce-countdown>`
    );
    const el = host.querySelector("ce-countdown") as CeCountdown;
    await ready(el);
    const segs = el.shadowRoot!.querySelectorAll(".ce-countdown__seg");
    expect(segs.length).toBe(2);
    host.remove();
  });

  it("includes labels when labels attribute is set", async () => {
    const host = mount(
      `<ce-countdown target=${JSON.stringify(isoMinutesFromNow(120))} format="hms" labels></ce-countdown>`
    );
    const el = host.querySelector("ce-countdown") as CeCountdown;
    await ready(el);
    const lbls = el.shadowRoot!.querySelectorAll(".ce-countdown__seg .label");
    expect(lbls.length).toBe(3);
    host.remove();
  });

  it("clamps to zero and fires ce-countdown-end for a past target", async () => {
    const past = new Date(Date.now() - 5_000).toISOString();
    const host = mount(`<ce-countdown target=${JSON.stringify(past)} tick-ms="10"></ce-countdown>`);
    const el = host.querySelector("ce-countdown") as CeCountdown;
    await ready(el);
    let fired: { target: string } | null = null;
    el.addEventListener("ce-countdown-end", (e) => {
      fired = (e as CustomEvent).detail as { target: string };
    });
    await new Promise((r) => setTimeout(r, 30));
    expect(fired).not.toBeNull();
    expect(fired!.target).toBe(past);
    host.remove();
  });

  it("renders zeroed segments when target is missing", async () => {
    const host = mount(`<ce-countdown></ce-countdown>`);
    const el = host.querySelector("ce-countdown") as CeCountdown;
    await ready(el);
    const segs = Array.from(el.shadowRoot!.querySelectorAll(".ce-countdown__seg .value")).map(
      (n) => n.textContent
    );
    expect(segs).toEqual(["00", "00", "00"]);
    host.remove();
  });
});
