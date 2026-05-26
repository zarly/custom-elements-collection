import { describe, it, expect, beforeAll, vi, afterEach } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeSearch } from "./search.js";

beforeAll(() => {
  defineOnce("ce-search", CeSearch);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeSearch).updateComplete;
}

// ── 1. Upgrades and renders an internal input ─────────────────────────────

describe("<ce-search> — upgrade", () => {
  it("upgrades and renders a shadow root with an internal input", async () => {
    const host = mount(`<ce-search></ce-search>`);
    const el = host.querySelector("ce-search")!;
    await ready(el);

    expect(el.shadowRoot).not.toBeNull();
    const input = el.shadowRoot!.querySelector("input");
    expect(input).not.toBeNull();
    expect(input!.type).toBe("search");

    host.remove();
  });
});

// ── 2. value prop reflects to/from internal input ─────────────────────────

describe("<ce-search> — value", () => {
  it("reflects value attribute to internal input", async () => {
    const host = mount(`<ce-search value="hello"></ce-search>`);
    const el = host.querySelector("ce-search") as CeSearch;
    await ready(el);

    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    // Lit binds .value as property, not attribute
    expect(input.value).toBe("hello");

    host.remove();
  });

  it("updates internal input when value property is set programmatically", async () => {
    const host = mount(`<ce-search></ce-search>`);
    const el = host.querySelector("ce-search") as CeSearch;
    await ready(el);

    el.value = "world";
    await ready(el);

    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    expect(input.value).toBe("world");

    host.remove();
  });
});

// ── 3. placeholder reflects ───────────────────────────────────────────────

describe("<ce-search> — placeholder", () => {
  it("uses default placeholder 'Search' when not specified", async () => {
    const host = mount(`<ce-search></ce-search>`);
    const el = host.querySelector("ce-search") as CeSearch;
    await ready(el);

    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    expect(input.placeholder).toBe("Search");

    host.remove();
  });

  it("forwards custom placeholder to internal input", async () => {
    const host = mount(`<ce-search placeholder="Filter items"></ce-search>`);
    const el = host.querySelector("ce-search") as CeSearch;
    await ready(el);

    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    expect(input.placeholder).toBe("Filter items");

    host.remove();
  });
});

// ── 4. Clear button visibility ────────────────────────────────────────────

describe("<ce-search> — clear button", () => {
  it("clear button is hidden when value is empty", async () => {
    const host = mount(`<ce-search></ce-search>`);
    const el = host.querySelector("ce-search") as CeSearch;
    await ready(el);

    const btn = el.shadowRoot!.querySelector<HTMLButtonElement>(".clear");
    // Either absent (loading=true) or hidden
    if (btn) {
      expect(btn.hidden).toBe(true);
    } else {
      // If loading is shown instead — no clear button; that's also fine
      expect(el.shadowRoot!.querySelector(".spinner")).toBeNull();
    }

    host.remove();
  });

  it("clear button is visible when value is non-empty", async () => {
    const host = mount(`<ce-search value="abc"></ce-search>`);
    const el = host.querySelector("ce-search") as CeSearch;
    await ready(el);

    const btn = el.shadowRoot!.querySelector<HTMLButtonElement>(".clear");
    expect(btn).not.toBeNull();
    expect(btn!.hidden).toBe(false);

    host.remove();
  });

  it("clear button becomes visible after typing, hidden after clearing", async () => {
    const host = mount(`<ce-search></ce-search>`);
    const el = host.querySelector("ce-search") as CeSearch;
    await ready(el);

    el.value = "test";
    await ready(el);

    let btn = el.shadowRoot!.querySelector<HTMLButtonElement>(".clear")!;
    expect(btn.hidden).toBe(false);

    el.value = "";
    await ready(el);

    btn = el.shadowRoot!.querySelector<HTMLButtonElement>(".clear")!;
    expect(btn.hidden).toBe(true);

    host.remove();
  });
});

// ── 5. Clicking clear button clears value and emits ce-search ─────────────

describe("<ce-search> — clear action", () => {
  it("clicking clear button sets value to '' and emits ce-search with empty value", async () => {
    const host = mount(`<ce-search value="foo"></ce-search>`);
    const el = host.querySelector("ce-search") as CeSearch;
    await ready(el);

    const events: CustomEvent[] = [];
    el.addEventListener("ce-search", (e) => events.push(e as CustomEvent));

    const btn = el.shadowRoot!.querySelector<HTMLButtonElement>(".clear")!;
    expect(btn).not.toBeNull();
    btn.click();
    await ready(el);

    expect(el.value).toBe("");
    expect(events.length).toBe(1);
    expect(events[0].detail).toEqual({ value: "" });

    host.remove();
  });
});

// ── 6. Debounced ce-search event ──────────────────────────────────────────

