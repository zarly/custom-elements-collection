import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeTag } from "./tag.js";

beforeAll(() => {
  defineOnce("ce-tag", CeTag);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeTag).updateComplete;
}

describe("<ce-tag>", () => {
  it("renders slotted label with a leading hash glyph", async () => {
    const host = mount(`<ce-tag>typescript</ce-tag>`);
    const el = host.querySelector("ce-tag") as CeTag;
    await ready(el);
    expect(el.textContent?.trim()).toBe("typescript");
    expect(el.shadowRoot!.querySelector(".ce-tag__hash")?.textContent).toBe("#");
    host.remove();
  });

  it("reflects color attribute", async () => {
    const host = mount(`<ce-tag color="blue">x</ce-tag>`);
    const el = host.querySelector("ce-tag") as CeTag;
    await ready(el);
    expect(el.getAttribute("color")).toBe("blue");
    host.remove();
  });

  it("does not render the remove button by default", async () => {
    const host = mount(`<ce-tag>x</ce-tag>`);
    const el = host.querySelector("ce-tag") as CeTag;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".ce-tag__remove")).toBeNull();
    host.remove();
  });

  it("renders the remove button when removable", async () => {
    const host = mount(`<ce-tag removable>x</ce-tag>`);
    const el = host.querySelector("ce-tag") as CeTag;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".ce-tag__remove")).not.toBeNull();
    host.remove();
  });

  it("emits ce-tag-remove with value detail on remove click", async () => {
    const host = mount(`<ce-tag removable value="ts">typescript</ce-tag>`);
    const el = host.querySelector("ce-tag") as CeTag;
    await ready(el);
    let detail: unknown = null;
    el.addEventListener("ce-tag-remove", (e) => {
      detail = (e as CustomEvent).detail;
    });
    const btn = el.shadowRoot!.querySelector(".ce-tag__remove") as HTMLButtonElement;
    btn.click();
    expect(detail).toEqual({ value: "ts" });
    host.remove();
  });

  it("ce-tag-remove bubbles and is composed", async () => {
    const host = mount(`<div id="outer"><ce-tag removable>x</ce-tag></div>`);
    const el = host.querySelector("ce-tag") as CeTag;
    await ready(el);
    let seen = false;
    (host.querySelector("#outer") as HTMLElement).addEventListener("ce-tag-remove", () => {
      seen = true;
    });
    (el.shadowRoot!.querySelector(".ce-tag__remove") as HTMLButtonElement).click();
    expect(seen).toBe(true);
    host.remove();
  });

  it("forwards a null value when value is not set", async () => {
    const host = mount(`<ce-tag removable>x</ce-tag>`);
    const el = host.querySelector("ce-tag") as CeTag;
    await ready(el);
    let detail: { value: string | null } | null = null;
    el.addEventListener("ce-tag-remove", (e) => {
      detail = (e as CustomEvent).detail as { value: string | null };
    });
    (el.shadowRoot!.querySelector(".ce-tag__remove") as HTMLButtonElement).click();
    expect(detail).not.toBeNull();
    expect(detail!.value).toBeNull();
    host.remove();
  });
});
