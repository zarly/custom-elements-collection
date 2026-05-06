import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeButton } from "./button.js";

beforeAll(() => {
  defineOnce("ce-button", CeButton);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeButton).updateComplete;
}

describe("<ce-button>", () => {
  it("renders inner button with default slot label", async () => {
    const host = mount(`<ce-button>Save</ce-button>`);
    const el = host.querySelector("ce-button") as CeButton;
    await ready(el);
    expect(el.shadowRoot!.querySelector("button")).not.toBeNull();
    expect(el.textContent).toContain("Save");
    host.remove();
  });

  it("emits ce-click when clicked", async () => {
    const host = mount(`<ce-button>Go</ce-button>`);
    const el = host.querySelector("ce-button") as CeButton;
    await ready(el);
    let fired = 0;
    el.addEventListener("ce-click", () => fired++);
    (el.shadowRoot!.querySelector("button") as HTMLButtonElement).click();
    expect(fired).toBe(1);
    host.remove();
  });

  it("does not emit when disabled", async () => {
    const host = mount(`<ce-button disabled>Go</ce-button>`);
    const el = host.querySelector("ce-button") as CeButton;
    await ready(el);
    let fired = 0;
    el.addEventListener("ce-click", () => fired++);
    (el.shadowRoot!.querySelector("button") as HTMLButtonElement).click();
    expect(fired).toBe(0);
    host.remove();
  });

  it("loading hides label and shows spinner", async () => {
    const host = mount(`<ce-button loading>Save</ce-button>`);
    const el = host.querySelector("ce-button") as CeButton;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".spin")).not.toBeNull();
    expect(el.shadowRoot!.querySelector(".label")!.classList.contains("hidden")).toBe(true);
    expect(el.getAttribute("aria-disabled")).toBe("true");
    host.remove();
  });

  it("variant attribute reflects", async () => {
    const host = mount(`<ce-button variant="destructive">Drop</ce-button>`);
    const el = host.querySelector("ce-button") as CeButton;
    await ready(el);
    expect(el.getAttribute("variant")).toBe("destructive");
    host.remove();
  });

  it("size attribute reflects", async () => {
    const host = mount(`<ce-button size="lg">Big</ce-button>`);
    const el = host.querySelector("ce-button") as CeButton;
    await ready(el);
    expect(el.getAttribute("size")).toBe("lg");
    host.remove();
  });

  it("type attribute forwards to inner button", async () => {
    const host = mount(`<ce-button type="submit">Submit</ce-button>`);
    const el = host.querySelector("ce-button") as CeButton;
    await ready(el);
    expect(el.shadowRoot!.querySelector("button")!.getAttribute("type")).toBe("submit");
    host.remove();
  });

  it("loading also blocks ce-click", async () => {
    const host = mount(`<ce-button loading>x</ce-button>`);
    const el = host.querySelector("ce-button") as CeButton;
    await ready(el);
    let fired = 0;
    el.addEventListener("ce-click", () => fired++);
    (el.shadowRoot!.querySelector("button") as HTMLButtonElement).click();
    expect(fired).toBe(0);
    host.remove();
  });
});
