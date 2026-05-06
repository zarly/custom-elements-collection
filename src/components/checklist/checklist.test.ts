import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeChecklist } from "./checklist.js";

beforeAll(() => {
  defineOnce("ce-checklist", CeChecklist);
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

describe("<ce-checklist>", () => {
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

  it("emits ce-check-change on toggle", async () => {
    const host = mount(
      `<ce-checklist items='[{"id":"a","text":"alpha"}]'></ce-checklist>`
    );
    const el = host.querySelector("ce-checklist") as CeChecklist;
    await ready(el);
    let detail: any = null;
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
    let detail: any = null;
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
    expect(detail.text).toBe("new task");
    expect(el.items.length).toBe(1);
    host.remove();
  });
});
