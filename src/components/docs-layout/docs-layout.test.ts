import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeDocsLayout } from "./docs-layout.js";

beforeAll(() => defineOnce("ce-docs-layout", CeDocsLayout));

describe("<ce-docs-layout>", () => {
  it("renders header, sidebar, and main slots", async () => {
    const el = document.createElement("ce-docs-layout") as CeDocsLayout;
    el.innerHTML = `
      <div slot="header">HEAD</div>
      <div slot="sidebar">SIDE</div>
      <div>MAIN</div>
    `;
    document.body.appendChild(el);
    await el.updateComplete;
    const slots = el.shadowRoot!.querySelectorAll("slot");
    const names = Array.from(slots).map((s) => s.getAttribute("name") ?? "");
    expect(names.sort()).toEqual(["", "header", "sidebar"]);
    el.remove();
  });

  it("applies the sidebar-width attribute to the grid", async () => {
    const el = document.createElement("ce-docs-layout") as CeDocsLayout;
    el.sidebarWidth = "320px";
    document.body.appendChild(el);
    await el.updateComplete;
    const grid = el.shadowRoot!.querySelector(".ce-docs") as HTMLElement;
    expect(grid.style.getPropertyValue("--_sidebar-w")).toBe("320px");
    el.remove();
  });

  it("reflects sidebar-width attribute", async () => {
    const el = document.createElement("ce-docs-layout") as CeDocsLayout;
    el.setAttribute("sidebar-width", "200px");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.sidebarWidth).toBe("200px");
    el.remove();
  });
});
