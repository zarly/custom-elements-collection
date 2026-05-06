import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeConfirm } from "./confirm.js";

beforeAll(() => {
  defineOnce("ce-confirm", CeConfirm);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeConfirm).updateComplete;
}

describe("<ce-confirm>", () => {
  it("renders prompt and two buttons", async () => {
    const host = mount(`<ce-confirm prompt="Delete?"></ce-confirm>`);
    const el = host.querySelector("ce-confirm") as CeConfirm;
    await ready(el);
    expect(el.shadowRoot!.querySelector(".prompt")!.textContent).toContain("Delete?");
    expect(el.shadowRoot!.querySelectorAll("button").length).toBe(2);
    host.remove();
  });

  it("emits ce-confirm when primary clicked", async () => {
    const host = mount(`<ce-confirm></ce-confirm>`);
    const el = host.querySelector("ce-confirm") as CeConfirm;
    await ready(el);
    let fired = 0;
    el.addEventListener("ce-confirm", () => fired++);
    (el.shadowRoot!.querySelector("button.primary") as HTMLButtonElement).click();
    expect(fired).toBe(1);
    host.remove();
  });

  it("emits ce-cancel when secondary clicked", async () => {
    const host = mount(`<ce-confirm></ce-confirm>`);
    const el = host.querySelector("ce-confirm") as CeConfirm;
    await ready(el);
    let fired = 0;
    el.addEventListener("ce-cancel", () => fired++);
    (el.shadowRoot!.querySelector("button.secondary") as HTMLButtonElement).click();
    expect(fired).toBe(1);
    host.remove();
  });

  it("respects custom labels", async () => {
    const host = mount(
      `<ce-confirm confirm-label="Delete" cancel-label="Keep"></ce-confirm>`
    );
    const el = host.querySelector("ce-confirm") as CeConfirm;
    await ready(el);
    expect(el.shadowRoot!.querySelector("button.primary")!.textContent?.trim()).toBe(
      "Delete"
    );
    expect(el.shadowRoot!.querySelector("button.secondary")!.textContent?.trim()).toBe(
      "Keep"
    );
    host.remove();
  });

  it("variant=danger reflects", async () => {
    const host = mount(`<ce-confirm variant="danger"></ce-confirm>`);
    const el = host.querySelector("ce-confirm") as CeConfirm;
    await ready(el);
    expect(el.getAttribute("variant")).toBe("danger");
    host.remove();
  });

  it("role=alertdialog with aria-label", async () => {
    const host = mount(`<ce-confirm prompt="Drop file?"></ce-confirm>`);
    const el = host.querySelector("ce-confirm") as CeConfirm;
    await ready(el);
    const dialog = el.shadowRoot!.querySelector("[role=alertdialog]")!;
    expect(dialog.getAttribute("aria-label")).toBe("Drop file?");
    host.remove();
  });

  it("prompt slot overrides attribute", async () => {
    const host = mount(
      `<ce-confirm prompt="ignored"><span slot="prompt">slotted</span></ce-confirm>`
    );
    const el = host.querySelector("ce-confirm") as CeConfirm;
    await ready(el);
    expect(el.textContent).toContain("slotted");
    host.remove();
  });
});
