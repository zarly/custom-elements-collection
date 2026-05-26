import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeFrame } from "./frame.js";

beforeAll(() => {
  defineOnce("ce-frame", CeFrame);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeFrame).updateComplete;
}

describe("<ce-frame>", () => {
  it("upgrades and renders a shadow root", async () => {
    const host = mount(`<ce-frame></ce-frame>`);
    const frame = host.querySelector("ce-frame")!;
    await ready(frame);
    expect(frame.shadowRoot).not.toBeNull();
    host.remove();
  });

  it("defaults ratio to 16:9 when no attributes are set", async () => {
    const host = mount(`<ce-frame></ce-frame>`);
    const frame = host.querySelector("ce-frame") as CeFrame;
    await ready(frame);
    expect(frame.ratio).toBe("16:9");
    host.remove();
  });

  it("defaults fit to cover when no attributes are set", async () => {
    const host = mount(`<ce-frame></ce-frame>`);
    const frame = host.querySelector("ce-frame") as CeFrame;
    await ready(frame);
    expect(frame.fit).toBe("cover");
    host.remove();
  });

  it("reflects ratio attribute for all 6 values", async () => {
    const ratios = ["1:1", "4:3", "16:9", "21:9", "3:4", "golden"] as const;
    for (const ratio of ratios) {
      const host = mount(`<ce-frame ratio="${ratio}"></ce-frame>`);
      const frame = host.querySelector("ce-frame") as CeFrame;
      await ready(frame);
      expect(frame.getAttribute("ratio")).toBe(ratio);
      expect(frame.ratio).toBe(ratio);
      host.remove();
    }
  });

  it("reflects fit attribute for both values", async () => {
    for (const fit of ["cover", "contain"] as const) {
      const host = mount(`<ce-frame fit="${fit}"></ce-frame>`);
      const frame = host.querySelector("ce-frame") as CeFrame;
      await ready(frame);
      expect(frame.getAttribute("fit")).toBe(fit);
      expect(frame.fit).toBe(fit);
      host.remove();
    }
  });

  it("slots an img child and the default slot exists in shadow DOM", async () => {
    const host = mount(`
      <ce-frame ratio="16:9">
        <img src="hero.jpg" alt="hero">
      </ce-frame>
    `);
    const frame = host.querySelector("ce-frame") as CeFrame;
    await ready(frame);

    // The default slot must be present in shadow DOM
    const shadow = frame.shadowRoot!;
    const slot = shadow.querySelector("slot:not([name])");
    expect(slot).not.toBeNull();

    // The img is a light-DOM child of ce-frame (slotted)
    const img = frame.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toBe("hero.jpg");
    host.remove();
  });

  it("aspect-ratio attribute is reflected correctly for 1:1", async () => {
    // jsdom does not compute CSS layout (aspect-ratio always returns ""),
    // so we verify the reflected attribute — the contract that drives the
    // :host([ratio="1:1"]) CSS selector in the shadow stylesheet.
    const frame = document.createElement("ce-frame") as CeFrame;
    frame.ratio = "1:1";
    document.body.appendChild(frame);
    await frame.updateComplete;

    expect(frame.getAttribute("ratio")).toBe("1:1");
    expect(frame.ratio).toBe("1:1");

    document.body.removeChild(frame);
  });

  it("default ratio attribute is 16:9 when element is created imperatively", async () => {
    // jsdom does not compute CSS layout, so we verify the reflected attribute
    // which is the selector key for the :host([ratio="16:9"]) CSS rule.
    const frame = document.createElement("ce-frame") as CeFrame;
    document.body.appendChild(frame);
    await frame.updateComplete;

    // Default ratio property must be 16:9
    expect(frame.ratio).toBe("16:9");
    // And the attribute must be reflected
    expect(frame.getAttribute("ratio")).toBe("16:9");

    document.body.removeChild(frame);
  });

  it("setting ratio property updates the attribute", async () => {
    const host = mount(`<ce-frame></ce-frame>`);
    const frame = host.querySelector("ce-frame") as CeFrame;
    await ready(frame);

    frame.ratio = "3:4";
    await frame.updateComplete;

    expect(frame.getAttribute("ratio")).toBe("3:4");
    host.remove();
  });

  it("setting fit property updates the attribute", async () => {
    const host = mount(`<ce-frame></ce-frame>`);
    const frame = host.querySelector("ce-frame") as CeFrame;
    await ready(frame);

    frame.fit = "contain";
    await frame.updateComplete;

    expect(frame.getAttribute("fit")).toBe("contain");
    host.remove();
  });
});
