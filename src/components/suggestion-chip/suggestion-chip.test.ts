import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeSuggestionChip } from "./suggestion-chip.js";

beforeAll(() => {
  defineOnce("ce-suggestion-chip", CeSuggestionChip);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeSuggestionChip).updateComplete;
}

describe("<ce-suggestion-chip>", () => {
  // Test 1 — upgrades, shadow root, default slot
  it("upgrades and renders a shadow root with a default slot", async () => {
    const host = mount(`<ce-suggestion-chip>Explain more</ce-suggestion-chip>`);
    const chip = host.querySelector("ce-suggestion-chip")!;
    await ready(chip);
    expect(chip.shadowRoot).not.toBeNull();
    const slots = Array.from(chip.shadowRoot!.querySelectorAll("slot"));
    const names = slots.map((s) => s.getAttribute("name") ?? "default");
    expect(names).toContain("default");
    host.remove();
  });

  // Test 2 — role=button and tabindex=0 after upgrade
  it("sets role=button and tabindex=0 on the host after upgrade", async () => {
    const host = mount(`<ce-suggestion-chip>Give an example</ce-suggestion-chip>`);
    const chip = host.querySelector("ce-suggestion-chip")!;
    await ready(chip);
    expect(chip.getAttribute("role")).toBe("button");
    expect(chip.getAttribute("tabindex")).toBe("0");
    host.remove();
  });

  // Test 3 — click emits event with value attribute
  it("emits ce-suggestion-select with detail.value from the value attribute on click", async () => {
    const host = mount(
      `<ce-suggestion-chip value="explain">Explain more</ce-suggestion-chip>`
    );
    const chip = host.querySelector("ce-suggestion-chip")!;
    await ready(chip);
    let detail: { value: string } | null = null;
    chip.addEventListener("ce-suggestion-select", (e) => {
      detail = (e as CustomEvent).detail;
    });
    chip.click();
    expect(detail).not.toBeNull();
    expect(detail!.value).toBe("explain");
    host.remove();
  });

  // Test 4 — empty value falls back to textContent
  it("falls back to trimmed textContent when value attribute is empty", async () => {
    const host = mount(`<ce-suggestion-chip>  Give an example  </ce-suggestion-chip>`);
    const chip = host.querySelector("ce-suggestion-chip")!;
    await ready(chip);
    let detail: { value: string } | null = null;
    chip.addEventListener("ce-suggestion-select", (e) => {
      detail = (e as CustomEvent).detail;
    });
    chip.click();
    expect(detail).not.toBeNull();
    expect(detail!.value).toBe("Give an example");
    host.remove();
  });

  // Test 5 — Enter and Space keys emit the event
  it("emits ce-suggestion-select on Enter key", async () => {
    const host = mount(`<ce-suggestion-chip value="more">More</ce-suggestion-chip>`);
    const chip = host.querySelector("ce-suggestion-chip")!;
    await ready(chip);
    let count = 0;
    chip.addEventListener("ce-suggestion-select", () => count++);
    chip.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(count).toBe(1);
    host.remove();
  });

  it("emits ce-suggestion-select on Space key", async () => {
    const host = mount(`<ce-suggestion-chip value="more">More</ce-suggestion-chip>`);
    const chip = host.querySelector("ce-suggestion-chip")!;
    await ready(chip);
    let count = 0;
    chip.addEventListener("ce-suggestion-select", () => count++);
    chip.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(count).toBe(1);
    host.remove();
  });

  // Test 6 — disabled blocks emit and sets aria-disabled
  it("does NOT emit when disabled and sets aria-disabled=true", async () => {
    const host = mount(
      `<ce-suggestion-chip disabled value="explain">Explain more</ce-suggestion-chip>`
    );
    const chip = host.querySelector("ce-suggestion-chip") as CeSuggestionChip;
    await ready(chip);
    let count = 0;
    chip.addEventListener("ce-suggestion-select", () => count++);
    // pointer-events:none means click() still fires in jsdom — test the guard directly
    chip.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(count).toBe(0);
    expect(chip.getAttribute("aria-disabled")).toBe("true");
    host.remove();
  });

  // Test 7 — selected attribute reflects
  it("reflects the selected attribute to the property and back", async () => {
    const host = mount(`<ce-suggestion-chip selected>Chosen</ce-suggestion-chip>`);
    const chip = host.querySelector("ce-suggestion-chip") as CeSuggestionChip;
    await ready(chip);
    expect(chip.selected).toBe(true);
    expect(chip.hasAttribute("selected")).toBe(true);

    chip.selected = false;
    await ready(chip);
    expect(chip.hasAttribute("selected")).toBe(false);
    host.remove();
  });

  // Test 8 — icon attribute renders before slot; named icon slot overrides it
  it("renders icon attribute content before the label slot", async () => {
    const host = mount(
      `<ce-suggestion-chip icon="💡">Tip</ce-suggestion-chip>`
    );
    const chip = host.querySelector("ce-suggestion-chip") as CeSuggestionChip;
    await ready(chip);
    const iconSpan = chip.shadowRoot!.querySelector(".ce-sc__icon");
    expect(iconSpan).not.toBeNull();
    expect(iconSpan!.textContent).toContain("💡");
    host.remove();
  });

  it("icon slot overrides the icon attribute", async () => {
    const host = mount(
      `<ce-suggestion-chip icon="💡">
        <span slot="icon" aria-hidden="true" data-custom-icon>★</span>
        Custom icon chip
      </ce-suggestion-chip>`
    );
    const chip = host.querySelector("ce-suggestion-chip") as CeSuggestionChip;
    await ready(chip);
    const iconSlot = chip.shadowRoot!.querySelector(
      "slot[name='icon']"
    ) as HTMLSlotElement;
    expect(iconSlot).not.toBeNull();
    const slotted = iconSlot.assignedElements();
    expect(slotted.length).toBe(1);
    expect(slotted[0].getAttribute("data-custom-icon")).not.toBeNull();
    host.remove();
  });
});