describe("<ce-search> — debounced ce-search event", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires ce-search after the debounce delay", async () => {
    vi.useFakeTimers();

    const host = mount(`<ce-search debounce="200"></ce-search>`);
    const el = host.querySelector("ce-search") as CeSearch;
    await ready(el);

    const events: CustomEvent[] = [];
    el.addEventListener("ce-search", (e) => events.push(e as CustomEvent));

    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;

    // Simulate user typing.
    input.value = "q";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    // Before debounce elapses — no event yet.
    expect(events.length).toBe(0);

    // Advance past debounce window.
    vi.advanceTimersByTime(200);

    expect(events.length).toBe(1);
    expect(events[0].detail).toEqual({ value: "q" });

    host.remove();
  });

  it("debounce resets on rapid keystrokes — only fires once at the end", async () => {
    vi.useFakeTimers();

    const host = mount(`<ce-search debounce="200"></ce-search>`);
    const el = host.querySelector("ce-search") as CeSearch;
    await ready(el);

    const events: CustomEvent[] = [];
    el.addEventListener("ce-search", (e) => events.push(e as CustomEvent));

    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;

    // Type three characters in quick succession.
    for (const char of ["f", "fo", "foo"]) {
      input.value = char;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      vi.advanceTimersByTime(50);
    }

    expect(events.length).toBe(0); // still within debounce

    vi.advanceTimersByTime(200);

    expect(events.length).toBe(1);
    expect(events[0].detail).toEqual({ value: "foo" });

    host.remove();
  });
});

// ── 7. Enter key emits ce-submit ──────────────────────────────────────────

describe("<ce-search> — ce-submit on Enter", () => {
  it("Enter key dispatches ce-submit with current value", async () => {
    const host = mount(`<ce-search value="hello world"></ce-search>`);
    const el = host.querySelector("ce-search") as CeSearch;
    await ready(el);

    const submits: CustomEvent[] = [];
    el.addEventListener("ce-submit", (e) => submits.push(e as CustomEvent));

    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(submits.length).toBe(1);
    expect(submits[0].detail).toEqual({ value: "hello world" });

    host.remove();
  });

  it("Enter also fires ce-search immediately (bypasses debounce)", async () => {
    vi.useFakeTimers();

    const host = mount(`<ce-search debounce="500"></ce-search>`);
    const el = host.querySelector("ce-search") as CeSearch;
    await ready(el);

    const searches: CustomEvent[] = [];
    el.addEventListener("ce-search", (e) => searches.push(e as CustomEvent));

    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    input.value = "test";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    // Press Enter before debounce fires.
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    // ce-search should have fired synchronously on Enter.
    expect(searches.length).toBe(1);

    // No additional event after debounce window (timer was cancelled).
    vi.advanceTimersByTime(600);
    expect(searches.length).toBe(1);

    vi.useRealTimers();
    host.remove();
  });
});

// ── 8. Shortcut "/" focuses the internal input ────────────────────────────

describe("<ce-search> — shortcut", () => {
  it('shortcut="/" focuses internal input on "/" keydown from document', async () => {
    const host = mount(`<ce-search shortcut="/"></ce-search>`);
    const el = host.querySelector("ce-search") as CeSearch;
    await ready(el);

    // Ensure focus is not inside the component.
    (document.activeElement as HTMLElement | null)?.blur?.();

    let focused = false;
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    input.addEventListener("focus", () => { focused = true; });

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "/", bubbles: true }));

    expect(focused).toBe(true);

    host.remove();
  });

  it("shortcut does NOT fire when an INPUT is the active element", async () => {
    const host = mount(`<ce-search shortcut="/"></ce-search>`);
    const el = host.querySelector("ce-search") as CeSearch;
    await ready(el);

    // Add a plain input and focus it.
    const plain = document.createElement("input");
    document.body.appendChild(plain);
    plain.focus();

    let focused = false;
    const searchInput = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    searchInput.addEventListener("focus", () => { focused = true; });

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "/", bubbles: true }));

    expect(focused).toBe(false);

    plain.remove();
    host.remove();
  });
});

// ── 9. formAssociated flag ────────────────────────────────────────────────

describe("<ce-search> — form association", () => {
  it("declares static formAssociated = true", () => {
    expect((CeSearch as unknown as { formAssociated: boolean }).formAssociated).toBe(true);
  });
});

// ── 10. loading state hides clear button ──────────────────────────────────

describe("<ce-search> — loading state", () => {
  it("shows spinner and hides clear button when loading=true", async () => {
    const host = mount(`<ce-search value="x" loading></ce-search>`);
    const el = host.querySelector("ce-search") as CeSearch;
    await ready(el);

    expect(el.shadowRoot!.querySelector(".spinner")).not.toBeNull();
    expect(el.shadowRoot!.querySelector(".clear")).toBeNull();

    host.remove();
  });
});
