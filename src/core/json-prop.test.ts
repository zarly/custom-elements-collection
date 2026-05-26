import { describe, it, expect, beforeAll } from "vitest";
import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { defineOnce } from "./register.js";
import { jsonProp } from "./json-prop.js";

class TestBed extends LitElement {
  @property(jsonProp<Array<{ label: string; value: number }>>([]))
  rows: Array<{ label: string; value: number }> = [];

  @property(jsonProp<{ name: string } | null>(null, "config"))
  config: { name: string } | null = null;

  override render() {
    return html`<span data-count=${this.rows.length}></span>`;
  }
}

beforeAll(() => defineOnce("test-json-prop", TestBed));

describe("jsonProp()", () => {
  it("parses a JSON array from an attribute", async () => {
    const el = document.createElement("test-json-prop") as TestBed;
    el.setAttribute("rows", JSON.stringify([{ label: "A", value: 1 }]));
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.rows).toEqual([{ label: "A", value: 1 }]);
    el.remove();
  });

  it("parses a JSON object from a custom attribute name", async () => {
    const el = document.createElement("test-json-prop") as TestBed;
    el.setAttribute("config", JSON.stringify({ name: "alpha" }));
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.config).toEqual({ name: "alpha" });
    el.remove();
  });

  it("falls back on malformed JSON", async () => {
    const el = document.createElement("test-json-prop") as TestBed;
    el.setAttribute("rows", "not json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.rows).toEqual([]);
    el.remove();
  });

  it("uses fallback when the attribute is empty", async () => {
    const el = document.createElement("test-json-prop") as TestBed;
    el.setAttribute("rows", "");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.rows).toEqual([]);
    el.remove();
  });

  it("still accepts direct JS property assignment", async () => {
    const el = document.createElement("test-json-prop") as TestBed;
    document.body.appendChild(el);
    el.rows = [{ label: "B", value: 2 }];
    await el.updateComplete;
    expect(el.rows).toEqual([{ label: "B", value: 2 }]);
    el.remove();
  });
});
