import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { defineOnce } from "../core/index.js";
import { CeTable } from "./table.js";

beforeAll(() => defineOnce("ce-table", CeTable));

afterEach(() => {
  document.head.querySelector("#ce-table-ambient-css")?.remove();
  document.body.innerHTML = "";
});

describe("<ce-table>", () => {
  it("wraps a slotted <table> in a scroll container", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-table><table><tr><td>x</td></tr></table></ce-table>`;
    document.body.appendChild(host);
    const t = host.querySelector("ce-table") as CeTable;
    await t.updateComplete;
    expect(t.shadowRoot!.querySelector(".ce-table__scroll")).not.toBeNull();
    host.remove();
  });

  it("reflects sticky and compact attributes", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-table sticky compact><table></table></ce-table>`;
    document.body.appendChild(host);
    const t = host.querySelector("ce-table") as CeTable;
    await t.updateComplete;
    expect(t.hasAttribute("sticky")).toBe(true);
    expect(t.hasAttribute("compact")).toBe(true);
    host.remove();
  });

  it("marks the inner table with data-ce-table-styled", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-table><table id="inner"><tr><td>x</td></tr></table></ce-table>`;
    document.body.appendChild(host);
    const t = host.querySelector("ce-table") as CeTable;
    await t.updateComplete;
    // wait one rAF tick
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    const inner = host.querySelector("#inner")!;
    expect(inner.hasAttribute("data-ce-table-styled")).toBe(true);
    host.remove();
  });

  it("injects the ambient stylesheet only once per document", async () => {
    const host = document.createElement("div");
    host.innerHTML = `
      <ce-table><table><tr><td>1</td></tr></table></ce-table>
      <ce-table><table><tr><td>2</td></tr></table></ce-table>
    `;
    document.body.appendChild(host);
    const tables = host.querySelectorAll("ce-table");
    await (tables[0] as CeTable).updateComplete;
    await (tables[1] as CeTable).updateComplete;
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    const styles = document.head.querySelectorAll("#ce-table-ambient-css");
    expect(styles.length).toBe(1);
    host.remove();
  });
});
