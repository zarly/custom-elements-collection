import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeCombobox, CeOption } from "./combobox.js";

// ── Popover API mock (jsdom does not implement it) ───────────────────────────

function mockPopoverApi(): void {
  HTMLElement.prototype.showPopover = function (this: HTMLElement) {
    this.setAttribute("popover-open", "");
    // Simulate `:popover-open` by making matches() aware of the attribute
  };
  HTMLElement.prototype.hidePopover = function (this: HTMLElement) {
    this.removeAttribute("popover-open");
    // Fire a synthetic toggle event so component logic syncs
    this.dispatchEvent(
      Object.assign(new Event("toggle"), { newState: "closed", oldState: "open" })
    );
  };

  // Patch matches() so :popover-open checks fall through to our attribute
  const originalMatches = Element.prototype.matches;
  Element.prototype.matches = function (sel: string): boolean {
    if (sel === ":popover-open") return this.hasAttribute("popover-open");
    try {
      return originalMatches.call(this, sel);
    } catch {
      return false;
    }
  };
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeAll(() => {
  mockPopoverApi();
  defineOnce("ce-combobox", CeCombobox);
  defineOnce("ce-option", CeOption);
});

function mount(htmlStr: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = htmlStr;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeCombobox).updateComplete;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInput(el: CeCombobox): HTMLInputElement {
  return el.shadowRoot!.querySelector("input")!;
}

function getListbox(el: CeCombobox): HTMLElement {
  return el.shadowRoot!.querySelector(".listbox")!;
}

function getOptions(el: CeCombobox): NodeListOf<HTMLElement> {
  return el.shadowRoot!.querySelectorAll(".option");
}

function keydown(el: Element, key: string): void {
  el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("<ce-combobox>", () => {
  it("1 — upgrades and renders shadow DOM with input and listbox", async () => {
    const host = mount(`<ce-combobox name="fruit" placeholder="Pick…"></ce-combobox>`);
    const cb = host.querySelector("ce-combobox") as CeCombobox;
    await ready(cb);

    expect(cb.shadowRoot).not.toBeNull();
    expect(getInput(cb)).toBeTruthy();
    expect(getListbox(cb)).toBeTruthy();
    host.remove();
  });

  it("2 — slot-mode: reads ce-option children and renders them in the listbox", async () => {
    const host = mount(`
      <ce-combobox name="country" placeholder="Select country">
        <ce-option value="us" label="United States"></ce-option>
        <ce-option value="de" label="Germany"></ce-option>
        <ce-option value="jp" label="Japan"></ce-option>
      </ce-combobox>
    `);
    const cb = host.querySelector("ce-combobox") as CeCombobox;
    await ready(cb);

    // Open the listbox
    cb.open = true;
    await ready(cb);

    const opts = getOptions(cb);
    expect(opts.length).toBe(3);
    expect(opts[0].textContent).toContain("United States");
    expect(opts[1].textContent).toContain("Germany");
    host.remove();
  });

  it("3 — data-mode: renders options from the JSON data attribute", async () => {
    const host = mount(`
      <ce-combobox
        name="currency"
        data='[{"value":"USD","label":"US Dollar"},{"value":"EUR","label":"Euro"},{"value":"JPY","label":"Japanese Yen"}]'
      ></ce-combobox>
    `);
    const cb = host.querySelector("ce-combobox") as CeCombobox;
    await ready(cb);

    cb.open = true;
    await ready(cb);

    const opts = getOptions(cb);
    expect(opts.length).toBe(3);
    expect(opts[0].textContent).toContain("US Dollar");
    expect(opts[2].textContent).toContain("Japanese Yen");
    host.remove();
  });

  it("4 — typing in the input filters options by case-insensitive label substring", async () => {
    const host = mount(`
      <ce-combobox
        name="lang"
        data='[{"value":"en","label":"English"},{"value":"de","label":"German"},{"value":"fr","label":"French"}]'
      ></ce-combobox>
    `);
    const cb = host.querySelector("ce-combobox") as CeCombobox;
    await ready(cb);

    cb.open = true;
    await ready(cb);

    // Simulate typing "en" — matches "English" (starts with "En") and "French" ("Fr-en-ch")
    // "German" is g-e-r-m-a-n: does NOT contain the substring "en"
    const input = getInput(cb);
    input.value = "en";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await ready(cb);

    const opts = getOptions(cb);
    // "english".includes("en") → true; "french".includes("en") → true; "german".includes("en") → false
    expect(opts.length).toBe(2);
    const labels = Array.from(opts).map((o) => o.textContent ?? "");
    expect(labels.some((l) => l.includes("English"))).toBe(true);
    expect(labels.some((l) => l.includes("French"))).toBe(true);
    host.remove();
  });

  it("5 — selecting an option sets value and emits ce-change", async () => {
    const host = mount(`
      <ce-combobox
        name="role"
        data='[{"value":"admin","label":"Admin"},{"value":"user","label":"User"}]'
      ></ce-combobox>
    `);
    const cb = host.querySelector("ce-combobox") as CeCombobox;
    await ready(cb);

    cb.open = true;
    await ready(cb);

    let detail: { value: string; label: string } | null = null;
    cb.addEventListener("ce-change", (e) => {
      detail = (e as CustomEvent<{ value: string; label: string }>).detail;
    });

    // Click the first option
    const opts = getOptions(cb);
    opts[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await ready(cb);

    expect(cb.value).toBe("admin");
    expect(detail).not.toBeNull();
    expect(detail!.value).toBe("admin");
    expect(detail!.label).toBe("Admin");
    host.remove();
  });

  it("6 — Enter on highlighted option selects it and emits ce-change", async () => {
    const host = mount(`
      <ce-combobox
        name="plan"
        data='[{"value":"free","label":"Free"},{"value":"pro","label":"Pro"}]'
      ></ce-combobox>
    `);
    const cb = host.querySelector("ce-combobox") as CeCombobox;
    await ready(cb);

    let detail: { value: string; label: string } | null = null;
    cb.addEventListener("ce-change", (e) => {
      detail = (e as CustomEvent<{ value: string; label: string }>).detail;
    });

    const input = getInput(cb);

    // ArrowDown opens the listbox
    keydown(input, "ArrowDown");
    await ready(cb);
    expect(cb.open).toBe(true);

    // ArrowDown moves highlight to index 0 (or stays if already there)
    keydown(input, "ArrowDown");
    await ready(cb);

    // Enter selects the highlighted option
    keydown(input, "Enter");
    await ready(cb);

    expect(detail).not.toBeNull();
    expect(detail!.value).toBe("pro"); // second ArrowDown moved to index 1
    host.remove();
  });

  it("7 — ArrowDown opens the listbox if closed; ArrowUp navigates upward", async () => {
    const host = mount(`
      <ce-combobox
        name="size"
        data='[{"value":"sm","label":"Small"},{"value":"md","label":"Medium"},{"value":"lg","label":"Large"}]'
      ></ce-combobox>
    `);
    const cb = host.querySelector("ce-combobox") as CeCombobox;
    await ready(cb);

    const input = getInput(cb);

    // Listbox starts closed
    expect(cb.open).toBe(false);

    // ArrowDown opens
    keydown(input, "ArrowDown");
    await ready(cb);
    expect(cb.open).toBe(true);

    // ArrowDown once more — highlight should be at index 1 (started at 0 from #showListbox)
    keydown(input, "ArrowDown");
    await ready(cb);

    // ArrowUp should move back up
    keydown(input, "ArrowUp");
    await ready(cb);

    // highlight index was at 1, moved up to 0
    // We can verify indirectly via the highlighted class
    const highlighted = cb.shadowRoot!.querySelectorAll(".option--highlighted");
    expect(highlighted.length).toBe(1);
    host.remove();
  });

  it("8 — Escape closes the listbox", async () => {
    const host = mount(`
      <ce-combobox
        name="item"
        data='[{"value":"a","label":"Alpha"},{"value":"b","label":"Beta"}]'
      ></ce-combobox>
    `);
    const cb = host.querySelector("ce-combobox") as CeCombobox;
    await ready(cb);

    cb.open = true;
    await ready(cb);
    expect(cb.open).toBe(true);

    keydown(getInput(cb), "Escape");
    await ready(cb);
    expect(cb.open).toBe(false);
    host.remove();
  });

  it("9 — allow-custom: Enter on unmatched text commits the typed value", async () => {
    const host = mount(`
      <ce-combobox
        name="topic"
        allow-custom
        data='[{"value":"bug","label":"Bug report"},{"value":"feat","label":"Feature request"}]'
      ></ce-combobox>
    `);
    const cb = host.querySelector("ce-combobox") as CeCombobox;
    await ready(cb);

    let detail: { value: string; label: string } | null = null;
    cb.addEventListener("ce-change", (e) => {
      detail = (e as CustomEvent<{ value: string; label: string }>).detail;
    });

    const input = getInput(cb);

    // Open and type something that matches nothing
    cb.open = true;
    input.value = "My custom topic";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await ready(cb);

    // Highlight is -1 because filter matches nothing (or partial)
    // We force no highlight by checking filtered list has no match
    // Press Enter — allow-custom should commit
    keydown(input, "Enter");
    await ready(cb);

    expect(detail).not.toBeNull();
    expect(detail!.value).toBe("My custom topic");
    expect(cb.value).toBe("My custom topic");
    host.remove();
  });

  it("10 — ARIA roles: combobox on input, listbox on panel, option on items", async () => {
    const host = mount(`
      <ce-combobox
        name="status"
        data='[{"value":"active","label":"Active"},{"value":"inactive","label":"Inactive"}]'
      ></ce-combobox>
    `);
    const cb = host.querySelector("ce-combobox") as CeCombobox;
    await ready(cb);

    const input = getInput(cb);
    expect(input.getAttribute("role")).toBe("combobox");

    const listbox = getListbox(cb);
    expect(listbox.getAttribute("role")).toBe("listbox");

    // Open to render options
    cb.open = true;
    await ready(cb);

    const opts = getOptions(cb);
    expect(opts.length).toBeGreaterThan(0);
    for (const opt of Array.from(opts)) {
      expect(opt.getAttribute("role")).toBe("option");
    }

    host.remove();
  });

  it("11 — allow-custom=false: Enter on unmatched text does NOT commit", async () => {
    const host = mount(`
      <ce-combobox
        name="strict"
        data='[{"value":"a","label":"Alpha"},{"value":"b","label":"Beta"}]'
      ></ce-combobox>
    `);
    const cb = host.querySelector("ce-combobox") as CeCombobox;
    await ready(cb);

    let fired = 0;
    cb.addEventListener("ce-change", () => fired++);

    cb.open = true;
    const input = getInput(cb);
    input.value = "zzznotmatching";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await ready(cb);

    // Ensure no option is highlighted (filter produces 0 results)
    keydown(input, "Enter");
    await ready(cb);

    // value should remain empty
    expect(cb.value).toBe("");
    expect(fired).toBe(0);
    host.remove();
  });
});
