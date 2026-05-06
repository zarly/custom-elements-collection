import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeSkeleton } from "./skeleton.js";

beforeAll(() => {
  defineOnce("ce-skeleton", CeSkeleton);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeSkeleton).updateComplete;
}

describe("<ce-skeleton>", () => {
  it("default shape is text with 1 line", async () => {
    const host = mount(`<ce-skeleton></ce-skeleton>`);
    const el = host.querySelector("ce-skeleton") as CeSkeleton;
    await ready(el);
    expect(el.shape).toBe("text");
    expect(el.shadowRoot!.querySelectorAll(".text-line").length).toBe(1);
    host.remove();
  });

  it("renders multiple text lines", async () => {
    const host = mount(`<ce-skeleton lines="4"></ce-skeleton>`);
    const el = host.querySelector("ce-skeleton") as CeSkeleton;
    await ready(el);
    expect(el.shadowRoot!.querySelectorAll(".text-line").length).toBe(4);
    host.remove();
  });

  it("shape=circle renders single bar", async () => {
    const host = mount(`<ce-skeleton shape="circle"></ce-skeleton>`);
    const el = host.querySelector("ce-skeleton") as CeSkeleton;
    await ready(el);
    expect(el.getAttribute("shape")).toBe("circle");
    expect(el.shadowRoot!.querySelectorAll(".bar").length).toBe(1);
    host.remove();
  });

  it("shape=rect renders single bar with custom dims", async () => {
    const host = mount(
      `<ce-skeleton shape="rect" width="200px" height="120px"></ce-skeleton>`
    );
    const el = host.querySelector("ce-skeleton") as CeSkeleton;
    await ready(el);
    const bar = el.shadowRoot!.querySelector(".bar") as HTMLElement;
    expect(bar.style.width).toBe("200px");
    expect(bar.style.height).toBe("120px");
    host.remove();
  });

  it("last line is shorter when multiple lines", async () => {
    const host = mount(`<ce-skeleton lines="3"></ce-skeleton>`);
    const el = host.querySelector("ce-skeleton") as CeSkeleton;
    await ready(el);
    const lines = el.shadowRoot!.querySelectorAll(".text-line");
    expect(lines[lines.length - 1].classList.contains("last")).toBe(true);
    host.remove();
  });

  it("ARIA: marks decorations as aria-hidden", async () => {
    const host = mount(`<ce-skeleton></ce-skeleton>`);
    const el = host.querySelector("ce-skeleton") as CeSkeleton;
    await ready(el);
    const root = el.shadowRoot!.querySelector("[aria-hidden='true']");
    expect(root).not.toBeNull();
    host.remove();
  });
});
