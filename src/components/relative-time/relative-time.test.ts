import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeRelativeTime } from "./relative-time.js";

beforeAll(() => {
  defineOnce("ce-relative-time", CeRelativeTime);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeRelativeTime).updateComplete;
}

function isoMinutesAgo(min: number): string {
  return new Date(Date.now() - min * 60_000).toISOString();
}

function isoMinutesFromNow(min: number): string {
  return new Date(Date.now() + min * 60_000).toISOString();
}

describe("<ce-relative-time>", () => {
  it("renders a past minute count when datetime is a few minutes ago", async () => {
    const host = mount(`<ce-relative-time datetime=${JSON.stringify(isoMinutesAgo(3))}></ce-relative-time>`);
    const el = host.querySelector("ce-relative-time") as CeRelativeTime;
    await ready(el);
    const text = el.shadowRoot!.querySelector("time")!.textContent ?? "";
    expect(text).toMatch(/3.*minute/);
    host.remove();
  });

  it("renders future tense when datetime is in the future", async () => {
    const host = mount(`<ce-relative-time datetime=${JSON.stringify(isoMinutesFromNow(2))}></ce-relative-time>`);
    const el = host.querySelector("ce-relative-time") as CeRelativeTime;
    await ready(el);
    const text = el.shadowRoot!.querySelector("time")!.textContent ?? "";
    expect(text.toLowerCase()).toContain("in");
    host.remove();
  });

  it("renders an empty string when datetime is missing or invalid", async () => {
    const host = mount(`<ce-relative-time></ce-relative-time>`);
    const el = host.querySelector("ce-relative-time") as CeRelativeTime;
    await ready(el);
    expect(el.shadowRoot!.querySelector("time")!.textContent).toBe("");
    host.remove();
  });

  it("emits a semantic <time> element with the datetime attribute", async () => {
    const iso = isoMinutesAgo(10);
    const host = mount(`<ce-relative-time datetime=${JSON.stringify(iso)}></ce-relative-time>`);
    const el = host.querySelector("ce-relative-time") as CeRelativeTime;
    await ready(el);
    const time = el.shadowRoot!.querySelector("time")!;
    expect(time.getAttribute("datetime")).toBe(iso);
    host.remove();
  });

  it("switches to hours after 60 minutes", async () => {
    const host = mount(`<ce-relative-time datetime=${JSON.stringify(isoMinutesAgo(120))}></ce-relative-time>`);
    const el = host.querySelector("ce-relative-time") as CeRelativeTime;
    await ready(el);
    expect(el.shadowRoot!.querySelector("time")!.textContent).toMatch(/hour/);
    host.remove();
  });

  it("respects the numeric attribute", async () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    const host = mount(`
      <ce-relative-time datetime=${JSON.stringify(yesterday)} numeric="auto"></ce-relative-time>
      <ce-relative-time datetime=${JSON.stringify(yesterday)} numeric="always"></ce-relative-time>
    `);
    const els = host.querySelectorAll("ce-relative-time");
    for (const e of els) await (e as CeRelativeTime).updateComplete;
    const a = els[0].shadowRoot!.querySelector("time")!.textContent ?? "";
    const b = els[1].shadowRoot!.querySelector("time")!.textContent ?? "";
    expect(b).toMatch(/1.*day/);
    expect(a.length).toBeGreaterThan(0);
    host.remove();
  });
});
