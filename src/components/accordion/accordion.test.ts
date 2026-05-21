import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeAccordion } from "./accordion.js";

beforeAll(() => {
  defineOnce("ce-accordion", CeAccordion);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeAccordion).updateComplete;
}

describe("<ce-accordion>", () => {
  it("renders one disclosure row per JSON item", async () => {
    const host = mount(
      `<ce-accordion items='[
        {"summary":"A","body":"alpha"},
        {"summary":"B","body":"bravo"},
        {"summary":"C","body":"charlie"}
      ]'></ce-accordion>`,
    );
    const acc = host.querySelector("ce-accordion") as CeAccordion;
    await ready(acc);
    const details = acc.shadowRoot!.querySelectorAll("details");
    expect(details.length).toBe(3);
    expect(details[1].querySelector("summary")!.textContent).toContain("B");
    host.remove();
  });

  it("opens items that ship with open=true", async () => {
    const host = mount(
      `<ce-accordion items='[
        {"summary":"A","body":"a"},
        {"summary":"B","body":"b","open":true}
      ]'></ce-accordion>`,
    );
    const acc = host.querySelector("ce-accordion") as CeAccordion;
    await ready(acc);
    const details = acc.shadowRoot!.querySelectorAll("details");
    expect(details[0].open).toBe(false);
    expect(details[1].open).toBe(true);
    host.remove();
  });

  it("emits ce-accordion-change with openIds when an item toggles", async () => {
    const host = mount(
      `<ce-accordion items='[
        {"id":"a","summary":"A","body":"x"},
        {"id":"b","summary":"B","body":"y"}
      ]'></ce-accordion>`,
    );
    const acc = host.querySelector("ce-accordion") as CeAccordion;
    await ready(acc);
    let detail: { openIds: string[] } | null = null;
    acc.addEventListener("ce-accordion-change", (e) => {
      detail = (e as CustomEvent<{ openIds: string[] }>).detail;
    });
    const first = acc.shadowRoot!.querySelectorAll("details")[0];
    first.open = true;
    first.dispatchEvent(new Event("toggle"));
    expect(detail).not.toBeNull();
    expect(detail!.openIds).toContain("a");
    host.remove();
  });

  it("single mode keeps at most one item open", async () => {
    const host = mount(
      `<ce-accordion single items='[
        {"id":"a","summary":"A","body":"x","open":true},
        {"id":"b","summary":"B","body":"y"}
      ]'></ce-accordion>`,
    );
    const acc = host.querySelector("ce-accordion") as CeAccordion;
    await ready(acc);
    const ds = acc.shadowRoot!.querySelectorAll("details");
    // Open the second; first should close on next toggle
    ds[1].open = true;
    ds[1].dispatchEvent(new Event("toggle"));
    await ready(acc);
    // After toggle, the data model knows about both being requested but single
    // mode collapses to the most recent. Verify via the event payload.
    let detail: { openIds: string[] } | null = null;
    acc.addEventListener("ce-accordion-change", (e) => {
      detail = (e as CustomEvent<{ openIds: string[] }>).detail;
    });
    ds[0].open = true;
    ds[0].dispatchEvent(new Event("toggle"));
    expect(detail!.openIds.length).toBe(1);
    expect(detail!.openIds[0]).toBe("a");
    host.remove();
  });

  it("renders the count chip when count is set", async () => {
    const host = mount(
      `<ce-accordion items='[{"summary":"A","body":"x","count":7}]'></ce-accordion>`,
    );
    const acc = host.querySelector("ce-accordion") as CeAccordion;
    await ready(acc);
    expect(acc.shadowRoot!.querySelector(".count")!.textContent).toBe("7");
    host.remove();
  });

  it("falls back to slot mode when items is empty (CDR-005)", async () => {
    const host = mount(`
      <ce-accordion>
        <details><summary>Manual A</summary>alpha</details>
        <details><summary>Manual B</summary>bravo</details>
      </ce-accordion>
    `);
    const acc = host.querySelector("ce-accordion") as CeAccordion;
    await ready(acc);
    expect(acc.shadowRoot!.querySelector("slot")).not.toBeNull();
    // Children remain in light DOM
    expect(acc.children.length).toBe(2);
    host.remove();
  });

  it("closes an item when its toggle goes from open to closed", async () => {
    const host = mount(
      `<ce-accordion items='[{"id":"a","summary":"A","body":"x","open":true}]'></ce-accordion>`,
    );
    const acc = host.querySelector("ce-accordion") as CeAccordion;
    await ready(acc);
    let detail: { openIds: string[] } | null = null;
    acc.addEventListener("ce-accordion-change", (e) => {
      detail = (e as CustomEvent<{ openIds: string[] }>).detail;
    });
    const d = acc.shadowRoot!.querySelector("details")!;
    d.open = false;
    d.dispatchEvent(new Event("toggle"));
    expect(detail!.openIds.length).toBe(0);
    host.remove();
  });
});
