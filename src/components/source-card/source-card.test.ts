import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeSourceCard } from "./source-card.js";

beforeAll(() => {
  defineOnce("ce-source-card", CeSourceCard);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeSourceCard).updateComplete;
}

describe("<ce-source-card>", () => {
  it("renders a title from the title attribute", async () => {
    const host = mount(`<ce-source-card title="Lit · Components"></ce-source-card>`);
    const card = host.querySelector("ce-source-card") as CeSourceCard;
    await ready(card);
    expect(card.shadowRoot!.querySelector(".title")!.textContent).toContain("Lit · Components");
    host.remove();
  });

  it("wraps title in an anchor with target=_blank when url is set", async () => {
    const host = mount(
      `<ce-source-card url="https://lit.dev" title="Lit"></ce-source-card>`,
    );
    const card = host.querySelector("ce-source-card") as CeSourceCard;
    await ready(card);
    const a = card.shadowRoot!.querySelector(".title a") as HTMLAnchorElement;
    expect(a).not.toBeNull();
    expect(a.getAttribute("href")).toBe("https://lit.dev");
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toContain("noreferrer");
    host.remove();
  });

  it("derives the site label from the url host when site is not provided", async () => {
    const host = mount(
      `<ce-source-card url="https://docs.example.com/article" title="X"></ce-source-card>`,
    );
    const card = host.querySelector("ce-source-card") as CeSourceCard;
    await ready(card);
    expect(card.shadowRoot!.querySelector(".site")!.textContent).toBe("docs.example.com");
    host.remove();
  });

  it("prefers an explicit site attribute over the URL host", async () => {
    const host = mount(
      `<ce-source-card url="https://docs.example.com" site="Example Docs" title="X"></ce-source-card>`,
    );
    const card = host.querySelector("ce-source-card") as CeSourceCard;
    await ready(card);
    expect(card.shadowRoot!.querySelector(".site")!.textContent).toBe("Example Docs");
    host.remove();
  });

  it("renders the index as [n] when finite", async () => {
    const host = mount(`<ce-source-card index="3" title="X"></ce-source-card>`);
    const card = host.querySelector("ce-source-card") as CeSourceCard;
    await ready(card);
    expect(card.shadowRoot!.querySelector(".index")!.textContent).toBe("[3]");
    host.remove();
  });

  it("normalizes a 0..1 score to a percentage display", async () => {
    const host = mount(`<ce-source-card score="0.82" title="X"></ce-source-card>`);
    const card = host.querySelector("ce-source-card") as CeSourceCard;
    await ready(card);
    expect(card.shadowRoot!.querySelector(".score")!.textContent).toBe("82%");
    host.remove();
  });

  it("accepts a 0..100 score and renders it directly", async () => {
    const host = mount(`<ce-source-card score="64" title="X"></ce-source-card>`);
    const card = host.querySelector("ce-source-card") as CeSourceCard;
    await ready(card);
    expect(card.shadowRoot!.querySelector(".score")!.textContent).toBe("64%");
    host.remove();
  });

  it("renders snippet text in the default slot", async () => {
    const host = mount(
      `<ce-source-card title="Doc"><p>Snippet body</p></ce-source-card>`,
    );
    const card = host.querySelector("ce-source-card") as CeSourceCard;
    await ready(card);
    expect(card.textContent).toContain("Snippet body");
    host.remove();
  });
});
