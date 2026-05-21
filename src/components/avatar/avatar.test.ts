import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeAvatar } from "./avatar.js";

beforeAll(() => {
  defineOnce("ce-avatar", CeAvatar);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeAvatar).updateComplete;
}

describe("<ce-avatar>", () => {
  it("renders an <img> when src is set", async () => {
    const host = mount(`<ce-avatar src="https://example.com/a.png" name="Ada Lovelace"></ce-avatar>`);
    const el = host.querySelector("ce-avatar") as CeAvatar;
    await ready(el);
    const img = el.shadowRoot!.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toBe("https://example.com/a.png");
    expect(img!.getAttribute("alt")).toBe("Ada Lovelace");
    host.remove();
  });

  it("falls back to monogram initials from name", async () => {
    const host = mount(`<ce-avatar name="Grace Hopper"></ce-avatar>`);
    const el = host.querySelector("ce-avatar") as CeAvatar;
    await ready(el);
    const span = el.shadowRoot!.querySelector(".ce-avatar__initials");
    expect(span?.textContent).toBe("GH");
    host.remove();
  });

  it("uses only first 2 tokens for initials", async () => {
    const host = mount(`<ce-avatar name="Donald Ervin Knuth"></ce-avatar>`);
    const el = host.querySelector("ce-avatar") as CeAvatar;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".ce-avatar__initials")?.textContent).toBe("DE");
    host.remove();
  });

  it("renders nothing in the slot when no src and no name", async () => {
    const host = mount(`<ce-avatar></ce-avatar>`);
    const el = host.querySelector("ce-avatar") as CeAvatar;
    await ready(el);
    expect(el.shadowRoot!.querySelector("img")).toBeNull();
    expect(el.shadowRoot!.querySelector(".ce-avatar__initials")).toBeNull();
    host.remove();
  });

  it("reflects size and shape attributes", async () => {
    const host = mount(`<ce-avatar size="lg" shape="square" name="X"></ce-avatar>`);
    const el = host.querySelector("ce-avatar") as CeAvatar;
    await ready(el);
    expect(el.getAttribute("size")).toBe("lg");
    expect(el.getAttribute("shape")).toBe("square");
    host.remove();
  });

  it("accepts an explicit alt that overrides name", async () => {
    const host = mount(`<ce-avatar src="https://x" name="Ada" alt="Ada portrait"></ce-avatar>`);
    const el = host.querySelector("ce-avatar") as CeAvatar;
    await ready(el);
    expect(el.shadowRoot!.querySelector("img")!.getAttribute("alt")).toBe("Ada portrait");
    host.remove();
  });

  it("accepts a default slot override", async () => {
    const host = mount(`<ce-avatar><svg data-x="ok"></svg></ce-avatar>`);
    const el = host.querySelector("ce-avatar") as CeAvatar;
    await ready(el);
    // slotted child remains in light DOM under the host
    expect(el.querySelector("[data-x='ok']")).not.toBeNull();
    host.remove();
  });
});
