import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeChecklist } from "./checklist.js";
import { CeCheckItem } from "../check-item/check-item.js";

beforeAll(() => {
  defineOnce("ce-checklist", CeChecklist);
  defineOnce("ce-check-item", CeCheckItem);
});

beforeEach(() => {
  localStorage.clear();
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeChecklist).updateComplete;
}

// ─── Regression: existing JSON path ──────────────────────────────────────────

describe("<ce-checklist> — JSON items path (regression)", () => {
  it("renders items as list rows", async () => {
    const host = mount(
      `<ce-checklist items='[{"id":"a","text":"alpha"},{"id":"b","text":"beta"}]'></ce-checklist>`
    );
    const el = host.querySelector("ce-checklist") as CeChecklist;
    await ready(el);
    expect(el.shadowRoot!.querySelectorAll("li").length).toBe(2);
    host.remove();
  });

  it("checked items get .done class", async () => {
    const host = mount(
      `<ce-checklist items='[{"id":"a","text":"alpha","checked":true}]'></ce-checklist>`
    );
    const el = host.querySelector("ce-checklist") as CeChecklist;
    await ready(el);
    expect(el.shadowRoot!.querySelector("li")!.classList.contains("done")).toBe(true);
    host.remove();
  });

  it("emits ce-check-change on toggle when persistKey is set", async () => {
    const host = mount(
      `<ce-checklist persist-key="reg-toggle" items='[{"id":"a","text":"alpha"}]'></ce-checklist>`
    );
    const el = host.querySelector("ce-checklist") as CeChecklist;
    await ready(el);
    let detail: { id: string; checked: boolean } | null = null;
    el.addEventListener("ce-check-change", (e) => {
      detail = (e as CustomEvent).detail;
    });
    const cb = el.shadowRoot!.querySelector("input[type=checkbox]") as HTMLInputElement;
    cb.click();
    await ready(el);
    expect(detail).toEqual({ id: "a", checked: true });
    expect(el.items[0].checked).toBe(true);
    host.remove();
  });

  it("allow-edit shows add row", async () => {
    const host = mount(`<ce-checklist allow-edit items="[]"></ce-checklist>`);
    const el = host.querySelector("ce-checklist") as CeChecklist;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".add")).not.toBeNull();
    host.remove();
  });

  it("persist-key restores from localStorage", async () => {
    localStorage.setItem(
      "ce-checklist:my-list",
      JSON.stringify([{ id: "x", text: "restored", checked: true }])
    );
    const host = mount(`<ce-checklist persist-key="my-list"></ce-checklist>`);
    const el = host.querySelector("ce-checklist") as CeChecklist;
    await ready(el);
    expect(el.items.length).toBe(1);
    expect(el.items[0].text).toBe("restored");
    host.remove();
  });

  it("persist-key writes on toggle", async () => {
    const host = mount(
      `<ce-checklist persist-key="save-me" items='[{"id":"a","text":"alpha"}]'></ce-checklist>`
    );
    const el = host.querySelector("ce-checklist") as CeChecklist;
    await ready(el);
    const cb = el.shadowRoot!.querySelector("input[type=checkbox]") as HTMLInputElement;
    cb.click();
    await ready(el);
    const saved = JSON.parse(localStorage.getItem("ce-checklist:save-me")!);
    expect(saved[0].checked).toBe(true);
    host.remove();
  });

  it("emits ce-checklist-add when adding", async () => {
    const host = mount(`<ce-checklist allow-edit items="[]"></ce-checklist>`);
    const el = host.querySelector("ce-checklist") as CeChecklist;
    await ready(el);
    let detail: { id: string; text: string } | null = null;
    el.addEventListener("ce-checklist-add", (e) => {
      detail = (e as CustomEvent).detail;
    });
    const input = el.shadowRoot!.querySelector(".add input") as HTMLInputElement;
    input.value = "new task";
    input.dispatchEvent(new Event("input"));
    await ready(el);
    const btn = el.shadowRoot!.querySelector(".add button") as HTMLButtonElement;
    btn.click();
    await ready(el);
    expect(detail!.text).toBe("new task");
    expect(el.items.length).toBe(1);
    host.remove();
  });
});

// ─── New: slot children path ──────────────────────────────────────────────────

