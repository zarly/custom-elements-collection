import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeField } from "./field.js";

beforeAll(() => {
  defineOnce("ce-field", CeField);
});

function mount(htmlStr: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = htmlStr;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeField).updateComplete;
}

describe("<ce-field>", () => {
  // ── 1. Upgrade and render ───────────────────────────────────────────────

  it("upgrades and renders a shadow root", async () => {
    const host = mount(`<ce-field label="Name"><input name="name" /></ce-field>`);
    const field = host.querySelector("ce-field")!;
    await ready(field);
    expect(field.shadowRoot).not.toBeNull();
    host.remove();
  });

  // ── 2. Label attribute rendered as <label> element ─────────────────────

  it("renders the label attribute as a <label> element in shadow DOM", async () => {
    const host = mount(`<ce-field label="Email"><input name="email" /></ce-field>`);
    const field = host.querySelector("ce-field")!;
    await ready(field);
    const labelEl = field.shadowRoot!.querySelector("label");
    expect(labelEl).not.toBeNull();
    expect(labelEl!.textContent).toContain("Email");
    host.remove();
  });

  // ── 3. Auto-generates control id; label[for] matches ───────────────────

  it("auto-generates a control id when the slotted control lacks one and label[for] matches", async () => {
    const host = mount(
      `<ce-field label="Username"><input name="username" /></ce-field>`
    );
    const field = host.querySelector("ce-field")!;
    await ready(field);

    const input = host.querySelector("input")!;
    // The input should now have a generated id.
    expect(input.id).not.toBe("");
    expect(input.id).toMatch(/^ce-field-\d+-control$/);

    // The label[for] must point to that same id.
    const labelEl = field.shadowRoot!.querySelector("label")!;
    expect(labelEl.getAttribute("for")).toBe(input.id);
    host.remove();
  });

  it("does NOT overwrite an existing id on the control", async () => {
    const host = mount(
      `<ce-field label="Pincode"><input id="my-pin" name="pin" /></ce-field>`
    );
    const field = host.querySelector("ce-field")!;
    await ready(field);
    const input = host.querySelector("input")!;
    expect(input.id).toBe("my-pin");
    host.remove();
  });

  // ── 4. help → aria-describedby ─────────────────────────────────────────

  it("sets aria-describedby on the control to the help element id when help is set", async () => {
    const host = mount(
      `<ce-field label="Email" help="We never share it">` +
        `<input name="email" />` +
      `</ce-field>`
    );
    const field = host.querySelector("ce-field")!;
    await ready(field);

    const input = host.querySelector("input")!;
    const describedBy = input.getAttribute("aria-describedby") ?? "";
    expect(describedBy).not.toBe("");

    // The id must exist in the shadow DOM.
    const helpEl = field.shadowRoot!.querySelector(`#${describedBy}`);
    expect(helpEl).not.toBeNull();
    expect(helpEl!.textContent).toContain("We never share it");
    host.remove();
  });

  // ── 5. error → aria-invalid + aria-describedby includes error id ───────

  it("sets aria-invalid=true and aria-describedby includes error id when error is set", async () => {
    const host = mount(
      `<ce-field label="Password" error="At least 8 characters required">` +
        `<input name="password" type="password" />` +
      `</ce-field>`
    );
    const field = host.querySelector("ce-field")!;
    await ready(field);

    const input = host.querySelector("input")!;
    expect(input.getAttribute("aria-invalid")).toBe("true");

    const describedBy = input.getAttribute("aria-describedby") ?? "";
    expect(describedBy).not.toBe("");

    const errorEl = field.shadowRoot!.querySelector(`[role="alert"]`);
    expect(errorEl).not.toBeNull();
    expect(errorEl!.textContent).toContain("At least 8 characters required");
    // The aria-describedby must reference the error element's id.
    expect(describedBy).toContain(errorEl!.id);
    host.remove();
  });

  it("updates aria-invalid reactively when error attr is set after upgrade", async () => {
    const host = mount(
      `<ce-field label="Email"><input name="email" /></ce-field>`
    );
    const field = host.querySelector("ce-field") as CeField;
    await ready(field);

    const input = host.querySelector("input")!;
    expect(input.getAttribute("aria-invalid")).toBeNull();

    field.error = "Invalid email";
    await ready(field);

    expect(input.getAttribute("aria-invalid")).toBe("true");
    host.remove();
  });

  // ── 6. required reflects to the control ────────────────────────────────

  it("sets required on a native input when the required attr is present", async () => {
    const host = mount(
      `<ce-field label="Email" required><input name="email" /></ce-field>`
    );
    const field = host.querySelector("ce-field")!;
    await ready(field);

    const input = host.querySelector("input") as HTMLInputElement;
    expect(input.required).toBe(true);
    host.remove();
  });

  it("sets aria-required=true on a non-native control when required is set", async () => {
    const host = mount(
      `<ce-field label="Color" required>` +
        // Use a custom-element-like div (no 'required' IDL property)
        `<div role="combobox" tabindex="0"></div>` +
      `</ce-field>`
    );
    const field = host.querySelector("ce-field")!;
    await ready(field);

    const ctrl = host.querySelector("div[role=combobox]")!;
    expect(ctrl.getAttribute("aria-required")).toBe("true");
    host.remove();
  });

  it("renders an asterisk in the label when required is set", async () => {
    const host = mount(`<ce-field label="Name" required><input name="n" /></ce-field>`);
    const field = host.querySelector("ce-field")!;
    await ready(field);
    const labelEl = field.shadowRoot!.querySelector("label")!;
    expect(labelEl.textContent).toContain("*");
    host.remove();
  });

  // ── 7. Slot overrides for label / help / error ─────────────────────────

  it("renders rich content from slot=label instead of label attr", async () => {
    const host = mount(
      `<ce-field>` +
        `<span slot="label">Custom <strong>label</strong></span>` +
        `<input name="x" />` +
      `</ce-field>`
    );
    const field = host.querySelector("ce-field")!;
    await ready(field);

    // Shadow DOM label element must exist (because slot="label" content is present).
    const labelEl = field.shadowRoot!.querySelector("label");
    expect(labelEl).not.toBeNull();
    // The slotted element is in light DOM, not in the shadow label textContent directly,
    // but the label wrapper must be rendered.
    const slotEl = field.shadowRoot!.querySelector("slot[name='label']");
    expect(slotEl).not.toBeNull();
    host.remove();
  });

  it("renders slot=help content in the help region", async () => {
    const host = mount(
      `<ce-field label="Bio">` +
        `<span slot="help">Max <code>200</code> characters.</span>` +
        `<input name="bio" />` +
      `</ce-field>`
    );
    const field = host.querySelector("ce-field")!;
    await ready(field);

    const helpRegion = field.shadowRoot!.querySelector(".ce-field__help");
    expect(helpRegion).not.toBeNull();
    // The help slot must be present.
    const helpSlot = field.shadowRoot!.querySelector("slot[name='help']");
    expect(helpSlot).not.toBeNull();
    host.remove();
  });

  it("renders slot=error content in the error region", async () => {
    const host = mount(
      `<ce-field label="Code">` +
        `<span slot="error">Invalid code, <a href="#">try again</a>.</span>` +
        `<input name="code" />` +
      `</ce-field>`
    );
    const field = host.querySelector("ce-field")!;
    await ready(field);

    const errorRegion = field.shadowRoot!.querySelector(".ce-field__error");
    expect(errorRegion).not.toBeNull();

    // Control must get aria-invalid because slot="error" is present.
    const input = host.querySelector("input")!;
    expect(input.getAttribute("aria-invalid")).toBe("true");
    host.remove();
  });

  // ── 8. Zero-attribute usage (CDR-007) ──────────────────────────────────

  it("renders with no attributes and only a slotted control without errors", async () => {
    const host = mount(`<ce-field><input name="bare" /></ce-field>`);
    const field = host.querySelector("ce-field")!;
    await ready(field);
    // No label in shadow DOM.
    expect(field.shadowRoot!.querySelector("label")).toBeNull();
    // No help or error regions.
    expect(field.shadowRoot!.querySelector(".ce-field__help")).toBeNull();
    expect(field.shadowRoot!.querySelector(".ce-field__error")).toBeNull();
    host.remove();
  });

  // ── 9. for attr as explicit override ───────────────────────────────────

  it("uses explicit for attr to find the control by id within the field", async () => {
    const host = mount(
      `<ce-field label="City" for="city-input">` +
        `<input id="city-input" name="city" />` +
      `</ce-field>`
    );
    const field = host.querySelector("ce-field")!;
    await ready(field);

    const labelEl = field.shadowRoot!.querySelector("label")!;
    expect(labelEl.getAttribute("for")).toBe("city-input");
    // The input id must remain unchanged.
    const input = host.querySelector("input")!;
    expect(input.id).toBe("city-input");
    host.remove();
  });
});
