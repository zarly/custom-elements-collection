import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../core/index.js";
import { CeCode } from "./code.js";

beforeAll(() => defineOnce("ce-code", CeCode));

describe("<ce-code>", () => {
  it("renders a code body with slotted content", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-code>console.log("hi")</ce-code>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-code") as CeCode;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-code__body")).not.toBeNull();
    expect(el.textContent).toContain('console.log("hi")');
    host.remove();
  });

  it("shows filename and lang in header when set", async () => {
    const el = document.createElement("ce-code") as CeCode;
    el.filename = "src/index.ts";
    el.lang = "ts";
    el.textContent = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-code__filename")?.textContent).toBe(
      "src/index.ts"
    );
    expect(el.shadowRoot!.querySelector(".ce-code__lang")?.textContent).toBe("ts");
    el.remove();
  });

  it("shows copy button by default", async () => {
    const el = document.createElement("ce-code") as CeCode;
    el.textContent = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-code__copy")).not.toBeNull();
    el.remove();
  });

  it("hides copy button when copy=false", async () => {
    const el = document.createElement("ce-code") as CeCode;
    el.copy = false;
    el.textContent = "x";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-code__copy")).toBeNull();
    el.remove();
  });

  it("dispatches ce-code-copy when copy button is clicked", async () => {
    const el = document.createElement("ce-code") as CeCode;
    el.textContent = "console.log(1)";
    document.body.appendChild(el);
    await el.updateComplete;
    let fired = false;
    el.addEventListener("ce-code-copy", () => (fired = true));
    // navigator.clipboard may not be available in jsdom; stub it
    (navigator as any).clipboard = { writeText: async () => {} };
    const btn = el.shadowRoot!.querySelector(".ce-code__copy") as HTMLButtonElement;
    btn.click();
    // wait for microtasks
    await Promise.resolve();
    await Promise.resolve();
    expect(fired).toBe(true);
    el.remove();
  });
});
