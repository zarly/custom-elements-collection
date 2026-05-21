import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeBreadcrumbs } from "./breadcrumbs.js";

beforeAll(() => {
  defineOnce("ce-breadcrumbs", CeBreadcrumbs);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeBreadcrumbs).updateComplete;
}

describe("<ce-breadcrumbs>", () => {
  it("renders a nav landmark labelled Breadcrumb", async () => {
    const host = mount(
      `<ce-breadcrumbs items='[{"label":"Home","href":"/"},{"label":"Docs"}]'></ce-breadcrumbs>`,
    );
    const bc = host.querySelector("ce-breadcrumbs") as CeBreadcrumbs;
    await ready(bc);
    const nav = bc.shadowRoot!.querySelector("nav[aria-label='Breadcrumb']");
    expect(nav).not.toBeNull();
    host.remove();
  });

  it("renders intermediate items as anchors and last item as current", async () => {
    const host = mount(
      `<ce-breadcrumbs items='[
        {"label":"Home","href":"/"},
        {"label":"Docs","href":"/docs"},
        {"label":"Components"}
      ]'></ce-breadcrumbs>`,
    );
    const bc = host.querySelector("ce-breadcrumbs") as CeBreadcrumbs;
    await ready(bc);
    const anchors = bc.shadowRoot!.querySelectorAll("a");
    expect(anchors.length).toBe(2);
    expect(anchors[0].getAttribute("href")).toBe("/");
    const current = bc.shadowRoot!.querySelector(".current[aria-current='page']")!;
    expect(current.textContent).toContain("Components");
    host.remove();
  });

  it("renders a non-href intermediate item as plain text (not as anchor)", async () => {
    const host = mount(
      `<ce-breadcrumbs items='[
        {"label":"Home","href":"/"},
        {"label":"Section"},
        {"label":"Page"}
      ]'></ce-breadcrumbs>`,
    );
    const bc = host.querySelector("ce-breadcrumbs") as CeBreadcrumbs;
    await ready(bc);
    const anchors = bc.shadowRoot!.querySelectorAll("a");
    expect(anchors.length).toBe(1);
    host.remove();
  });

  it("inserts the separator glyph between crumbs but not after the last", async () => {
    const host = mount(
      `<ce-breadcrumbs separator="›" items='[
        {"label":"a","href":"/a"},
        {"label":"b","href":"/b"},
        {"label":"c"}
      ]'></ce-breadcrumbs>`,
    );
    const bc = host.querySelector("ce-breadcrumbs") as CeBreadcrumbs;
    await ready(bc);
    const seps = bc.shadowRoot!.querySelectorAll(".sep");
    expect(seps.length).toBe(2);
    expect(seps[0].textContent).toBe("›");
    host.remove();
  });

  it("falls back to slotted children when items is empty (CDR-005 slot mode)", async () => {
    const host = mount(`
      <ce-breadcrumbs>
        <a href="/">Home</a>
        <a href="/docs">Docs</a>
        <span>Components</span>
      </ce-breadcrumbs>
    `);
    const bc = host.querySelector("ce-breadcrumbs") as CeBreadcrumbs;
    await ready(bc);
    await ready(bc);
    // After slotchange assigns named slots, we get a slot per crumb plus separators between
    const namedSlots = bc.shadowRoot!.querySelectorAll("slot[name]");
    expect(namedSlots.length).toBeGreaterThanOrEqual(3);
    const seps = bc.shadowRoot!.querySelectorAll(".sep");
    expect(seps.length).toBe(2);
    host.remove();
  });

  it("sets aria-current=page on the last JSON item", async () => {
    const host = mount(
      `<ce-breadcrumbs items='[{"label":"Home","href":"/"},{"label":"Now"}]'></ce-breadcrumbs>`,
    );
    const bc = host.querySelector("ce-breadcrumbs") as CeBreadcrumbs;
    await ready(bc);
    const cur = bc.shadowRoot!.querySelector("[aria-current='page']")!;
    expect(cur.textContent).toContain("Now");
    host.remove();
  });

  it("sets host aria-label=Breadcrumb by default", async () => {
    const host = mount(`<ce-breadcrumbs items='[{"label":"Home"}]'></ce-breadcrumbs>`);
    const bc = host.querySelector("ce-breadcrumbs") as CeBreadcrumbs;
    await ready(bc);
    expect(bc.getAttribute("aria-label")).toBe("Breadcrumb");
    host.remove();
  });
});
