import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeLink } from "./link.js";

beforeAll(() => {
  defineOnce("ce-link", CeLink);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeLink).updateComplete;
}

describe("<ce-link>", () => {
  it("renders an <a> with the supplied href", async () => {
    const host = mount(`<ce-link href="/docs">Docs</ce-link>`);
    const el = host.querySelector("ce-link") as CeLink;
    await ready(el);
    const a = el.shadowRoot!.querySelector("a")!;
    expect(a.getAttribute("href")).toBe("/docs");
    host.remove();
  });

  it("adds target=_blank, rel, and ↗ glyph when external", async () => {
    const host = mount(`<ce-link href="https://example.com" external>Example</ce-link>`);
    const el = host.querySelector("ce-link") as CeLink;
    await ready(el);
    const a = el.shadowRoot!.querySelector("a")!;
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    expect(el.shadowRoot!.querySelector(".ce-link__ext")).not.toBeNull();
    host.remove();
  });

  it("does not add target/rel for internal links", async () => {
    const host = mount(`<ce-link href="/x">x</ce-link>`);
    const el = host.querySelector("ce-link") as CeLink;
    await ready(el);
    const a = el.shadowRoot!.querySelector("a")!;
    expect(a.hasAttribute("target")).toBe(false);
    expect(a.hasAttribute("rel")).toBe(false);
    expect(el.shadowRoot!.querySelector(".ce-link__ext")).toBeNull();
    host.remove();
  });

  it("passes through the download attribute", async () => {
    const host = mount(`<ce-link href="/report.pdf" download="report.pdf">PDF</ce-link>`);
    const el = host.querySelector("ce-link") as CeLink;
    await ready(el);
    expect(el.shadowRoot!.querySelector("a")!.getAttribute("download")).toBe("report.pdf");
    host.remove();
  });

  it("reflects the tone attribute", async () => {
    const host = mount(`<ce-link href="/x" tone="subtle">x</ce-link>`);
    const el = host.querySelector("ce-link") as CeLink;
    await ready(el);
    expect(el.getAttribute("tone")).toBe("subtle");
    host.remove();
  });

  it("falls back to # when href is empty", async () => {
    const host = mount(`<ce-link>x</ce-link>`);
    const el = host.querySelector("ce-link") as CeLink;
    await ready(el);
    expect(el.shadowRoot!.querySelector("a")!.getAttribute("href")).toBe("#");
    host.remove();
  });

  it("renders default slot content", async () => {
    const host = mount(`<ce-link href="/x"><strong>Bold</strong></ce-link>`);
    const el = host.querySelector("ce-link") as CeLink;
    await ready(el);
    expect(el.querySelector("strong")?.textContent).toBe("Bold");
    host.remove();
  });
});
