import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeToolCall } from "./tool-call.js";

beforeAll(() => defineOnce("ce-tool-call", CeToolCall));

describe("<ce-tool-call>", () => {
  it("upgrades and renders shadow root", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-tool-call name="search"></ce-tool-call>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-tool-call") as CeToolCall;
    await el.updateComplete;
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot!.querySelector(".ce-toolcall__name")?.textContent).toBe("search");
    host.remove();
  });

  it("default status is running", async () => {
    const el = document.createElement("ce-tool-call") as CeToolCall;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.status).toBe("running");
    expect(el.shadowRoot!.querySelector(".ce-toolcall__dot")?.getAttribute("data-status")).toBe(
      "running"
    );
    el.remove();
  });

  it("reflects status attribute", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-tool-call name="x" status="ok"></ce-tool-call>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-tool-call") as CeToolCall;
    await el.updateComplete;
    expect(el.getAttribute("status")).toBe("ok");
    host.remove();
  });

  it("clicking the header toggles open and emits ce-toolcall-toggle", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-tool-call name="x"></ce-tool-call>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-tool-call") as CeToolCall;
    await el.updateComplete;
    let detail: { open: boolean } | null = null;
    el.addEventListener("ce-toolcall-toggle", (e) => {
      detail = (e as CustomEvent).detail;
    });
    const head = el.shadowRoot!.querySelector(".ce-toolcall__head") as HTMLButtonElement;
    head.click();
    await el.updateComplete;
    expect(el.open).toBe(true);
    expect(detail).toEqual({ open: true });
    head.click();
    await el.updateComplete;
    expect(el.open).toBe(false);
    expect(detail).toEqual({ open: false });
    host.remove();
  });

  it("aria-expanded mirrors open state", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-tool-call name="x" open></ce-tool-call>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-tool-call") as CeToolCall;
    await el.updateComplete;
    const head = el.shadowRoot!.querySelector(".ce-toolcall__head")!;
    expect(head.getAttribute("aria-expanded")).toBe("true");
    host.remove();
  });

  it("renders args/result/error slots in panel", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-tool-call name="x" status="ok" open>
      <pre slot="args">{"q":"a"}</pre>
      <pre slot="result">"b"</pre>
    </ce-tool-call>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-tool-call") as CeToolCall;
    await el.updateComplete;
    const slots = Array.from(el.shadowRoot!.querySelectorAll("slot"));
    const names = slots.map((s) => s.getAttribute("name") ?? "default");
    expect(names).toContain("args");
    expect(names).toContain("result");
    host.remove();
  });

  it("renders error slot only when status=error", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-tool-call name="x" status="error" open></ce-tool-call>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-tool-call") as CeToolCall;
    await el.updateComplete;
    const errorSlot = el.shadowRoot!.querySelector('slot[name="error"]');
    expect(errorSlot).not.toBeNull();
    host.remove();
  });

  it("formats duration in ms under 1s", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-tool-call name="x" duration-ms="234"></ce-tool-call>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-tool-call") as CeToolCall;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-toolcall__duration")?.textContent).toBe("234 ms");
    host.remove();
  });

  it("formats duration in seconds when >= 1000ms", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-tool-call name="x" duration-ms="1234"></ce-tool-call>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-tool-call") as CeToolCall;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-toolcall__duration")?.textContent).toBe("1.2 s");
    host.remove();
  });
});
