import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeCursor } from "./cursor.js";

beforeAll(() => defineOnce("ce-cursor", CeCursor));

describe("<ce-cursor>", () => {
  it("upgrades and renders a shadow root with a caret span", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-cursor></ce-cursor>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-cursor") as CeCursor;
    await el.updateComplete;
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot!.querySelector(".ce-cursor__caret")).not.toBeNull();
    host.remove();
  });

  it("defaults shape to bar", async () => {
    const el = document.createElement("ce-cursor") as CeCursor;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shape).toBe("bar");
    el.remove();
  });

  it("reflects shape attribute", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-cursor shape="block"></ce-cursor>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-cursor") as CeCursor;
    await el.updateComplete;
    expect(el.shape).toBe("block");
    expect(el.getAttribute("shape")).toBe("block");
    host.remove();
  });

  it("accepts shape=underline", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-cursor shape="underline"></ce-cursor>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-cursor") as CeCursor;
    await el.updateComplete;
    expect(el.shape).toBe("underline");
    host.remove();
  });

  it("defaults blink-ms to 1000", async () => {
    const el = document.createElement("ce-cursor") as CeCursor;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.blinkMs).toBe(1000);
    el.remove();
  });

  it("applies a custom blink-ms via inline style on the caret", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-cursor blink-ms="600"></ce-cursor>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-cursor") as CeCursor;
    await el.updateComplete;
    expect(el.blinkMs).toBe(600);
    const caret = el.shadowRoot!.querySelector(".ce-cursor__caret") as HTMLElement;
    expect(caret.getAttribute("style") ?? "").toContain("600ms");
    host.remove();
  });

  it("marks the caret aria-hidden so screen readers don't announce it", async () => {
    const el = document.createElement("ce-cursor") as CeCursor;
    document.body.appendChild(el);
    await el.updateComplete;
    const caret = el.shadowRoot!.querySelector(".ce-cursor__caret")!;
    expect(caret.getAttribute("aria-hidden")).toBe("true");
    el.remove();
  });
});
