import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeCard } from "./card.js";

beforeAll(() => {
  defineOnce("ce-card", CeCard);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeCard).updateComplete;
}

describe("<ce-card>", () => {
  it("upgrades and renders a shadow root", async () => {
    const host = mount(`<ce-card>Body</ce-card>`);
    const card = host.querySelector("ce-card")!;
    await ready(card);
    expect(card.shadowRoot).not.toBeNull();
    // default slot receives the text
    expect(card.textContent).toContain("Body");
    host.remove();
  });

  it("reflects accent attribute", async () => {
    const host = mount(`<ce-card accent="green">x</ce-card>`);
    const card = host.querySelector("ce-card") as CeCard;
    await ready(card);
    expect(card.getAttribute("accent")).toBe("green");
    expect(card.accent).toBe("green");
    host.remove();
  });

  it("adds role=button and tabindex when clickable", async () => {
    const host = mount(`<ce-card clickable>x</ce-card>`);
    const card = host.querySelector("ce-card") as CeCard;
    await ready(card);
    expect(card.getAttribute("role")).toBe("button");
    expect(card.getAttribute("tabindex")).toBe("0");
    host.remove();
  });

  it("removes role and tabindex when clickable toggled off", async () => {
    const host = mount(`<ce-card clickable>x</ce-card>`);
    const card = host.querySelector("ce-card") as CeCard;
    await ready(card);
    card.clickable = false;
    await ready(card);
    expect(card.hasAttribute("role")).toBe(false);
    expect(card.hasAttribute("tabindex")).toBe(false);
    host.remove();
  });

  it("emits ce-card-activate on click when clickable", async () => {
    const host = mount(`<ce-card clickable>x</ce-card>`);
    const card = host.querySelector("ce-card") as CeCard;
    await ready(card);
    let fired = 0;
    card.addEventListener("ce-card-activate", () => fired++);
    card.click();
    expect(fired).toBe(1);
    host.remove();
  });

  it("does NOT emit ce-card-activate on click when not clickable", async () => {
    const host = mount(`<ce-card>x</ce-card>`);
    const card = host.querySelector("ce-card") as CeCard;
    await ready(card);
    let fired = 0;
    card.addEventListener("ce-card-activate", () => fired++);
    card.click();
    expect(fired).toBe(0);
    host.remove();
  });

  it("emits ce-card-activate on Enter key when clickable", async () => {
    const host = mount(`<ce-card clickable>x</ce-card>`);
    const card = host.querySelector("ce-card") as CeCard;
    await ready(card);
    let fired = 0;
    card.addEventListener("ce-card-activate", () => fired++);
    card.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(fired).toBe(1);
    host.remove();
  });

  it("emits ce-card-activate on Space key when clickable", async () => {
    const host = mount(`<ce-card clickable>x</ce-card>`);
    const card = host.querySelector("ce-card") as CeCard;
    await ready(card);
    let fired = 0;
    card.addEventListener("ce-card-activate", () => fired++);
    card.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(fired).toBe(1);
    host.remove();
  });

  it("ignores non-activation keys", async () => {
    const host = mount(`<ce-card clickable>x</ce-card>`);
    const card = host.querySelector("ce-card") as CeCard;
    await ready(card);
    let fired = 0;
    card.addEventListener("ce-card-activate", () => fired++);
    card.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    card.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
    expect(fired).toBe(0);
    host.remove();
  });

  it("has a title slot and footer slot in shadow DOM", async () => {
    const host = mount(`
      <ce-card>
        <h3 slot="title">Title</h3>
        Body
        <span slot="footer">Meta</span>
      </ce-card>
    `);
    const card = host.querySelector("ce-card") as CeCard;
    await ready(card);
    const shadow = card.shadowRoot!;
    const slots = Array.from(shadow.querySelectorAll("slot"));
    const names = slots.map((s) => s.getAttribute("name") ?? "default");
    expect(names).toContain("title");
    expect(names).toContain("footer");
    expect(names).toContain("default");
    host.remove();
  });
});
