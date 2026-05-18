import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeQuote } from "./quote.js";

beforeAll(() => {
  defineOnce("ce-quote", CeQuote);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeQuote).updateComplete;
}

describe("<ce-quote>", () => {
  it("defaults to variant=card and reflects it on the host", async () => {
    const host = mount(`<ce-quote>Quote text</ce-quote>`);
    const el = host.querySelector("ce-quote") as CeQuote;
    await ready(el);
    expect(el.getAttribute("variant")).toBe("card");
    expect(el.variant).toBe("card");
    host.remove();
  });

  it("renders a <blockquote> in shadow DOM", async () => {
    const host = mount(`<ce-quote>Some text</ce-quote>`);
    const el = host.querySelector("ce-quote") as CeQuote;
    await ready(el);
    expect(el.shadowRoot!.querySelector("blockquote")).not.toBeNull();
    host.remove();
  });

  it("renders default slot content inside the blockquote", async () => {
    const host = mount(`<ce-quote>Quote body text</ce-quote>`);
    const el = host.querySelector("ce-quote") as CeQuote;
    await ready(el);
    // Default slot is inside blockquote; light-DOM text is accessible
    expect(el.textContent).toContain("Quote body text");
    const bq = el.shadowRoot!.querySelector("blockquote")!;
    expect(bq).not.toBeNull();
    host.remove();
  });

  it("renders rich children in the default slot (em, a)", async () => {
    const host = mount(
      `<ce-quote><em>Emphasized</em> and <a href="#">linked</a></ce-quote>`
    );
    const el = host.querySelector("ce-quote") as CeQuote;
    await ready(el);
    expect(el.querySelector("em")?.textContent).toBe("Emphasized");
    expect(el.querySelector("a")?.getAttribute("href")).toBe("#");
    host.remove();
  });

  it("author attribute is displayed via the attribution footer", async () => {
    const host = mount(`<ce-quote author="Anna, PM FinTech">Text</ce-quote>`);
    const el = host.querySelector("ce-quote") as CeQuote;
    await ready(el);
    expect(el.author).toBe("Anna, PM FinTech");
    // cite element appears in shadow DOM
    const cite = el.shadowRoot!.querySelector("cite");
    expect(cite).not.toBeNull();
    host.remove();
  });

  it("source attribute is displayed in attribution", async () => {
    const host = mount(
      `<ce-quote author="Dmitry" source="Customer interview, 2026-03">Text</ce-quote>`
    );
    const el = host.querySelector("ce-quote") as CeQuote;
    await ready(el);
    expect(el.source).toBe("Customer interview, 2026-03");
    const cite = el.shadowRoot!.querySelector("cite");
    expect(cite).not.toBeNull();
    host.remove();
  });

  it("slot='author' overrides the author attribute", async () => {
    const host = mount(
      `<ce-quote author="Fallback Author">Text<span slot="author"><a href="mailto:x@example.com">Anna</a></span></ce-quote>`
    );
    const el = host.querySelector("ce-quote") as CeQuote;
    await ready(el);
    // The slot element is present
    const slottedAuthor = el.querySelector('[slot="author"]');
    expect(slottedAuthor).not.toBeNull();
    expect(slottedAuthor?.querySelector("a")?.getAttribute("href")).toBe(
      "mailto:x@example.com"
    );
    host.remove();
  });

  it("slot='source' overrides the source attribute", async () => {
    const host = mount(
      `<ce-quote source="Fallback Source">Text<span slot="source"><time datetime="2026-03-15">15 марта 2026</time></span></ce-quote>`
    );
    const el = host.querySelector("ce-quote") as CeQuote;
    await ready(el);
    const slottedSource = el.querySelector('[slot="source"]');
    expect(slottedSource).not.toBeNull();
    expect(slottedSource?.querySelector("time")?.getAttribute("datetime")).toBe(
      "2026-03-15"
    );
    host.remove();
  });

  it("variant=pull reflects on the host", async () => {
    const host = mount(`<ce-quote variant="pull" author="Sam Altman">Text</ce-quote>`);
    const el = host.querySelector("ce-quote") as CeQuote;
    await ready(el);
    expect(el.getAttribute("variant")).toBe("pull");
    expect(el.variant).toBe("pull");
    host.remove();
  });

  it("variant=inline reflects on the host", async () => {
    const host = mount(`<ce-quote variant="inline">Inline text</ce-quote>`);
    const el = host.querySelector("ce-quote") as CeQuote;
    await ready(el);
    expect(el.getAttribute("variant")).toBe("inline");
    host.remove();
  });

  it("variant switches from card to pull updates reflected attr", async () => {
    const host = mount(`<ce-quote>Text</ce-quote>`);
    const el = host.querySelector("ce-quote") as CeQuote;
    await ready(el);
    expect(el.getAttribute("variant")).toBe("card");
    el.variant = "pull";
    await ready(el);
    expect(el.getAttribute("variant")).toBe("pull");
    el.variant = "inline";
    await ready(el);
    expect(el.getAttribute("variant")).toBe("inline");
    host.remove();
  });

  it("no attribution footer rendered when author and source are absent", async () => {
    const host = mount(`<ce-quote>Text only, no attribution</ce-quote>`);
    const el = host.querySelector("ce-quote") as CeQuote;
    await ready(el);
    const footer = el.shadowRoot!.querySelector(".ce-quote__attribution");
    expect(footer).toBeNull();
    host.remove();
  });

  it("omits separator when only author is present", async () => {
    const host = mount(`<ce-quote author="Solo Author">Text</ce-quote>`);
    const el = host.querySelector("ce-quote") as CeQuote;
    await ready(el);
    const sep = el.shadowRoot!.querySelector(".ce-quote__sep");
    expect(sep).toBeNull();
    host.remove();
  });

  it("shows separator when both author and source are present", async () => {
    const host = mount(
      `<ce-quote author="Anna" source="Interview 2026">Text</ce-quote>`
    );
    const el = host.querySelector("ce-quote") as CeQuote;
    await ready(el);
    const sep = el.shadowRoot!.querySelector(".ce-quote__sep");
    expect(sep).not.toBeNull();
    host.remove();
  });
});
