import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeData } from "./data.js";

beforeAll(() => defineOnce("ce-data", CeData));

function mount(html: string): CeData {
  const wrap = document.createElement("div");
  wrap.innerHTML = html;
  const el = wrap.firstElementChild as CeData;
  document.body.appendChild(el);
  return el;
}

describe("<ce-data>", () => {
  it("parses a JSON object from text content", async () => {
    const el = mount(`<ce-data>{"values":[1,2,3]}</ce-data>`);
    await el.updateComplete;
    expect(el.data).toEqual({ values: [1, 2, 3] });
    el.remove();
  });

  it("parses a JSON array from text content", async () => {
    const el = mount(`<ce-data>[10,20,30,40]</ce-data>`);
    await el.updateComplete;
    expect(el.data).toEqual([10, 20, 30, 40]);
    el.remove();
  });

  it("returns null for empty text content", async () => {
    const el = mount(`<ce-data></ce-data>`);
    await el.updateComplete;
    expect(el.data).toBeNull();
    el.remove();
  });

  it("returns null on invalid JSON", async () => {
    const el = mount(`<ce-data>not json</ce-data>`);
    await el.updateComplete;
    expect(el.data).toBeNull();
    el.remove();
  });

  it("is visually hidden", async () => {
    const el = mount(`<ce-data>{"x":1}</ce-data>`);
    await el.updateComplete;
    expect(el.style.display).toBe("none");
    el.remove();
  });

  it("renders into light DOM (no shadow root)", async () => {
    const el = mount(`<ce-data>{"x":1}</ce-data>`);
    await el.updateComplete;
    expect(el.shadowRoot).toBeNull();
    el.remove();
  });

  it("re-parses on data access after text content changes", async () => {
    const el = mount(`<ce-data>[1,2]</ce-data>`);
    await el.updateComplete;
    expect(el.data).toEqual([1, 2]);
    el.textContent = "[5,6,7]";
    expect(el.data).toEqual([5, 6, 7]);
    el.remove();
  });
});
