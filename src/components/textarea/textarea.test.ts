import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeTextarea } from "./textarea.js";

beforeAll(() => {
  defineOnce("ce-textarea", CeTextarea);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeTextarea).updateComplete;
}

describe("<ce-textarea>", () => {
  it("renders inner textarea", async () => {
    const host = mount(`<ce-textarea placeholder="Notes"></ce-textarea>`);
    const el = host.querySelector("ce-textarea") as CeTextarea;
    await ready(el);
    const ta = el.shadowRoot!.querySelector("textarea")!;
    expect(ta.getAttribute("placeholder")).toBe("Notes");
    host.remove();
  });

  it("rows attribute forwards", async () => {
    const host = mount(`<ce-textarea rows="6"></ce-textarea>`);
    const el = host.querySelector("ce-textarea") as CeTextarea;
    await ready(el);
    expect(el.shadowRoot!.querySelector("textarea")!.getAttribute("rows")).toBe("6");
    host.remove();
  });

  it("emits ce-input on input", async () => {
    const host = mount(`<ce-textarea></ce-textarea>`);
    const el = host.querySelector("ce-textarea") as CeTextarea;
    await ready(el);
    let detail: any = null;
    el.addEventListener("ce-input", (e) => (detail = (e as CustomEvent).detail));
    const ta = el.shadowRoot!.querySelector("textarea")!;
    ta.value = "hello\nworld";
    ta.dispatchEvent(new Event("input"));
    expect(detail.value).toContain("hello");
    expect(el.value).toContain("hello");
    host.remove();
  });

  it("emits ce-change on commit", async () => {
    const host = mount(`<ce-textarea></ce-textarea>`);
    const el = host.querySelector("ce-textarea") as CeTextarea;
    await ready(el);
    let detail: any = null;
    el.addEventListener("ce-change", (e) => (detail = (e as CustomEvent).detail));
    const ta = el.shadowRoot!.querySelector("textarea")!;
    ta.value = "final";
    ta.dispatchEvent(new Event("change"));
    expect(detail.value).toBe("final");
    host.remove();
  });

  it("renders label", async () => {
    const host = mount(`<ce-textarea label="Comments"></ce-textarea>`);
    const el = host.querySelector("ce-textarea") as CeTextarea;
    await ready(el);
    expect(el.shadowRoot!.querySelector("label")!.textContent).toContain("Comments");
    host.remove();
  });

  it("error sets aria-invalid", async () => {
    const host = mount(`<ce-textarea error="Required"></ce-textarea>`);
    const el = host.querySelector("ce-textarea") as CeTextarea;
    await ready(el);
    expect(el.shadowRoot!.querySelector("textarea")!.getAttribute("aria-invalid")).toBe("true");
    expect(el.shadowRoot!.querySelector(".err")!.textContent).toContain("Required");
    host.remove();
  });

  it("disabled reflects", async () => {
    const host = mount(`<ce-textarea disabled></ce-textarea>`);
    const el = host.querySelector("ce-textarea") as CeTextarea;
    await ready(el);
    expect(el.disabled).toBe(true);
    expect(el.shadowRoot!.querySelector("textarea")!.disabled).toBe(true);
    host.remove();
  });
});
