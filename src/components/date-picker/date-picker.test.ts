import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeDatePicker } from "./date-picker.js";

beforeAll(() => {
  defineOnce("ce-date-picker", CeDatePicker);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeDatePicker).updateComplete;
}

describe("<ce-date-picker>", () => {
  it("upgrades and renders a native <input type=date> by default", async () => {
    const host = mount(`<ce-date-picker label="When" name="due"></ce-date-picker>`);
    const dp = host.querySelector("ce-date-picker") as CeDatePicker;
    await ready(dp);
    const input = dp.shadowRoot!.querySelector("input")!;
    expect(input.type).toBe("date");
    expect(input.name).toBe("due");
    host.remove();
  });

  it("respects the type attribute (time / datetime-local / month / week)", async () => {
    const host = mount(`
      <ce-date-picker type="time"></ce-date-picker>
      <ce-date-picker type="datetime-local"></ce-date-picker>
      <ce-date-picker type="month"></ce-date-picker>
      <ce-date-picker type="week"></ce-date-picker>
    `);
    const els = host.querySelectorAll<CeDatePicker>("ce-date-picker");
    for (const el of els) await ready(el);
    expect(els[0].shadowRoot!.querySelector("input")!.type).toBe("time");
    expect(els[1].shadowRoot!.querySelector("input")!.type).toBe("datetime-local");
    expect(els[2].shadowRoot!.querySelector("input")!.type).toBe("month");
    expect(els[3].shadowRoot!.querySelector("input")!.type).toBe("week");
    host.remove();
  });

  it("forwards min, max, step to the native input", async () => {
    const host = mount(
      `<ce-date-picker min="2026-01-01" max="2026-12-31" step="7"></ce-date-picker>`,
    );
    const dp = host.querySelector("ce-date-picker") as CeDatePicker;
    await ready(dp);
    const input = dp.shadowRoot!.querySelector("input")!;
    expect(input.min).toBe("2026-01-01");
    expect(input.max).toBe("2026-12-31");
    expect(input.step).toBe("7");
    host.remove();
  });

  it("emits ce-change with name + value on commit", async () => {
    const host = mount(`<ce-date-picker name="due" value="2026-05-20"></ce-date-picker>`);
    const dp = host.querySelector("ce-date-picker") as CeDatePicker;
    await ready(dp);
    let detail: { name: string; value: string } | null = null;
    dp.addEventListener("ce-change", (e) => {
      detail = (e as CustomEvent<{ name: string; value: string }>).detail;
    });
    const input = dp.shadowRoot!.querySelector("input")!;
    input.value = "2026-06-01";
    input.dispatchEvent(new Event("change"));
    expect(detail).not.toBeNull();
    expect(detail!.name).toBe("due");
    expect(detail!.value).toBe("2026-06-01");
    host.remove();
  });

  it("emits ce-input on input", async () => {
    const host = mount(`<ce-date-picker name="due"></ce-date-picker>`);
    const dp = host.querySelector("ce-date-picker") as CeDatePicker;
    await ready(dp);
    let detail: { value: string } | null = null;
    dp.addEventListener("ce-input", (e) => {
      detail = (e as CustomEvent<{ value: string }>).detail;
    });
    const input = dp.shadowRoot!.querySelector("input")!;
    input.value = "2026-06-15";
    input.dispatchEvent(new Event("input"));
    expect(detail).not.toBeNull();
    expect(detail!.value).toBe("2026-06-15");
    host.remove();
  });

  it("renders error region overriding help when error is set", async () => {
    const host = mount(
      `<ce-date-picker label="Start" help="When the run starts." error="Required."></ce-date-picker>`,
    );
    const dp = host.querySelector("ce-date-picker") as CeDatePicker;
    await ready(dp);
    expect(dp.shadowRoot!.querySelector(".err")!.textContent).toContain("Required.");
    expect(dp.shadowRoot!.querySelector(".help")).toBeNull();
    host.remove();
  });

  it("reflects invalid and disabled attributes", async () => {
    const host = mount(`<ce-date-picker invalid disabled></ce-date-picker>`);
    const dp = host.querySelector("ce-date-picker") as CeDatePicker;
    await ready(dp);
    expect(dp.hasAttribute("invalid")).toBe(true);
    expect(dp.hasAttribute("disabled")).toBe(true);
    expect(dp.shadowRoot!.querySelector("input")!.disabled).toBe(true);
    host.remove();
  });
});
