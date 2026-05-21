import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeDivider } from "./divider.js";

beforeAll(() => {
  defineOnce("ce-divider", CeDivider);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeDivider).updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await (el as CeDivider).updateComplete;
}

describe("<ce-divider>", () => {
  it("renders two line segments by default", async () => {
    const host = mount(`<ce-divider></ce-divider>`);
    const el = host.querySelector("ce-divider") as CeDivider;
    await ready(el);
    const lines = el.shadowRoot!.querySelectorAll(".ce-divider__line");
    expect(lines.length).toBe(2);
    host.remove();
  });

  it("sets role=separator", async () => {
    const host = mount(`<ce-divider></ce-divider>`);
    const el = host.querySelector("ce-divider") as CeDivider;
    await ready(el);
    expect(el.getAttribute("role")).toBe("separator");
    host.remove();
  });

  it("reflects orientation attribute", async () => {
    const host = mount(`<ce-divider orientation="vertical"></ce-divider>`);
    const el = host.querySelector("ce-divider") as CeDivider;
    await ready(el);
    expect(el.getAttribute("orientation")).toBe("vertical");
    host.remove();
  });

  it("reflects inset attribute", async () => {
    const host = mount(`<ce-divider inset="md"></ce-divider>`);
    const el = host.querySelector("ce-divider") as CeDivider;
    await ready(el);
    expect(el.getAttribute("inset")).toBe("md");
    host.remove();
  });

  it("includes a label slot with slotted content", async () => {
    const host = mount(`<ce-divider>OR</ce-divider>`);
    const el = host.querySelector("ce-divider") as CeDivider;
    await ready(el);
    const slot = el.shadowRoot!.querySelector("slot")!;
    const assigned = slot.assignedNodes({ flatten: true });
    const text = assigned.map((n) => n.textContent ?? "").join("").trim();
    expect(text).toBe("OR");
    host.remove();
  });

  it("hides the label container when slot is empty", async () => {
    const host = mount(`<ce-divider></ce-divider>`);
    const el = host.querySelector("ce-divider") as CeDivider;
    await ready(el);
    const row = el.shadowRoot!.querySelector(".ce-divider__row")!;
    expect(row.classList.contains("is-empty")).toBe(true);
    host.remove();
  });
});
