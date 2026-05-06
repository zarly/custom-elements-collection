import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeAbbr } from "./abbr.js";

beforeAll(() => {
  defineOnce("ce-abbr", CeAbbr);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeAbbr).updateComplete;
}

describe("<ce-abbr>", () => {
  it("renders default slot", async () => {
    const host = mount(`<ce-abbr title="Application Programming Interface">API</ce-abbr>`);
    const el = host.querySelector("ce-abbr") as CeAbbr;
    await ready(el);
    expect(el.textContent).toBe("API");
    host.remove();
  });

  it("title attribute populates aria-label", async () => {
    const host = mount(`<ce-abbr title="World Wide Web">WWW</ce-abbr>`);
    const el = host.querySelector("ce-abbr") as CeAbbr;
    await ready(el);
    expect(el.getAttribute("aria-label")).toBe("World Wide Web");
    host.remove();
  });

  it("is keyboard-focusable (tabindex=0)", async () => {
    const host = mount(`<ce-abbr title="x">y</ce-abbr>`);
    const el = host.querySelector("ce-abbr") as CeAbbr;
    await ready(el);
    expect(el.getAttribute("tabindex")).toBe("0");
    host.remove();
  });

  it("preserves explicit tabindex", async () => {
    const host = mount(`<ce-abbr title="x" tabindex="-1">y</ce-abbr>`);
    const el = host.querySelector("ce-abbr") as CeAbbr;
    await ready(el);
    expect(el.getAttribute("tabindex")).toBe("-1");
    host.remove();
  });

  it("updates aria-label when title changes", async () => {
    const host = mount(`<ce-abbr title="initial">x</ce-abbr>`);
    const el = host.querySelector("ce-abbr") as CeAbbr;
    await ready(el);
    el.title = "updated";
    await ready(el);
    expect(el.getAttribute("aria-label")).toBe("updated");
    host.remove();
  });

  it("renders shadow slot", async () => {
    const host = mount(`<ce-abbr title="x">y</ce-abbr>`);
    const el = host.querySelector("ce-abbr") as CeAbbr;
    await ready(el);
    expect(el.shadowRoot!.querySelector("slot")).not.toBeNull();
    host.remove();
  });
});
