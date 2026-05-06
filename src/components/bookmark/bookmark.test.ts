import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeBookmark } from "./bookmark.js";

beforeAll(() => defineOnce("ce-bookmark", CeBookmark));

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

describe("<ce-bookmark>", () => {
  it("upgrades and renders shadow root", async () => {
    const host = mount(`<ce-bookmark></ce-bookmark>`);
    const el = host.querySelector("ce-bookmark") as CeBookmark;
    await el.updateComplete;
    expect(el.shadowRoot).not.toBeNull();
    expect(el.active).toBe(false);
    host.remove();
  });

  it("defaults to inactive (aria-checked=false, role=switch)", async () => {
    const host = mount(`<ce-bookmark></ce-bookmark>`);
    const el = host.querySelector("ce-bookmark") as CeBookmark;
    await el.updateComplete;
    expect(el.getAttribute("role")).toBe("switch");
    expect(el.getAttribute("aria-checked")).toBe("false");
    host.remove();
  });

  it("clicking host toggles active and emits ce-bookmark-change", async () => {
    const host = mount(`<ce-bookmark></ce-bookmark>`);
    const el = host.querySelector("ce-bookmark") as CeBookmark;
    await el.updateComplete;
    let detail: { active: boolean } | null = null;
    el.addEventListener("ce-bookmark-change", (e) => {
      detail = (e as CustomEvent).detail;
    });
    el.click();
    await el.updateComplete;
    expect(el.active).toBe(true);
    expect(detail).toEqual({ active: true });
    expect(el.getAttribute("aria-checked")).toBe("true");
    host.remove();
  });

  it("clicking again toggles back off", async () => {
    const host = mount(`<ce-bookmark active></ce-bookmark>`);
    const el = host.querySelector("ce-bookmark") as CeBookmark;
    await el.updateComplete;
    expect(el.active).toBe(true);
    el.click();
    await el.updateComplete;
    expect(el.active).toBe(false);
    host.remove();
  });

  it("Enter and Space keys toggle", async () => {
    const host = mount(`<ce-bookmark></ce-bookmark>`);
    const el = host.querySelector("ce-bookmark") as CeBookmark;
    await el.updateComplete;
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await el.updateComplete;
    expect(el.active).toBe(true);
    el.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await el.updateComplete;
    expect(el.active).toBe(false);
    host.remove();
  });

  it("renders label attribute as aria-label", async () => {
    const host = mount(`<ce-bookmark label="Save for later"></ce-bookmark>`);
    const el = host.querySelector("ce-bookmark") as CeBookmark;
    await el.updateComplete;
    expect(el.getAttribute("aria-label")).toBe("Save for later");
    expect(el.shadowRoot!.textContent).toContain("Save for later");
    host.remove();
  });

  it("event bubbles and is composed", async () => {
    const host = mount(`<div><ce-bookmark></ce-bookmark></div>`);
    const el = host.querySelector("ce-bookmark") as CeBookmark;
    await el.updateComplete;
    let bubbled = 0;
    host.addEventListener("ce-bookmark-change", () => bubbled++);
    el.click();
    expect(bubbled).toBe(1);
    host.remove();
  });
});
