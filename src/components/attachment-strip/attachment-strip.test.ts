import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeAttachmentStrip, type CeAttachment } from "./attachment-strip.js";

beforeAll(() => {
  defineOnce("ce-attachment-strip", CeAttachmentStrip);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeAttachmentStrip).updateComplete;
}

describe("<ce-attachment-strip>", () => {
  // 1 — Upgrade and shadow root
  it("upgrades and renders a shadow root", async () => {
    const host = mount(`<ce-attachment-strip></ce-attachment-strip>`);
    const el = host.querySelector("ce-attachment-strip") as CeAttachmentStrip;
    await ready(el);
    expect(el.shadowRoot).not.toBeNull();
    host.remove();
  });

  // 2 — JS property assignment renders one tile per item with name visible
  it("renders one tile per item when items are set via property", async () => {
    const items: CeAttachment[] = [
      { id: "a", name: "design.png", kind: "image" },
      { id: "b", name: "notes.pdf", kind: "file" },
    ];
    const host = mount(`<ce-attachment-strip></ce-attachment-strip>`);
    const el = host.querySelector("ce-attachment-strip") as CeAttachmentStrip;
    el.items = items;
    await ready(el);
    const tiles = el.shadowRoot!.querySelectorAll(".ce-tile");
    expect(tiles).toHaveLength(2);
    const names = Array.from(tiles).map(
      (t) => t.querySelector(".ce-tile-name")!.textContent!.trim()
    );
    expect(names).toContain("design.png");
    expect(names).toContain("notes.pdf");
    host.remove();
  });

  // 3 — JSON-on-attribute renders one tile
  it("renders one tile when items set via JSON attribute", async () => {
    const host = mount(
      `<ce-attachment-strip items='[{"id":"a","name":"x.png"}]'></ce-attachment-strip>`
    );
    const el = host.querySelector("ce-attachment-strip") as CeAttachmentStrip;
    await ready(el);
    const tiles = el.shadowRoot!.querySelectorAll(".ce-tile");
    expect(tiles).toHaveLength(1);
    expect(
      tiles[0].querySelector(".ce-tile-name")!.textContent!.trim()
    ).toBe("x.png");
    host.remove();
  });

  // 4 — Remove button emits ce-attachment-remove with correct id
  it("emits ce-attachment-remove with detail.id when remove button clicked", async () => {
    const items: CeAttachment[] = [
      { id: "img-1", name: "photo.jpg", kind: "image" },
    ];
    const host = mount(`<ce-attachment-strip></ce-attachment-strip>`);
    const el = host.querySelector("ce-attachment-strip") as CeAttachmentStrip;
    el.items = items;
    await ready(el);

    let capturedDetail: { id: string } | null = null;
    el.addEventListener("ce-attachment-remove", (e) => {
      capturedDetail = (e as CustomEvent<{ id: string }>).detail;
    });

    const btn = el.shadowRoot!.querySelector(
      ".ce-tile-remove"
    ) as HTMLButtonElement;
    expect(btn).not.toBeNull();
    btn.click();

    expect(capturedDetail).not.toBeNull();
    expect(capturedDetail!.id).toBe("img-1");
    host.remove();
  });

  // 5 — removable=false hides remove buttons
  it("does not render remove buttons when removable=false", async () => {
    const host = mount(
      `<ce-attachment-strip removable="false" items='[{"id":"a","name":"x.pdf"}]'></ce-attachment-strip>`
    );
    const el = host.querySelector("ce-attachment-strip") as CeAttachmentStrip;
    await ready(el);
    const btns = el.shadowRoot!.querySelectorAll(".ce-tile-remove");
    expect(btns).toHaveLength(0);
    host.remove();
  });

  // 6 — Slot mode: when items is empty, a <slot> is in the shadow root and
  //     slotted children are accessible via assignedElements
  it("uses slot mode when items is empty and children are slotted", async () => {
    const host = mount(`
      <ce-attachment-strip>
        <div data-id="x">Custom tile</div>
        <div data-id="y">Another tile</div>
      </ce-attachment-strip>
    `);
    const el = host.querySelector("ce-attachment-strip") as CeAttachmentStrip;
    await ready(el);

    const slotEl = el.shadowRoot!.querySelector("slot");
    expect(slotEl).not.toBeNull();

    const assigned = (slotEl as HTMLSlotElement).assignedElements({
      flatten: true,
    });
    expect(assigned.length).toBe(2);
    host.remove();
  });

  // 7 — Size formatter: size 2048 shows "2.0 KB"
  it("displays formatted file size for a tile with size: 2048", async () => {
    const host = mount(`<ce-attachment-strip></ce-attachment-strip>`);
    const el = host.querySelector("ce-attachment-strip") as CeAttachmentStrip;
    el.items = [{ id: "f", name: "big.wav", kind: "audio", size: 2048 }];
    await ready(el);
    const sizeEl = el.shadowRoot!.querySelector(".ce-tile-size");
    expect(sizeEl).not.toBeNull();
    expect(sizeEl!.textContent!.trim()).toBe("2.0 KB");
    host.remove();
  });

  // 8a — kind "image" + thumb renders <img>; kind "file" without thumb renders SVG icon
  it("renders img for image kind with thumb, and SVG icon for file kind without thumb", async () => {
    const host = mount(`<ce-attachment-strip></ce-attachment-strip>`);
    const el = host.querySelector("ce-attachment-strip") as CeAttachmentStrip;
    el.items = [
      {
        id: "img",
        name: "photo.jpg",
        kind: "image",
        thumb: "https://placehold.co/96",
      },
      { id: "doc", name: "doc.pdf", kind: "file" },
    ];
    await ready(el);

    const tiles = el.shadowRoot!.querySelectorAll(".ce-tile");
    // First tile — image with thumb → <img>
    const imgEl = tiles[0].querySelector("img.ce-tile-thumb");
    expect(imgEl).not.toBeNull();
    expect((imgEl as HTMLImageElement).src).toContain("placehold.co");

    // Second tile — file without thumb → SVG icon (no img)
    expect(tiles[1].querySelector("img.ce-tile-thumb")).toBeNull();
    const iconDiv = tiles[1].querySelector(".ce-tile-icon");
    expect(iconDiv).not.toBeNull();
    expect(iconDiv!.querySelector("svg")).not.toBeNull();
    host.remove();
  });
});
