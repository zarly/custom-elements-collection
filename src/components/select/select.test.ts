import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeSelect } from "./select.js";

beforeAll(() => {
  defineOnce("ce-select", CeSelect);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeSelect).updateComplete;
}

describe("<ce-select>", () => {
  it("upgrades and renders a native <select> in shadow DOM", async () => {
    const host = mount(
      `<ce-select label="Plan" name="plan" options='[{"value":"free"},{"value":"pro"}]'></ce-select>`,
    );
    const sel = host.querySelector("ce-select") as CeSelect;
    await ready(sel);
    const native = sel.shadowRoot!.querySelector("select")!;
    expect(native).toBeTruthy();
    expect(native.options.length).toBe(2);
    expect(native.options[0].value).toBe("free");
    host.remove();
  });

  it("renders an inline placeholder option when provided", async () => {
    const host = mount(
      `<ce-select placeholder="Choose…" options='[{"value":"a"}]'></ce-select>`,
    );
    const sel = host.querySelector("ce-select") as CeSelect;
    await ready(sel);
    const native = sel.shadowRoot!.querySelector("select")!;
    expect(native.options.length).toBe(2);
    expect(native.options[0].textContent).toBe("Choose…");
    expect(native.options[0].disabled).toBe(true);
    host.remove();
  });

  it("emits ce-change with name + value on user change", async () => {
    const host = mount(
      `<ce-select name="plan" options='[{"value":"free"},{"value":"pro"}]'></ce-select>`,
    );
    const sel = host.querySelector("ce-select") as CeSelect;
    await ready(sel);
    let detail: { name: string; value: string } | null = null;
    sel.addEventListener("ce-change", (e) => {
      detail = (e as CustomEvent<{ name: string; value: string }>).detail;
    });
    const native = sel.shadowRoot!.querySelector("select")!;
    native.value = "pro";
    native.dispatchEvent(new Event("change"));
    expect(detail).not.toBeNull();
    expect(detail!.name).toBe("plan");
    expect(detail!.value).toBe("pro");
    host.remove();
  });

  it("reflects invalid + disabled attributes for styling hooks", async () => {
    const host = mount(`<ce-select invalid disabled></ce-select>`);
    const sel = host.querySelector("ce-select") as CeSelect;
    await ready(sel);
    expect(sel.hasAttribute("invalid")).toBe(true);
    expect(sel.hasAttribute("disabled")).toBe(true);
    expect(sel.shadowRoot!.querySelector("select")!.disabled).toBe(true);
    host.remove();
  });

  it("renders error region overriding help when error is set", async () => {
    const host = mount(
      `<ce-select label="Plan" help="Pick one." error="Required." options='[{"value":"a"}]'></ce-select>`,
    );
    const sel = host.querySelector("ce-select") as CeSelect;
    await ready(sel);
    const err = sel.shadowRoot!.querySelector(".err");
    const help = sel.shadowRoot!.querySelector(".help");
    expect(err?.textContent).toContain("Required.");
    expect(help).toBeNull();
    host.remove();
  });

  it("folds options sharing a group attribute under an <optgroup>", async () => {
    const host = mount(
      `<ce-select options='[
        {"value":"sm","group":"Hosted"},
        {"value":"md","group":"Hosted"},
        {"value":"oss"}
      ]'></ce-select>`,
    );
    const sel = host.querySelector("ce-select") as CeSelect;
    await ready(sel);
    const native = sel.shadowRoot!.querySelector("select")!;
    const group = native.querySelector("optgroup");
    expect(group).not.toBeNull();
    expect(group!.label).toBe("Hosted");
    expect(group!.children.length).toBe(2);
    host.remove();
  });

  it("accepts slotted <option> children when no options array is set (CDR-005)", async () => {
    const host = mount(`
      <ce-select>
        <option value="a">Apples</option>
        <option value="b">Bananas</option>
      </ce-select>
    `);
    const sel = host.querySelector("ce-select") as CeSelect;
    await ready(sel);
    await ready(sel);
    const native = sel.shadowRoot!.querySelector("select")!;
    expect(native.options.length).toBe(2);
    expect(native.options[1].textContent).toBe("Bananas");
    host.remove();
  });

  it("renders a label associated with the native select", async () => {
    const host = mount(
      `<ce-select label="Plan" options='[{"value":"a"}]'></ce-select>`,
    );
    const sel = host.querySelector("ce-select") as CeSelect;
    await ready(sel);
    const label = sel.shadowRoot!.querySelector("label")!;
    const native = sel.shadowRoot!.querySelector("select")!;
    expect(label.getAttribute("for")).toBe(native.id);
    host.remove();
  });
});