describe("<ce-checklist> — slot children path (CDR-005)", () => {
  it("renders ce-check-item children as list rows", async () => {
    const host = mount(`
      <ce-checklist>
        <ce-check-item id="s1">Alpha</ce-check-item>
        <ce-check-item id="s2">Beta</ce-check-item>
      </ce-checklist>
    `);
    const el = host.querySelector("ce-checklist") as CeChecklist;
    await ready(el);
    expect(el.shadowRoot!.querySelectorAll("li").length).toBe(2);
    host.remove();
  });

  it("JSON items prop takes priority over slot children (CDR-005 resolution order)", async () => {
    const host = mount(`
      <ce-checklist items='[{"id":"j1","text":"JSON item"}]'>
        <ce-check-item id="slot1">Slot item</ce-check-item>
      </ce-checklist>
    `);
    const el = host.querySelector("ce-checklist") as CeChecklist;
    await ready(el);
    // Should show only the JSON item
    const lis = el.shadowRoot!.querySelectorAll("li");
    expect(lis.length).toBe(1);
    // The text of the first li should contain "JSON item", not "Slot item"
    expect(lis[0].textContent).toContain("JSON item");
    host.remove();
  });

  it("snapshot parity: JSON and slot modes produce identical li count for equivalent data", async () => {
    const jsonHost = mount(
      `<ce-checklist items='[{"id":"a","text":"TLS 1.3","checked":true},{"id":"b","text":"SAML SSO"}]'></ce-checklist>`
    );
    const jsonEl = jsonHost.querySelector("ce-checklist") as CeChecklist;
    await ready(jsonEl);
    const jsonLis = jsonEl.shadowRoot!.querySelectorAll("li");

    const slotHost = mount(`
      <ce-checklist>
        <ce-check-item id="a" checked>TLS 1.3</ce-check-item>
        <ce-check-item id="b">SAML SSO</ce-check-item>
      </ce-checklist>
    `);
    const slotEl = slotHost.querySelector("ce-checklist") as CeChecklist;
    await ready(slotEl);
    const slotLis = slotEl.shadowRoot!.querySelectorAll("li");

    // Same number of rows
    expect(slotLis.length).toBe(jsonLis.length);
    // First item checked in both
    expect(jsonLis[0].classList.contains("done")).toBe(true);
    expect(slotLis[0].classList.contains("done")).toBe(true);
    // Second item not checked in both
    expect(jsonLis[1].classList.contains("done")).toBe(false);
    expect(slotLis[1].classList.contains("done")).toBe(false);

    jsonHost.remove();
    slotHost.remove();
  });

  it("rich content in ce-check-item slot is read by checklist", async () => {
    const host = mount(`
      <ce-checklist>
        <ce-check-item id="rich1">TLS 1.3 <a href="#42">#42</a></ce-check-item>
      </ce-checklist>
    `);
    const el = host.querySelector("ce-checklist") as CeChecklist;
    await ready(el);
    const li = el.shadowRoot!.querySelector("li");
    expect(li).not.toBeNull();
    // text span should contain the HTML
    const textSpan = li!.querySelector(".text");
    expect(textSpan).not.toBeNull();
    host.remove();
  });
});

// ─── New: group-by="category" ─────────────────────────────────────────────────

describe("<ce-checklist> — group-by=\"category\"", () => {
  it("renders category headers for each group", async () => {
    const host = mount(`
      <ce-checklist group-by="category">
        <ce-check-item id="g1" category="Security">TLS 1.3</ce-check-item>
        <ce-check-item id="g2" category="Security">SAML SSO</ce-check-item>
        <ce-check-item id="g3" category="Onboarding">Complete profile</ce-check-item>
      </ce-checklist>
    `);
    const el = host.querySelector("ce-checklist") as CeChecklist;
    await ready(el);
    const headers = el.shadowRoot!.querySelectorAll(".group-header");
    expect(headers.length).toBe(2);
    const headerTexts = Array.from(headers).map((h) => h.textContent?.trim());
    expect(headerTexts).toContain("Security");
    expect(headerTexts).toContain("Onboarding");
    host.remove();
  });

  it("items without category fall into a default group (no header)", async () => {
    const host = mount(`
      <ce-checklist group-by="category">
        <ce-check-item id="nc1">No category item</ce-check-item>
        <ce-check-item id="c1" category="Security">Secure item</ce-check-item>
      </ce-checklist>
    `);
    const el = host.querySelector("ce-checklist") as CeChecklist;
    await ready(el);
    // One header for "Security", none for the default group
    const headers = el.shadowRoot!.querySelectorAll(".group-header");
    expect(headers.length).toBe(1);
    expect(headers[0].textContent?.trim()).toBe("Security");
    host.remove();
  });

  it("group-by with JSON items prop also renders headers", async () => {
    const host = mount(
      `<ce-checklist group-by="category" items='[{"id":"x","text":"Item X","category":"Alpha"},{"id":"y","text":"Item Y","category":"Beta"}]'></ce-checklist>`
    );
    const el = host.querySelector("ce-checklist") as CeChecklist;
    await ready(el);
    const headers = el.shadowRoot!.querySelectorAll(".group-header");
    expect(headers.length).toBe(2);
    host.remove();
  });
});

// ─── New: static mode — no localStorage writes ────────────────────────────────

describe("<ce-checklist> — static mode (no persistKey, no allowEdit)", () => {
  it("does NOT write to localStorage when toggling in static mode", async () => {
    const spy = vi.spyOn(Storage.prototype, "setItem");
    const host = mount(
      `<ce-checklist items='[{"id":"a","text":"alpha"}]'></ce-checklist>`
    );
    const el = host.querySelector("ce-checklist") as CeChecklist;
    await ready(el);
    // In static mode, checkbox should be disabled — clicking should not persist
    const cb = el.shadowRoot!.querySelector("input[type=checkbox]") as HTMLInputElement;
    expect(cb.disabled).toBe(true);
    cb.click();
    await ready(el);
    // localStorage.setItem should NOT have been called
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    host.remove();
  });

  it("does NOT emit ce-check-change in static mode", async () => {
    const host = mount(
      `<ce-checklist items='[{"id":"a","text":"alpha"}]'></ce-checklist>`
    );
    const el = host.querySelector("ce-checklist") as CeChecklist;
    await ready(el);
    let fired = false;
    el.addEventListener("ce-check-change", () => { fired = true; });
    const cb = el.shadowRoot!.querySelector("input[type=checkbox]") as HTMLInputElement;
    // Checkbox is disabled in static mode — click does nothing
    cb.click();
    await ready(el);
    expect(fired).toBe(false);
    host.remove();
  });
});
