import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeChatBubble } from "./chat-bubble.js";

beforeAll(() => defineOnce("ce-chat-bubble", CeChatBubble));

describe("<ce-chat-bubble>", () => {
  it("upgrades and renders shadow root", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-chat-bubble>Hello</ce-chat-bubble>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-chat-bubble") as CeChatBubble;
    await el.updateComplete;
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot!.querySelector(".ce-bubble__content")).not.toBeNull();
    expect(el.textContent).toContain("Hello");
    host.remove();
  });

  it("default role is assistant", async () => {
    const el = document.createElement("ce-chat-bubble") as CeChatBubble;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.role).toBe("assistant");
    expect(el.getAttribute("role")).toBe("assistant");
    el.remove();
  });

  it("reflects role attribute", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-chat-bubble role="user">Hi</ce-chat-bubble>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-chat-bubble") as CeChatBubble;
    await el.updateComplete;
    expect(el.role).toBe("user");
    expect(el.getAttribute("role")).toBe("user");
    host.remove();
  });

  it("renders the author + model + timestamp in the head", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-chat-bubble role="assistant" author="Claude" model="opus-4.7" timestamp="12:34">Body</ce-chat-bubble>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-chat-bubble") as CeChatBubble;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-bubble__author")?.textContent).toBe("Claude");
    expect(el.shadowRoot!.querySelector(".ce-bubble__model")?.textContent).toBe("opus-4.7");
    expect(el.shadowRoot!.querySelector(".ce-bubble__time")?.textContent).toBe("12:34");
    host.remove();
  });

  it("aria-label uses the author when set", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-chat-bubble author="Alex">x</ce-chat-bubble>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-chat-bubble") as CeChatBubble;
    await el.updateComplete;
    expect(el.getAttribute("aria-label")).toBe("Message from Alex");
    host.remove();
  });

  it("has aria-roledescription=message", async () => {
    const el = document.createElement("ce-chat-bubble") as CeChatBubble;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("aria-roledescription")).toBe("message");
    el.remove();
  });

  it("has avatar + footer named slots", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-chat-bubble>
      <span slot="avatar">A</span>
      x
      <span slot="footer">f</span>
    </ce-chat-bubble>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-chat-bubble") as CeChatBubble;
    await el.updateComplete;
    const slots = Array.from(el.shadowRoot!.querySelectorAll("slot"));
    const names = slots.map((s) => s.getAttribute("name") ?? "default");
    expect(names).toContain("avatar");
    expect(names).toContain("footer");
    expect(names).toContain("default");
    host.remove();
  });

  it("renders the tokens count in the footer when set", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-chat-bubble tokens="234">x</ce-chat-bubble>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-chat-bubble") as CeChatBubble;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-bubble__tokens")?.textContent).toContain("234");
    host.remove();
  });

  it("does not render tokens chip when tokens is unset", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-chat-bubble>x</ce-chat-bubble>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-chat-bubble") as CeChatBubble;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-bubble__tokens")).toBeNull();
    host.remove();
  });

  it("follow-up attribute reflects from the property and back", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-chat-bubble follow-up>x</ce-chat-bubble>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-chat-bubble") as CeChatBubble;
    await el.updateComplete;
    expect(el.followUp).toBe(true);
    el.followUp = false;
    await el.updateComplete;
    expect(el.hasAttribute("follow-up")).toBe(false);
    host.remove();
  });

  it("keeps the follow-up attribute on the host and the head row in DOM", async () => {
    // The CSS rule `:host([follow-up]) .ce-bubble__head { display: none }` is
    // what hides the chrome visually. jsdom does not evaluate adopted styles
    // through `:host` selectors, so we assert the observable contract: the
    // attribute reaches the host (already covered above) and the head row
    // stays in the shadow tree for the stylesheet to suppress.
    const host = document.createElement("div");
    host.innerHTML = `<ce-chat-bubble author="Claude" follow-up>x</ce-chat-bubble>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-chat-bubble") as CeChatBubble;
    await el.updateComplete;
    expect(el.hasAttribute("follow-up")).toBe(true);
    expect(el.shadowRoot!.querySelector(".ce-bubble__head")).not.toBeNull();
    host.remove();
  });
});
