import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeStopButton } from "./stop-button.js";

beforeAll(() => defineOnce("ce-stop-button", CeStopButton));

describe("<ce-stop-button>", () => {
  it("upgrades, renders a shadow root, and shows the default label 'Stop'", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-stop-button></ce-stop-button>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-stop-button") as CeStopButton;
    await el.updateComplete;
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot!.querySelector("button")).not.toBeNull();
    expect(el.shadowRoot!.textContent).toContain("Stop");
    host.remove();
  });

  it("reflects the variant attribute", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-stop-button variant="primary"></ce-stop-button>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-stop-button") as CeStopButton;
    await el.updateComplete;
    expect(el.variant).toBe("primary");
    expect(el.getAttribute("variant")).toBe("primary");
    host.remove();
  });

  it("click emits ce-chat-stop once with empty-object detail and bubbles: true", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-stop-button></ce-stop-button>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-stop-button") as CeStopButton;
    await el.updateComplete;

    let fired = 0;
    let lastEvent: CustomEvent | null = null;
    el.addEventListener("ce-chat-stop", (e) => {
      fired++;
      lastEvent = e as CustomEvent;
    });

    (el.shadowRoot!.querySelector("button") as HTMLButtonElement).click();
    expect(fired).toBe(1);
    expect(lastEvent).not.toBeNull();
    expect((lastEvent as CustomEvent).bubbles).toBe(true);
    expect((lastEvent as CustomEvent).detail).toEqual({});
    host.remove();
  });

  it("Enter key on the focused inner button emits ce-chat-stop", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-stop-button></ce-stop-button>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-stop-button") as CeStopButton;
    await el.updateComplete;

    let fired = 0;
    el.addEventListener("ce-chat-stop", () => fired++);

    const btn = el.shadowRoot!.querySelector("button") as HTMLButtonElement;
    btn.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(fired).toBe(1);
    host.remove();
  });

  it("Space key on the focused inner button emits ce-chat-stop", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-stop-button></ce-stop-button>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-stop-button") as CeStopButton;
    await el.updateComplete;

    let fired = 0;
    el.addEventListener("ce-chat-stop", () => fired++);

    const btn = el.shadowRoot!.querySelector("button") as HTMLButtonElement;
    btn.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(fired).toBe(1);
    host.remove();
  });

  it("disabled attribute sets the inner button's disabled and clicking does NOT emit", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-stop-button disabled></ce-stop-button>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-stop-button") as CeStopButton;
    await el.updateComplete;

    const btn = el.shadowRoot!.querySelector("button") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);

    let fired = 0;
    el.addEventListener("ce-chat-stop", () => fired++);
    btn.click();
    expect(fired).toBe(0);
    host.remove();
  });

  it("slotted child overrides the default icon + label content", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-stop-button>■ Abort</ce-stop-button>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-stop-button") as CeStopButton;
    await el.updateComplete;
    expect(el.textContent).toContain("Abort");
    host.remove();
  });

  it("default variant is secondary", async () => {
    const el = document.createElement("ce-stop-button") as CeStopButton;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.variant).toBe("secondary");
    el.remove();
  });
});
