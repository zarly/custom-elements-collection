import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeStep } from "./step.js";

beforeAll(() => {
  defineOnce("ce-step", CeStep);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeStep).updateComplete;
}

describe("<ce-step>", () => {
  it("renders with default pending state and a shadow root", async () => {
    const host = mount(`<ce-step n="1" title="Discovery">Details</ce-step>`);
    const el = host.querySelector("ce-step") as CeStep;
    await ready(el);
    expect(el.shadowRoot).not.toBeNull();
    expect(el.state).toBe("pending");
    expect(el.getAttribute("state")).toBe("pending");
    host.remove();
  });

  it("renders the n attribute in the disk", async () => {
    const host = mount(`<ce-step n="3" title="Test">desc</ce-step>`);
    const el = host.querySelector("ce-step") as CeStep;
    await ready(el);
    // has-n attribute should be set so disk is visible
    expect(el.hasAttribute("has-n")).toBe(true);
    // disk text should contain the step number
    const disk = el.shadowRoot!.querySelector(".ce-step__disk");
    expect(disk?.textContent?.trim()).toContain("3");
    host.remove();
  });

  it("does not set has-n when n is absent", async () => {
    const host = mount(`<ce-step title="No number">desc</ce-step>`);
    const el = host.querySelector("ce-step") as CeStep;
    await ready(el);
    expect(el.hasAttribute("has-n")).toBe(false);
    host.remove();
  });

  it("renders the title attribute", async () => {
    const host = mount(`<ce-step n="1" title="Discovery">desc</ce-step>`);
    const el = host.querySelector("ce-step") as CeStep;
    await ready(el);
    const titleSlot = el.shadowRoot!.querySelector(
      ".ce-step__title slot[name='title']"
    ) as HTMLSlotElement;
    // slot fallback text should be the title attribute value
    expect(titleSlot.textContent?.trim()).toBe("Discovery");
    host.remove();
  });

  it("slot='title' overrides the title attribute (CDR-002)", async () => {
    const host = mount(`
      <ce-step n="2" title="Plain title">
        <span slot="title">Rich Title</span>
        description
      </ce-step>
    `);
    const el = host.querySelector("ce-step") as CeStep;
    await ready(el);
    // The rich slot child is present in the light DOM
    const rich = el.querySelector("[slot='title']");
    expect(rich).not.toBeNull();
    expect(rich?.textContent?.trim()).toBe("Rich Title");
    host.remove();
  });

  it("state='active' reflects on host and sets aria-current='step'", async () => {
    const host = mount(`<ce-step n="2" title="Build" state="active">desc</ce-step>`);
    const el = host.querySelector("ce-step") as CeStep;
    await ready(el);
    expect(el.getAttribute("state")).toBe("active");
    expect(el.state).toBe("active");
    expect(el.getAttribute("aria-current")).toBe("step");
    host.remove();
  });

  it("state='done' reflects on host and includes visually-hidden 'Completed:' text", async () => {
    const host = mount(`<ce-step n="3" title="Deploy" state="done">desc</ce-step>`);
    const el = host.querySelector("ce-step") as CeStep;
    await ready(el);
    expect(el.getAttribute("state")).toBe("done");
    // sr-only span with "Completed:" should exist in shadow DOM
    const srOnly = el.shadowRoot!.querySelector(".sr-only");
    expect(srOnly).not.toBeNull();
    expect(srOnly?.textContent?.trim()).toBe("Completed:");
    host.remove();
  });

  it("default slot renders description and preserves rich children", async () => {
    const host = mount(`
      <ce-step n="1" title="Step">
        Plain text and <a href="#ref">a link</a>
      </ce-step>
    `);
    const el = host.querySelector("ce-step") as CeStep;
    await ready(el);
    // Rich children in the light DOM are preserved
    const link = el.querySelector("a");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("#ref");
    host.remove();
  });

  it("state='done' does NOT set aria-current", async () => {
    const host = mount(`<ce-step n="1" title="Done" state="done">desc</ce-step>`);
    const el = host.querySelector("ce-step") as CeStep;
    await ready(el);
    expect(el.hasAttribute("aria-current")).toBe(false);
    host.remove();
  });

  it("changing state from active to pending removes aria-current", async () => {
    const host = mount(`<ce-step n="1" title="Active" state="active">desc</ce-step>`);
    const el = host.querySelector("ce-step") as CeStep;
    await ready(el);
    expect(el.getAttribute("aria-current")).toBe("step");
    el.state = "pending";
    await ready(el);
    expect(el.hasAttribute("aria-current")).toBe(false);
    host.remove();
  });

  it("disk shows check mark (✓) when state='done'", async () => {
    const host = mount(`<ce-step n="1" title="Done" state="done">desc</ce-step>`);
    const el = host.querySelector("ce-step") as CeStep;
    await ready(el);
    const disk = el.shadowRoot!.querySelector(".ce-step__disk");
    // ✓ is U+2713; rendered via &#10003;
    expect(disk?.textContent?.trim()).toContain("✓");
    host.remove();
  });
});
