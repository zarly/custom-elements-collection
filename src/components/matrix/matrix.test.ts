import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeMatrix } from "./matrix.js";

beforeAll(() => {
  defineOnce("ce-matrix", CeMatrix);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeMatrix).updateComplete;
}

describe("<ce-matrix>", () => {
  it("renders four quadrant cells", async () => {
    const host = mount(`<ce-matrix></ce-matrix>`);
    const m = host.querySelector("ce-matrix") as CeMatrix;
    await ready(m);
    const quads = m.shadowRoot!.querySelectorAll(".quadrant");
    expect(quads.length).toBe(4);
    host.remove();
  });

  it("renders the default quadrant labels", async () => {
    const host = mount(`<ce-matrix></ce-matrix>`);
    const m = host.querySelector("ce-matrix") as CeMatrix;
    await ready(m);
    const headers = Array.from(m.shadowRoot!.querySelectorAll(".q-head > span:first-child")).map(
      (s) => s.textContent,
    );
    expect(headers).toEqual(["Quick wins", "Big bets", "Fill-ins", "Money pits"]);
    host.remove();
  });

  it("uses custom q-labels when provided", async () => {
    const host = mount(
      `<ce-matrix q-labels='["Do","Decide","Delegate","Delete"]'></ce-matrix>`,
    );
    const m = host.querySelector("ce-matrix") as CeMatrix;
    await ready(m);
    const headers = Array.from(m.shadowRoot!.querySelectorAll(".q-head > span:first-child")).map(
      (s) => s.textContent,
    );
    expect(headers).toEqual(["Do", "Decide", "Delegate", "Delete"]);
    host.remove();
  });

  it("places JSON items into the correct quadrant", async () => {
    const host = mount(
      `<ce-matrix items='[
        {"label":"Ship A","quadrant":0},
        {"label":"Plan B","quadrant":1},
        {"label":"Drop C","quadrant":3}
      ]'></ce-matrix>`,
    );
    const m = host.querySelector("ce-matrix") as CeMatrix;
    await ready(m);
    const q0 = m.shadowRoot!.querySelector('[data-q="0"] li')!;
    const q1 = m.shadowRoot!.querySelector('[data-q="1"] li')!;
    const q3 = m.shadowRoot!.querySelector('[data-q="3"] li')!;
    expect(q0.textContent).toContain("Ship A");
    expect(q1.textContent).toContain("Plan B");
    expect(q3.textContent).toContain("Drop C");
    expect(m.shadowRoot!.querySelector('[data-q="2"] li')).toBeNull();
    host.remove();
  });

  it("renders the hint when supplied on a JSON item", async () => {
    const host = mount(
      `<ce-matrix items='[{"label":"Ship","quadrant":0,"hint":"Done by Friday"}]'></ce-matrix>`,
    );
    const m = host.querySelector("ce-matrix") as CeMatrix;
    await ready(m);
    expect(m.shadowRoot!.querySelector(".hint")!.textContent).toBe("Done by Friday");
    host.remove();
  });

  it("renders axis labels using x-label / y-label attributes", async () => {
    const host = mount(
      `<ce-matrix x-label="Cost" y-label="Reach" x-low="Cheap" x-high="Pricey" y-low="Niche" y-high="Mass"></ce-matrix>`,
    );
    const m = host.querySelector("ce-matrix") as CeMatrix;
    await ready(m);
    expect(m.shadowRoot!.querySelector(".x-axis")!.textContent).toContain("Cost");
    expect(m.shadowRoot!.querySelector(".x-axis")!.textContent).toContain("Cheap");
    expect(m.shadowRoot!.querySelector(".y-axis")!.textContent).toContain("Reach");
    host.remove();
  });

  it("falls back to slot-mode children with data-quadrant routing (CDR-005)", async () => {
    const host = mount(`
      <ce-matrix>
        <div data-quadrant="0">slotted in q0</div>
        <div data-quadrant="2">slotted in q2</div>
      </ce-matrix>
    `);
    const m = host.querySelector("ce-matrix") as CeMatrix;
    await ready(m);
    await ready(m);
    const slotNames = Array.from(m.shadowRoot!.querySelectorAll("slot")).map((s) =>
      s.getAttribute("name"),
    );
    expect(slotNames).toContain("q0");
    expect(slotNames).toContain("q2");
    // child was tagged with slot=q0
    const child0 = host.querySelector('[data-quadrant="0"]')!;
    expect(child0.getAttribute("slot")).toBe("q0");
    host.remove();
  });
});
