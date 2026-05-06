import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeCopyButton } from "./copy-button.js";

beforeAll(() => defineOnce("ce-copy-button", CeCopyButton));

beforeEach(() => {
  // jsdom does not implement Clipboard API; stub a minimal one.
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

async function tick(): Promise<void> {
  // Allow the click handler's microtasks to flush.
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("<ce-copy-button>", () => {
  it("upgrades and renders a button with the default label", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-copy-button for="src1"></ce-copy-button>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-copy-button") as CeCopyButton;
    await el.updateComplete;
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot!.querySelector("button")?.textContent?.trim()).toBe("Copy");
    host.remove();
  });

  it("uses the label attribute", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-copy-button for="src1" label="Copy code"></ce-copy-button>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-copy-button") as CeCopyButton;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("button")?.textContent?.trim()).toBe("Copy code");
    host.remove();
  });

  it("emits ce-copy { ok: true, text } when the target exists", async () => {
    const host = document.createElement("div");
    host.innerHTML = `
      <pre id="src1">hello world</pre>
      <ce-copy-button for="src1"></ce-copy-button>
    `;
    document.body.appendChild(host);
    const el = host.querySelector("ce-copy-button") as CeCopyButton;
    await el.updateComplete;
    let detail: { text: string; ok: boolean } | null = null;
    el.addEventListener("ce-copy", (e) => {
      detail = (e as CustomEvent).detail;
    });
    const btn = el.shadowRoot!.querySelector("button") as HTMLButtonElement;
    btn.click();
    await tick();
    expect(detail).toEqual({ text: "hello world", ok: true });
    host.remove();
  });

  it("emits ce-copy { ok: false, text: '' } when target missing", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-copy-button for="missing"></ce-copy-button>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-copy-button") as CeCopyButton;
    await el.updateComplete;
    let detail: { text: string; ok: boolean } | null = null;
    el.addEventListener("ce-copy", (e) => {
      detail = (e as CustomEvent).detail;
    });
    const btn = el.shadowRoot!.querySelector("button") as HTMLButtonElement;
    btn.click();
    await tick();
    expect(detail).toEqual({ text: "", ok: false });
    host.remove();
  });

  it("reads textarea.value rather than textContent", async () => {
    const host = document.createElement("div");
    host.innerHTML = `
      <textarea id="src2">attribute fallback</textarea>
      <ce-copy-button for="src2"></ce-copy-button>
    `;
    document.body.appendChild(host);
    const ta = host.querySelector("textarea") as HTMLTextAreaElement;
    ta.value = "user-typed";
    const el = host.querySelector("ce-copy-button") as CeCopyButton;
    await el.updateComplete;
    let detail: { text: string; ok: boolean } | null = null;
    el.addEventListener("ce-copy", (e) => {
      detail = (e as CustomEvent).detail;
    });
    const btn = el.shadowRoot!.querySelector("button") as HTMLButtonElement;
    btn.click();
    await tick();
    expect(detail?.text).toBe("user-typed");
    host.remove();
  });

  it("cycles button label to copied-label after success", async () => {
    const host = document.createElement("div");
    host.innerHTML = `
      <pre id="src3">x</pre>
      <ce-copy-button for="src3" copied-label="Yes!"></ce-copy-button>
    `;
    document.body.appendChild(host);
    const el = host.querySelector("ce-copy-button") as CeCopyButton;
    await el.updateComplete;
    const btn = el.shadowRoot!.querySelector("button") as HTMLButtonElement;
    btn.click();
    await tick();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("button")?.textContent?.trim()).toBe("Yes!");
    host.remove();
  });

  it("calls navigator.clipboard.writeText with the resolved text", async () => {
    const host = document.createElement("div");
    host.innerHTML = `
      <pre id="src4">copied-text</pre>
      <ce-copy-button for="src4"></ce-copy-button>
    `;
    document.body.appendChild(host);
    const el = host.querySelector("ce-copy-button") as CeCopyButton;
    await el.updateComplete;
    const btn = el.shadowRoot!.querySelector("button") as HTMLButtonElement;
    btn.click();
    await tick();
    expect((navigator.clipboard.writeText as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      "copied-text"
    );
    host.remove();
  });

  it("supports a CSS selector in `for`", async () => {
    const host = document.createElement("div");
    host.innerHTML = `
      <pre class="snippet" data-i="1">selected</pre>
      <ce-copy-button for=".snippet"></ce-copy-button>
    `;
    document.body.appendChild(host);
    const el = host.querySelector("ce-copy-button") as CeCopyButton;
    await el.updateComplete;
    let detail: { text: string; ok: boolean } | null = null;
    el.addEventListener("ce-copy", (e) => {
      detail = (e as CustomEvent).detail;
    });
    (el.shadowRoot!.querySelector("button") as HTMLButtonElement).click();
    await tick();
    expect(detail?.text).toBe("selected");
    host.remove();
  });
});
