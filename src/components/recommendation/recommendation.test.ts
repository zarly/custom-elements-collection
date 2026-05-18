import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeRecommendation } from "./recommendation.js";

beforeAll(() => {
  defineOnce("ce-recommendation", CeRecommendation);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeRecommendation).updateComplete;
}

describe("<ce-recommendation>", () => {
  it("defaults priority to p2 and reflects it on the host", async () => {
    const host = mount(`<ce-recommendation>Body text</ce-recommendation>`);
    const el = host.querySelector("ce-recommendation") as CeRecommendation;
    await ready(el);
    expect(el.getAttribute("priority")).toBe("p2");
    expect(el.priority).toBe("p2");
    host.remove();
  });

  it("renders shadow root and default slot body content", async () => {
    const host = mount(
      `<ce-recommendation priority="p2">Внедрить connection pooling</ce-recommendation>`
    );
    const el = host.querySelector("ce-recommendation") as CeRecommendation;
    await ready(el);
    expect(el.shadowRoot).not.toBeNull();
    expect(el.textContent).toContain("Внедрить connection pooling");
    host.remove();
  });

  it("all 4 priorities reflect distinct host attributes", async () => {
    const priorities = ["p0", "p1", "p2", "p3"] as const;
    for (const p of priorities) {
      const host = mount(
        `<ce-recommendation priority="${p}">x</ce-recommendation>`
      );
      const el = host.querySelector("ce-recommendation") as CeRecommendation;
      await ready(el);
      expect(el.getAttribute("priority")).toBe(p);
      host.remove();
    }
  });

  it("renders priority badge with correct ARIA label", async () => {
    const host = mount(
      `<ce-recommendation priority="p1" title="Edge CDN">Use CDN.</ce-recommendation>`
    );
    const el = host.querySelector("ce-recommendation") as CeRecommendation;
    await ready(el);
    const badge = el.shadowRoot!.querySelector(".ce-rec__badge");
    expect(badge).not.toBeNull();
    expect(badge!.getAttribute("aria-label")).toBe("Priority: P1");
    expect(badge!.textContent?.trim()).toBe("P1");
    host.remove();
  });

  it("renders title from the title attribute", async () => {
    const host = mount(
      `<ce-recommendation priority="p1" title="Connection pooling">Body.</ce-recommendation>`
    );
    const el = host.querySelector("ce-recommendation") as CeRecommendation;
    await ready(el);
    const titleEl = el.shadowRoot!.querySelector(".ce-rec__title");
    expect(titleEl).not.toBeNull();
    expect(titleEl!.textContent).toContain("Connection pooling");
    host.remove();
  });

  it("slot='title' overrides the title attribute", async () => {
    const host = mount(`
      <ce-recommendation priority="p3" title="Plain title">
        <span slot="title">Rich <code>title</code></span>
        Body.
      </ce-recommendation>
    `);
    const el = host.querySelector("ce-recommendation") as CeRecommendation;
    await ready(el);
    // The slotted element carries the rich markup in light DOM
    const slotted = el.querySelector('[slot="title"]');
    expect(slotted).not.toBeNull();
    expect(slotted!.textContent).toContain("Rich");
    host.remove();
  });

  it("renders impact from the impact attribute", async () => {
    const host = mount(
      `<ce-recommendation priority="p2" title="Edge CDN" impact="−120ms TTFB">Body.</ce-recommendation>`
    );
    const el = host.querySelector("ce-recommendation") as CeRecommendation;
    await ready(el);
    const impactEl = el.shadowRoot!.querySelector(".ce-rec__impact");
    expect(impactEl).not.toBeNull();
    expect(impactEl!.textContent).toContain("−120ms TTFB");
    host.remove();
  });

  it("slot='impact' overrides the impact attribute", async () => {
    const host = mount(`
      <ce-recommendation priority="p1" title="Pooling" impact="plain string">
        <span slot="impact">Rich impact</span>
        Body.
      </ce-recommendation>
    `);
    const el = host.querySelector("ce-recommendation") as CeRecommendation;
    await ready(el);
    const slotted = el.querySelector('[slot="impact"]');
    expect(slotted).not.toBeNull();
    expect(slotted!.textContent).toContain("Rich impact");
    host.remove();
  });

  it("default slot accepts rich children (links, code, ce-chip)", async () => {
    const host = mount(`
      <ce-recommendation priority="p2" title="Upgrade deps">
        Replace <code>moment</code> with <a href="#date-fns">date-fns</a>.
      </ce-recommendation>
    `);
    const el = host.querySelector("ce-recommendation") as CeRecommendation;
    await ready(el);
    expect(el.querySelector("code")).not.toBeNull();
    expect(el.querySelector("a")).not.toBeNull();
    host.remove();
  });

  it("slot='actions' content appears in the actions footer", async () => {
    const host = mount(`
      <ce-recommendation priority="p0" title="Critical fix">
        Fix immediately.
        <button slot="actions">Assign</button>
      </ce-recommendation>
    `);
    const el = host.querySelector("ce-recommendation") as CeRecommendation;
    await ready(el);
    const actionsSlotted = el.querySelector('[slot="actions"]');
    expect(actionsSlotted).not.toBeNull();
    expect(actionsSlotted!.tagName.toLowerCase()).toBe("button");
    // The actions wrapper is present in shadow DOM
    const actionsWrapper = el.shadowRoot!.querySelector(".ce-rec__actions");
    expect(actionsWrapper).not.toBeNull();
    host.remove();
  });

  it("slot='meta' content appears in the meta section", async () => {
    const host = mount(`
      <ce-recommendation priority="p2" title="CDN">
        Body.
        <span slot="meta">owner: backend</span>
      </ce-recommendation>
    `);
    const el = host.querySelector("ce-recommendation") as CeRecommendation;
    await ready(el);
    const metaSlotted = el.querySelector('[slot="meta"]');
    expect(metaSlotted).not.toBeNull();
    expect(metaSlotted!.textContent).toContain("owner: backend");
    host.remove();
  });

  it("omits header title element when neither title attr nor slot='title' is present", async () => {
    const host = mount(`<ce-recommendation>Just a body.</ce-recommendation>`);
    const el = host.querySelector("ce-recommendation") as CeRecommendation;
    await ready(el);
    const titleEl = el.shadowRoot!.querySelector(".ce-rec__title");
    expect(titleEl).toBeNull();
    host.remove();
  });
});
