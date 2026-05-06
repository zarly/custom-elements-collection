import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeRetryButton } from "./retry-button.js";

beforeAll(() => defineOnce("ce-retry-button", CeRetryButton));

describe("<ce-retry-button>", () => {
  it("upgrades and renders a button", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-retry-button></ce-retry-button>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-retry-button") as CeRetryButton;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("button")).not.toBeNull();
    host.remove();
  });

  it("renders the default label", async () => {
    const el = document.createElement("ce-retry-button") as CeRetryButton;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.textContent).toContain("Retry");
    el.remove();
  });

  it("uses the label attribute", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-retry-button label="Try again"></ce-retry-button>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-retry-button") as CeRetryButton;
    await el.updateComplete;
    expect(el.shadowRoot!.textContent).toContain("Try again");
    host.remove();
  });

  it("emits ce-retry on click (no detail)", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-retry-button></ce-retry-button>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-retry-button") as CeRetryButton;
    await el.updateComplete;
    let fired = 0;
    el.addEventListener("ce-retry", () => fired++);
    (el.shadowRoot!.querySelector("button") as HTMLButtonElement).click();
    expect(fired).toBe(1);
    host.remove();
  });

  it("ce-retry bubbles + composed", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-retry-button></ce-retry-button>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-retry-button") as CeRetryButton;
    await el.updateComplete;
    let fired = 0;
    document.addEventListener("ce-retry", () => fired++);
    (el.shadowRoot!.querySelector("button") as HTMLButtonElement).click();
    expect(fired).toBe(1);
    host.remove();
  });

  it("reflects variant attribute", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-retry-button variant="primary"></ce-retry-button>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-retry-button") as CeRetryButton;
    await el.updateComplete;
    expect(el.variant).toBe("primary");
    expect(el.getAttribute("variant")).toBe("primary");
    host.remove();
  });

  it("default variant is secondary", async () => {
    const el = document.createElement("ce-retry-button") as CeRetryButton;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.variant).toBe("secondary");
    el.remove();
  });

  it("slotted content overrides the default content", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-retry-button>↻ Re-run</ce-retry-button>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-retry-button") as CeRetryButton;
    await el.updateComplete;
    expect(el.textContent).toContain("Re-run");
    host.remove();
  });
});
