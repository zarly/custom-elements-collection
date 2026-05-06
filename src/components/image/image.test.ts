import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeImage } from "./image.js";

beforeAll(() => {
  defineOnce("ce-image", CeImage);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeImage).updateComplete;
}

describe("<ce-image>", () => {
  it("renders img with src and alt", async () => {
    const host = mount(
      `<ce-image src="/static/x.png" alt="Test image"></ce-image>`
    );
    const el = host.querySelector("ce-image") as CeImage;
    await ready(el);
    const img = el.shadowRoot!.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("/static/x.png");
    expect(img.getAttribute("alt")).toBe("Test image");
    host.remove();
  });

  it("renders caption attribute", async () => {
    const host = mount(`<ce-image src="x" caption="A photo"></ce-image>`);
    const el = host.querySelector("ce-image") as CeImage;
    await ready(el);
    expect(el.shadowRoot!.querySelector("figcaption")!.textContent).toContain("A photo");
    host.remove();
  });

  it("default loading is lazy", async () => {
    const host = mount(`<ce-image src="x"></ce-image>`);
    const el = host.querySelector("ce-image") as CeImage;
    await ready(el);
    expect(el.shadowRoot!.querySelector("img")!.getAttribute("loading")).toBe("lazy");
    host.remove();
  });

  it("emits ce-image-error and renders fallback when error fires", async () => {
    const host = mount(`<ce-image src="bad" fallback="/fallback.png" alt="x"></ce-image>`);
    const el = host.querySelector("ce-image") as CeImage;
    await ready(el);
    let detail: any = null;
    el.addEventListener("ce-image-error", (e) => (detail = (e as CustomEvent).detail));
    const img = el.shadowRoot!.querySelector("img")!;
    img.dispatchEvent(new Event("error"));
    await ready(el);
    expect(detail).toEqual({ src: "bad" });
    expect(el.shadowRoot!.querySelector("img")!.getAttribute("src")).toBe("/fallback.png");
    host.remove();
  });

  it("renders error div when error and no fallback", async () => {
    const host = mount(`<ce-image src="bad" alt="missing"></ce-image>`);
    const el = host.querySelector("ce-image") as CeImage;
    await ready(el);
    const img = el.shadowRoot!.querySelector("img")!;
    img.dispatchEvent(new Event("error"));
    await ready(el);
    expect(el.shadowRoot!.querySelector(".err")).not.toBeNull();
    host.remove();
  });

  it("width and height attributes forward", async () => {
    const host = mount(`<ce-image src="x" width="640" height="360"></ce-image>`);
    const el = host.querySelector("ce-image") as CeImage;
    await ready(el);
    const img = el.shadowRoot!.querySelector("img")!;
    expect(img.getAttribute("width")).toBe("640");
    expect(img.getAttribute("height")).toBe("360");
    host.remove();
  });

  it("error event fires only once per failure", async () => {
    const host = mount(`<ce-image src="bad"></ce-image>`);
    const el = host.querySelector("ce-image") as CeImage;
    await ready(el);
    let count = 0;
    el.addEventListener("ce-image-error", () => count++);
    const img = el.shadowRoot!.querySelector("img")!;
    img.dispatchEvent(new Event("error"));
    await ready(el);
    img.dispatchEvent(new Event("error"));
    expect(count).toBe(1);
    host.remove();
  });
});
