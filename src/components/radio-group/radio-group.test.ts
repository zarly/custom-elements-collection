import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeRadioGroup } from "./radio-group.js";

beforeAll(() => {
  defineOnce("ce-radio-group", CeRadioGroup);
});

const SAMPLE = [
  { value: "a", label: "Apple" },
  { value: "b", label: "Banana" },
  { value: "c", label: "Cherry", hint: "stoned fruit" },
];

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}
async function ready(el: Element): Promise<void> {
  await (el as CeRadioGroup).updateComplete;
}

describe("<ce-radio-group>", () => {
  it("renders one role=radio button per option (classic default)", async () => {
    const host = mount(`<ce-radio-group></ce-radio-group>`);
    const el = host.querySelector("ce-radio-group") as CeRadioGroup;
    el.options = SAMPLE;
    await ready(el);
    const radios = el.shadowRoot!.querySelectorAll("[role='radio']");
    expect(radios.length).toBe(3);
    expect(el.getAttribute("role")).toBe("radiogroup");
    host.remove();
  });

  it("accepts options as a JSON attribute (string-props rule)", async () => {
    const host = mount(
      `<ce-radio-group options='[{"value":"x","label":"X"},{"value":"y","label":"Y"}]'></ce-radio-group>`
    );
    const el = host.querySelector("ce-radio-group") as CeRadioGroup;
    await ready(el);
    expect(el.options.length).toBe(2);
    expect(el.shadowRoot!.querySelectorAll("[role='radio']").length).toBe(2);
    host.remove();
  });

  it("clicking an option fires ce-change with { name, value }", async () => {
    const host = mount(`<ce-radio-group name="fruit"></ce-radio-group>`);
    const el = host.querySelector("ce-radio-group") as CeRadioGroup;
    el.options = SAMPLE;
    await ready(el);
    let detail: any = null;
    el.addEventListener("ce-change", (e) => (detail = (e as CustomEvent).detail));
    const second = el.shadowRoot!.querySelectorAll<HTMLButtonElement>("[role='radio']")[1];
    second.click();
    await ready(el);
    expect(el.value).toBe("b");
    expect(detail).toEqual({ name: "fruit", value: "b" });
    expect(second.getAttribute("aria-checked")).toBe("true");
    host.remove();
  });

  it("does not fire ce-change when re-clicking the already-selected option", async () => {
    const host = mount(`<ce-radio-group value="a"></ce-radio-group>`);
    const el = host.querySelector("ce-radio-group") as CeRadioGroup;
    el.options = SAMPLE;
    await ready(el);
    let count = 0;
    el.addEventListener("ce-change", () => count++);
    const first = el.shadowRoot!.querySelectorAll<HTMLButtonElement>("[role='radio']")[0];
    first.click();
    await ready(el);
    expect(count).toBe(0);
    host.remove();
  });

  it("ArrowRight selects + focuses the next enabled option (skips disabled)", async () => {
    const host = mount(`<ce-radio-group value="a"></ce-radio-group>`);
    const el = host.querySelector("ce-radio-group") as CeRadioGroup;
    el.options = [
      { value: "a", label: "A" },
      { value: "b", label: "B", disabled: true },
      { value: "c", label: "C" },
    ];
    await ready(el);
    const buttons = el.shadowRoot!.querySelectorAll<HTMLButtonElement>("[role='radio']");
    buttons[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await ready(el);
    expect(el.value).toBe("c"); // jumped over disabled
    host.remove();
  });

  it("ArrowLeft wraps from first to last enabled", async () => {
    const host = mount(`<ce-radio-group value="a"></ce-radio-group>`);
    const el = host.querySelector("ce-radio-group") as CeRadioGroup;
    el.options = SAMPLE;
    await ready(el);
    const first = el.shadowRoot!.querySelectorAll<HTMLButtonElement>("[role='radio']")[0];
    first.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    await ready(el);
    expect(el.value).toBe("c");
    host.remove();
  });

  it("Home/End jump to first/last enabled", async () => {
    const host = mount(`<ce-radio-group value="b"></ce-radio-group>`);
    const el = host.querySelector("ce-radio-group") as CeRadioGroup;
    el.options = SAMPLE;
    await ready(el);
    const second = el.shadowRoot!.querySelectorAll<HTMLButtonElement>("[role='radio']")[1];
    second.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await ready(el);
    expect(el.value).toBe("c");

    const third = el.shadowRoot!.querySelectorAll<HTMLButtonElement>("[role='radio']")[2];
    third.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await ready(el);
    expect(el.value).toBe("a");
    host.remove();
  });

  it("variant=segmented renders the same options with the segmented class", async () => {
    const host = mount(`<ce-radio-group variant="segmented"></ce-radio-group>`);
    const el = host.querySelector("ce-radio-group") as CeRadioGroup;
    el.options = SAMPLE;
    await ready(el);
    const segs = el.shadowRoot!.querySelectorAll(".opt-seg");
    expect(segs.length).toBe(3);
    expect(el.shadowRoot!.querySelector(".opt-classic")).toBeNull();
    host.remove();
  });

  it("variant=card renders hint text when provided", async () => {
    const host = mount(`<ce-radio-group variant="card"></ce-radio-group>`);
    const el = host.querySelector("ce-radio-group") as CeRadioGroup;
    el.options = SAMPLE;
    await ready(el);
    const cards = el.shadowRoot!.querySelectorAll(".opt-card");
    expect(cards.length).toBe(3);
    // Cherry has a hint
    const hints = el.shadowRoot!.querySelectorAll(".hint");
    expect(hints.length).toBe(1);
    expect(hints[0].textContent).toContain("stoned fruit");
    host.remove();
  });

  it("invalid variant falls back to classic", async () => {
    const host = mount(`<ce-radio-group variant="bogus"></ce-radio-group>`);
    const el = host.querySelector("ce-radio-group") as CeRadioGroup;
    el.options = SAMPLE;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".opt-classic")).not.toBeNull();
    host.remove();
  });

  it("disabled (group level) blocks clicks", async () => {
    const host = mount(`<ce-radio-group disabled></ce-radio-group>`);
    const el = host.querySelector("ce-radio-group") as CeRadioGroup;
    el.options = SAMPLE;
    await ready(el);
    const buttons = el.shadowRoot!.querySelectorAll<HTMLButtonElement>("[role='radio']");
    buttons[1].click();
    expect(el.value).toBe("");
    host.remove();
  });

  it("roving tabindex: only the current option is tabindex=0", async () => {
    const host = mount(`<ce-radio-group value="b"></ce-radio-group>`);
    const el = host.querySelector("ce-radio-group") as CeRadioGroup;
    el.options = SAMPLE;
    await ready(el);
    const buttons = el.shadowRoot!.querySelectorAll<HTMLButtonElement>("[role='radio']");
    expect(buttons[0].getAttribute("tabindex")).toBe("-1");
    expect(buttons[1].getAttribute("tabindex")).toBe("0");
    expect(buttons[2].getAttribute("tabindex")).toBe("-1");
    host.remove();
  });
});
