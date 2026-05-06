import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeCitation } from "./citation.js";

beforeAll(() => defineOnce("ce-citation", CeCitation));

describe("<ce-citation>", () => {
  it("upgrades and renders shadow root", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-citation index="1"></ce-citation>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-citation") as CeCitation;
    await el.updateComplete;
    expect(el.shadowRoot).not.toBeNull();
    host.remove();
  });

  it("renders [index] by default", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-citation index="3"></ce-citation>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-citation") as CeCitation;
    await el.updateComplete;
    const ref = el.shadowRoot!.querySelector(".ce-citation__ref")!;
    expect(ref.textContent).toContain("[");
    expect(ref.textContent).toContain("3");
    expect(ref.textContent).toContain("]");
    host.remove();
  });

  it("renders an <a> with role=doc-noteref when href is set", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-citation index="1" href="https://example.com/source"></ce-citation>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-citation") as CeCitation;
    await el.updateComplete;
    const a = el.shadowRoot!.querySelector("a.ce-citation__ref") as HTMLAnchorElement;
    expect(a).not.toBeNull();
    expect(a.getAttribute("href")).toBe("https://example.com/source");
    expect(a.getAttribute("role")).toBe("doc-noteref");
    host.remove();
  });

  it("renders a focusable span when no href is set", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-citation index="2"></ce-citation>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-citation") as CeCitation;
    await el.updateComplete;
    const span = el.shadowRoot!.querySelector("span.ce-citation__ref")!;
    expect(span.getAttribute("role")).toBe("doc-noteref");
    expect(span.getAttribute("tabindex")).toBe("0");
    host.remove();
  });

  it("popover slot has role=tooltip and is wired via aria-describedby", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-citation index="1" href="#x"><span slot="popover">Source preview</span></ce-citation>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-citation") as CeCitation;
    await el.updateComplete;
    const pop = el.shadowRoot!.querySelector(".ce-citation__pop")!;
    const ref = el.shadowRoot!.querySelector(".ce-citation__ref")!;
    expect(pop.getAttribute("role")).toBe("tooltip");
    expect(pop.id).toBeTruthy();
    expect(ref.getAttribute("aria-describedby")).toBe(pop.id);
    host.remove();
  });

  it("title attribute overrides the default [index] label", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-citation index="9" title="RFC 7231"></ce-citation>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-citation") as CeCitation;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-citation__ref")?.textContent).toContain(
      "RFC 7231"
    );
    host.remove();
  });

  it("uses default slot to override visible label", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-citation>custom</ce-citation>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-citation") as CeCitation;
    await el.updateComplete;
    expect(el.textContent).toContain("custom");
    host.remove();
  });

  it("renders both ref and popover slot wrappers", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-citation index="1"><span slot="popover">x</span></ce-citation>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-citation") as CeCitation;
    await el.updateComplete;
    const slots = Array.from(el.shadowRoot!.querySelectorAll("slot"));
    const names = slots.map((s) => s.getAttribute("name") ?? "default");
    expect(names).toContain("default");
    expect(names).toContain("popover");
    host.remove();
  });
});
