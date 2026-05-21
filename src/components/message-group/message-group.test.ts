import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeMessageGroup } from "./message-group.js";
import { CeChatBubble } from "../chat-bubble/chat-bubble.js";

beforeAll(() => {
  defineOnce("ce-message-group", CeMessageGroup);
  defineOnce("ce-chat-bubble", CeChatBubble);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeMessageGroup).updateComplete;
}

describe("<ce-message-group>", () => {
  it("upgrades and renders a shadow root with grid container", async () => {
    const host = mount(`<ce-message-group><p>Hello</p></ce-message-group>`);
    const el = host.querySelector("ce-message-group") as CeMessageGroup;
    await ready(el);
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot!.querySelector(".ce-mg__body")).not.toBeNull();
    expect(el.shadowRoot!.querySelector(".ce-mg__messages")).not.toBeNull();
    host.remove();
  });

  it("default role is 'assistant' and reflects to attribute", async () => {
    const el = document.createElement("ce-message-group") as CeMessageGroup;
    document.body.appendChild(el);
    await ready(el);
    expect(el.role).toBe("assistant");
    expect(el.getAttribute("role")).toBe("assistant");
    el.remove();
  });

  it("role attribute reflects back to the property", async () => {
    const host = mount(`<ce-message-group role="user"><p>Hi</p></ce-message-group>`);
    const el = host.querySelector("ce-message-group") as CeMessageGroup;
    await ready(el);
    expect(el.role).toBe("user");
    expect(el.getAttribute("role")).toBe("user");
    host.remove();
  });

  it("slotted avatar appears in the avatar slot's assigned nodes", async () => {
    const host = mount(`
      <ce-message-group>
        <span slot="avatar">A</span>
        <p>Message body</p>
      </ce-message-group>
    `);
    const el = host.querySelector("ce-message-group") as CeMessageGroup;
    await ready(el);
    const avatarSlot = el.shadowRoot!.querySelector<HTMLSlotElement>(
      'slot[name="avatar"]'
    )!;
    expect(avatarSlot).not.toBeNull();
    const assigned = avatarSlot.assignedNodes({ flatten: true });
    const avatarEl = assigned.find(
      (n) => n instanceof Element && (n as Element).textContent?.trim() === "A"
    );
    expect(avatarEl).toBeDefined();
    host.remove();
  });

  it("renders author and timestamp in the group header when props are set", async () => {
    const host = mount(
      `<ce-message-group author="Claude" timestamp="10:00"><p>msg</p></ce-message-group>`
    );
    const el = host.querySelector("ce-message-group") as CeMessageGroup;
    await ready(el);
    const head = el.shadowRoot!.querySelector(".ce-mg__head");
    expect(head).not.toBeNull();
    expect(el.shadowRoot!.querySelector(".ce-mg__author")?.textContent).toBe("Claude");
    expect(el.shadowRoot!.querySelector(".ce-mg__time")?.textContent).toBe("10:00");
    host.remove();
  });

  it("does not render the group header when author and timestamp are empty", async () => {
    const host = mount(`<ce-message-group><p>msg</p></ce-message-group>`);
    const el = host.querySelector("ce-message-group") as CeMessageGroup;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".ce-mg__head")).toBeNull();
    host.remove();
  });

  it("compact attribute reflects and is false by default", async () => {
    const el = document.createElement("ce-message-group") as CeMessageGroup;
    document.body.appendChild(el);
    await ready(el);
    expect(el.compact).toBe(false);
    expect(el.hasAttribute("compact")).toBe(false);
    el.compact = true;
    await ready(el);
    expect(el.hasAttribute("compact")).toBe(true);
    el.remove();
  });

  it("all three slotted children appear in the default slot assigned nodes", async () => {
    const host = mount(`
      <ce-message-group>
        <p id="m1">First</p>
        <p id="m2">Second</p>
        <p id="m3">Third</p>
      </ce-message-group>
    `);
    const el = host.querySelector("ce-message-group") as CeMessageGroup;
    await ready(el);
    const defaultSlot = el.shadowRoot!.querySelector<HTMLSlotElement>(
      ".ce-mg__messages slot:not([name])"
    )!;
    expect(defaultSlot).not.toBeNull();
    const assigned = defaultSlot.assignedElements({ flatten: true });
    const ids = assigned.map((e) => e.id);
    expect(ids).toContain("m1");
    expect(ids).toContain("m2");
    expect(ids).toContain("m3");
    host.remove();
  });

  it("sets follow-up on every slotted ce-chat-bubble after the first", async () => {
    const host = mount(`
      <ce-message-group role="assistant" author="Claude">
        <ce-chat-bubble role="assistant">A</ce-chat-bubble>
        <ce-chat-bubble role="assistant">B</ce-chat-bubble>
        <ce-chat-bubble role="assistant">C</ce-chat-bubble>
      </ce-message-group>
    `);
    const el = host.querySelector("ce-message-group") as CeMessageGroup;
    await ready(el);
    // Wait one extra microtask for slotchange handler to run.
    await new Promise((r) => setTimeout(r, 0));
    const bubbles = host.querySelectorAll("ce-chat-bubble");
    expect(bubbles[0].hasAttribute("follow-up")).toBe(false);
    expect(bubbles[1].hasAttribute("follow-up")).toBe(true);
    expect(bubbles[2].hasAttribute("follow-up")).toBe(true);
    host.remove();
  });

  it("does not touch non-bubble slotted children when setting follow-up", async () => {
    const host = mount(`
      <ce-message-group>
        <ce-chat-bubble role="assistant">A</ce-chat-bubble>
        <p>plain paragraph</p>
        <ce-chat-bubble role="assistant">B</ce-chat-bubble>
      </ce-message-group>
    `);
    const el = host.querySelector("ce-message-group") as CeMessageGroup;
    await ready(el);
    await new Promise((r) => setTimeout(r, 0));
    const bubbles = host.querySelectorAll("ce-chat-bubble");
    expect(bubbles[0].hasAttribute("follow-up")).toBe(false);
    expect(bubbles[1].hasAttribute("follow-up")).toBe(true);
    // Paragraph stays clean
    expect(host.querySelector("p")!.hasAttribute("follow-up")).toBe(false);
    host.remove();
  });

  it("has avatar, header, and default slots in the shadow DOM", async () => {
    const host = mount(`<ce-message-group><p>x</p></ce-message-group>`);
    const el = host.querySelector("ce-message-group") as CeMessageGroup;
    await ready(el);
    const shadow = el.shadowRoot!;
    const slots = Array.from(shadow.querySelectorAll("slot"));
    const names = slots.map((s) => s.getAttribute("name") ?? "default");
    expect(names).toContain("avatar");
    expect(names).toContain("header");
    expect(names).toContain("default");
    host.remove();
  });
});
