import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeInput } from "./input.js";

beforeAll(() => {
  defineOnce("ce-input", CeInput);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeInput).updateComplete;
}

describe("<ce-input>", () => {
  it("renders inner input with placeholder", async () => {
    const host = mount(`<ce-input placeholder="Type here"></ce-input>`);
    const el = host.querySelector("ce-input") as CeInput;
    await ready(el);
    const input = el.shadowRoot!.querySelector("input")!;
    expect(input.getAttribute("placeholder")).toBe("Type here");
    host.remove();
  });

  it("renders label", async () => {
    const host = mount(`<ce-input label="Email"></ce-input>`);
    const el = host.querySelector("ce-input") as CeInput;
    await ready(el);
    expect(el.shadowRoot!.querySelector("label")!.textContent).toContain("Email");
    host.remove();
  });

  it("emits ce-input on keystroke", async () => {
    const host = mount(`<ce-input></ce-input>`);
    const el = host.querySelector("ce-input") as CeInput;
    await ready(el);
    let detail: any = null;
    el.addEventListener("ce-input", (e) => (detail = (e as CustomEvent).detail));
    const input = el.shadowRoot!.querySelector("input")!;
    input.value = "hello";
    input.dispatchEvent(new Event("input"));
    expect(detail).toEqual({ value: "hello" });
    expect(el.value).toBe("hello");
    host.remove();
  });

  it("emits ce-change on commit", async () => {
    const host = mount(`<ce-input></ce-input>`);
    const el = host.querySelector("ce-input") as CeInput;
    await ready(el);
    let detail: any = null;
    el.addEventListener("ce-change", (e) => (detail = (e as CustomEvent).detail));
    const input = el.shadowRoot!.querySelector("input")!;
    input.value = "done";
    input.dispatchEvent(new Event("change"));
    expect(detail).toEqual({ value: "done" });
    host.remove();
  });

  it("type attribute forwards", async () => {
    const host = mount(`<ce-input type="email"></ce-input>`);
    const el = host.querySelector("ce-input") as CeInput;
    await ready(el);
    expect(el.shadowRoot!.querySelector("input")!.getAttribute("type")).toBe("email");
    host.remove();
  });

  it("error renders in err region with aria-invalid", async () => {
    const host = mount(`<ce-input error="bad value"></ce-input>`);
    const el = host.querySelector("ce-input") as CeInput;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".err")!.textContent).toContain("bad value");
    expect(el.shadowRoot!.querySelector("input")!.getAttribute("aria-invalid")).toBe("true");
    host.remove();
  });

  it("help renders in help region when no error", async () => {
    const host = mount(`<ce-input help="format: name@example.com"></ce-input>`);
    const el = host.querySelector("ce-input") as CeInput;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".help")!.textContent).toContain("name@example.com");
    host.remove();
  });

  it("required reflects + adds asterisk to label", async () => {
    const host = mount(`<ce-input label="Name" required></ce-input>`);
    const el = host.querySelector("ce-input") as CeInput;
    await ready(el);
    expect(el.required).toBe(true);
    expect(el.shadowRoot!.querySelector("label")!.textContent).toContain("*");
    host.remove();
  });
});
