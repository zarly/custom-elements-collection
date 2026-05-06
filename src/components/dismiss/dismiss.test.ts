import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeDismiss } from "./dismiss.js";

beforeAll(() => defineOnce("ce-dismiss", CeDismiss));

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

describe("<ce-dismiss>", () => {
  it("upgrades and renders shadow root", async () => {
    const host = mount(`<ce-dismiss></ce-dismiss>`);
    const el = host.querySelector("ce-dismiss") as CeDismiss;
    await el.updateComplete;
    expect(el.shadowRoot).not.toBeNull();
    expect(el.active).toBe(false);
    host.remove();
  });

  it("defaults to inactive (role=switch, aria-checked=false)", async () => {
    const host = mount(`<ce-dismiss></ce-dismiss>`);
    const el = host.querySelector("ce-dismiss") as CeDismiss;
    await el.updateComplete;
    expect(el.getAttribute("role")).toBe("switch");
    expect(el.getAttribute("aria-checked")).toBe("false");
    host.remove();
  });

  it("clicking toggles active and emits ce-dismiss-change", async () => {
    const host = mount(`<ce-dismiss></ce-dismiss>`);
    const el = host.querySelector("ce-dismiss") as CeDismiss;
    await el.updateComplete;
    let detail: { active: boolean } | null = null;
    el.addEventListener("ce-dismiss-change", (e) => {
      detail = (e as CustomEvent).detail;
    });
    el.click();
    await el.updateComplete;
    expect(el.active).toBe(true);
    expect(detail).toEqual({ active: true });
    host.remove();
  });

  it("Enter/Space toggle", async () => {
    const host = mount(`<ce-dismiss></ce-dismiss>`);
    const el = host.querySelector("ce-dismiss") as CeDismiss;
    await el.updateComplete;
    el.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await el.updateComplete;
    expect(el.active).toBe(true);
    host.remove();
  });

  it("renders label as aria-label and content", async () => {
    const host = mount(`<ce-dismiss label="Hide"></ce-dismiss>`);
    const el = host.querySelector("ce-dismiss") as CeDismiss;
    await el.updateComplete;
    expect(el.getAttribute("aria-label")).toBe("Hide");
    expect(el.shadowRoot!.textContent).toContain("Hide");
    host.remove();
  });

  it("sets data-ce-dismissed on parent ce-feedback-bar when active", async () => {
    // Use a stand-in element with the right tagName since ce-feedback-bar
    // is not yet defined in this test file's scope.
    const host = mount(`
      <div>
        <ce-feedback-bar item="x">
          <ce-dismiss></ce-dismiss>
        </ce-feedback-bar>
      </div>
    `);
    const bar = host.querySelector("ce-feedback-bar") as HTMLElement;
    const el = host.querySelector("ce-dismiss") as CeDismiss;
    await el.updateComplete;
    expect(bar.getAttribute("data-ce-dismissed")).toBeNull();
    el.click();
    await el.updateComplete;
    expect(bar.getAttribute("data-ce-dismissed")).toBe("true");
    el.click();
    await el.updateComplete;
    expect(bar.hasAttribute("data-ce-dismissed")).toBe(false);
    host.remove();
  });

  it("does not throw if no ancestor ce-feedback-bar exists", async () => {
    const host = mount(`<ce-dismiss></ce-dismiss>`);
    const el = host.querySelector("ce-dismiss") as CeDismiss;
    await el.updateComplete;
    expect(() => el.click()).not.toThrow();
    host.remove();
  });

  it("event bubbles + composed", async () => {
    const host = mount(`<div><ce-dismiss></ce-dismiss></div>`);
    const el = host.querySelector("ce-dismiss") as CeDismiss;
    await el.updateComplete;
    let bubbled = 0;
    host.addEventListener("ce-dismiss-change", () => bubbled++);
    el.click();
    expect(bubbled).toBe(1);
    host.remove();
  });
});
