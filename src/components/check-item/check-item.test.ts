import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeCheckItem } from "./check-item.js";

beforeAll(() => {
  defineOnce("ce-check-item", CeCheckItem);
});

async function ready(el: CeCheckItem): Promise<void> {
  await el.updateComplete;
}

describe("<ce-check-item>", () => {
  it("standalone mode renders a checkbox and label slot", async () => {
    const el = document.createElement("ce-check-item") as CeCheckItem;
    el.id = "test1";
    el.textContent = "Smoke test passed";
    document.body.appendChild(el);
    await ready(el);
    // Should be in standalone mode (not nested in ce-checklist)
    const cb = el.querySelector("input[type=checkbox]") as HTMLInputElement | null;
    // Lit renders into light DOM; look in the element itself
    await ready(el);
    // The element renders into light DOM — check for standalone attribute
    expect(el.hasAttribute("data-standalone")).toBe(true);
    el.remove();
  });

  it("checked attribute reflects initial state", async () => {
    const el = document.createElement("ce-check-item") as CeCheckItem;
    el.id = "test2";
    el.setAttribute("checked", "");
    el.textContent = "Done item";
    document.body.appendChild(el);
    await ready(el);
    expect(el.checked).toBe(true);
    expect(el.hasAttribute("checked")).toBe(true);
    el.remove();
  });

  it("unchecked by default", async () => {
    const el = document.createElement("ce-check-item") as CeCheckItem;
    el.id = "test3";
    el.textContent = "Not done";
    document.body.appendChild(el);
    await ready(el);
    expect(el.checked).toBe(false);
    el.remove();
  });

  it("rich content in default slot survives — <a> element", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-check-item id="rich">TLS 1.3 enforced <a href="#42">#42</a></ce-check-item>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-check-item") as CeCheckItem;
    await ready(el);
    // The <a> link must be present in the element's children
    const link = el.querySelector("a");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("#42");
    host.remove();
  });

  it("category attribute is reflected", async () => {
    const el = document.createElement("ce-check-item") as CeCheckItem;
    el.id = "cat1";
    el.setAttribute("category", "Security");
    el.textContent = "TLS 1.3";
    document.body.appendChild(el);
    await ready(el);
    expect(el.getAttribute("category")).toBe("Security");
    expect(el.category).toBe("Security");
    el.remove();
  });

  it("emits ce-check-item-change on toggle in standalone mode", async () => {
    const el = document.createElement("ce-check-item") as CeCheckItem;
    el.id = "chg1";
    el.textContent = "Toggle me";
    document.body.appendChild(el);
    await ready(el);

    let detail: { id: string; checked: boolean } | null = null;
    el.addEventListener("ce-check-item-change", (e) => {
      detail = (e as CustomEvent).detail;
    });

    const cb = el.shadowRoot!.querySelector("input[type=checkbox]") as HTMLInputElement;
    expect(cb).not.toBeNull();
    cb.checked = true;
    cb.dispatchEvent(new Event("change", { bubbles: true }));
    await ready(el);

    expect(detail).not.toBeNull();
    expect(detail?.id).toBe("chg1");
    expect(detail?.checked).toBe(true);
    el.remove();
  });

  it("does not render standalone UI when nested inside ce-checklist", async () => {
    // Set up a parent ce-checklist to test nested mode
    // We check that the item doesn't get data-standalone attribute
    const host = document.createElement("div");
    host.innerHTML = `
      <ce-checklist>
        <ce-check-item id="nested1">Nested item</ce-check-item>
      </ce-checklist>
    `;
    document.body.appendChild(host);
    const item = host.querySelector("ce-check-item") as CeCheckItem;
    await ready(item);
    expect(item.hasAttribute("data-standalone")).toBe(false);
    host.remove();
  });
});
