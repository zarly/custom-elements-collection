import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeThinking } from "./thinking.js";

beforeAll(() => defineOnce("ce-thinking", CeThinking));

describe("<ce-thinking>", () => {
  it("upgrades and renders shadow root", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-thinking></ce-thinking>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-thinking") as CeThinking;
    await el.updateComplete;
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot!.querySelector(".ce-thinking__indicator")).not.toBeNull();
    host.remove();
  });

  it("defaults to dots variant", async () => {
    const el = document.createElement("ce-thinking") as CeThinking;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.variant).toBe("dots");
    expect(el.shadowRoot!.querySelectorAll(".ce-thinking__dot").length).toBe(3);
    el.remove();
  });

  it("renders wave bars when variant=wave", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-thinking variant="wave"></ce-thinking>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-thinking") as CeThinking;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll(".ce-thinking__bar").length).toBe(3);
    host.remove();
  });

  it("renders spinner svg when variant=spinner", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-thinking variant="spinner"></ce-thinking>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-thinking") as CeThinking;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-thinking__spinner")).not.toBeNull();
    host.remove();
  });

  it("renders the label attribute via the default slot fallback", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-thinking label="Working…"></ce-thinking>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-thinking") as CeThinking;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-thinking__label")?.textContent).toContain(
      "Working…"
    );
    host.remove();
  });

  it("lets slotted children override the label", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-thinking>Crunching numbers</ce-thinking>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-thinking") as CeThinking;
    await el.updateComplete;
    expect(el.textContent).toContain("Crunching numbers");
    host.remove();
  });

  it("sets role=status and aria-live=polite", async () => {
    const el = document.createElement("ce-thinking") as CeThinking;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("role")).toBe("status");
    expect(el.getAttribute("aria-live")).toBe("polite");
    el.remove();
  });

  it("reflects variant attribute", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-thinking variant="wave"></ce-thinking>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-thinking") as CeThinking;
    await el.updateComplete;
    expect(el.getAttribute("variant")).toBe("wave");
    host.remove();
  });
});
