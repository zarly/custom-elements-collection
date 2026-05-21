import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeDuration } from "./duration.js";

beforeAll(() => {
  defineOnce("ce-duration", CeDuration);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeDuration).updateComplete;
}

function text(el: CeDuration): string {
  return (el.shadowRoot!.querySelector(".ce-duration__value")?.textContent ?? "").trim();
}

describe("<ce-duration>", () => {
  it("formats compact h m output", async () => {
    const host = mount(`<ce-duration seconds="3725"></ce-duration>`);
    const el = host.querySelector("ce-duration") as CeDuration;
    await ready(el);
    expect(text(el)).toBe("1h 2m");
    host.remove();
  });

  it("respects the units cap", async () => {
    const host = mount(`<ce-duration seconds="3725" units="3"></ce-duration>`);
    const el = host.querySelector("ce-duration") as CeDuration;
    await ready(el);
    expect(text(el)).toBe("1h 2m 5s");
    host.remove();
  });

  it("formats long form with correct plurals", async () => {
    const host = mount(`<ce-duration seconds="3725" units="3" format="long"></ce-duration>`);
    const el = host.querySelector("ce-duration") as CeDuration;
    await ready(el);
    expect(text(el)).toBe("1 hour 2 minutes 5 seconds");
    host.remove();
  });

  it("renders days for large durations", async () => {
    const host = mount(`<ce-duration seconds="${(2 * 86400 + 3 * 3600).toString()}" units="2"></ce-duration>`);
    const el = host.querySelector("ce-duration") as CeDuration;
    await ready(el);
    expect(text(el)).toBe("2d 3h");
    host.remove();
  });

  it("renders ms for sub-second durations", async () => {
    const host = mount(`<ce-duration ms="250"></ce-duration>`);
    const el = host.querySelector("ce-duration") as CeDuration;
    await ready(el);
    expect(text(el)).toBe("250ms");
    host.remove();
  });

  it("renders 0s for zero input", async () => {
    const host = mount(`<ce-duration></ce-duration>`);
    const el = host.querySelector("ce-duration") as CeDuration;
    await ready(el);
    expect(text(el)).toBe("0s");
    host.remove();
  });

  it("handles ms ≥ 1000 by falling back to seconds path", async () => {
    const host = mount(`<ce-duration ms="2500"></ce-duration>`);
    const el = host.querySelector("ce-duration") as CeDuration;
    await ready(el);
    expect(text(el)).toBe("2s");
    host.remove();
  });
});
