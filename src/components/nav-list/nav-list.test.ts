import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeNavList } from "./nav-list.js";

beforeAll(() => defineOnce("ce-nav-list", CeNavList));

describe("<ce-nav-list>", () => {
  it("renders one anchor per item", async () => {
    const el = document.createElement("ce-nav-list") as CeNavList;
    el.items = [
      { label: "A", href: "#a" },
      { label: "B", href: "#b" },
      { label: "C", href: "#c" },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    const links = el.shadowRoot!.querySelectorAll("a");
    expect(links.length).toBe(3);
    el.remove();
  });

  it("groups items by the `group` field with headers", async () => {
    const el = document.createElement("ce-nav-list") as CeNavList;
    el.items = [
      { group: "UI", label: "hero", href: "#hero" },
      { group: "UI", label: "kpi", href: "#kpi" },
      { group: "Lesson", label: "quiz", href: "#quiz" },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    const groups = el.shadowRoot!.querySelectorAll(".ce-nav__group");
    const labels = Array.from(groups).map((g) => g.textContent?.trim());
    expect(labels).toEqual(["UI", "Lesson"]);
    el.remove();
  });

  it("marks the item matching `value` with aria-current=page", async () => {
    const el = document.createElement("ce-nav-list") as CeNavList;
    el.items = [
      { label: "A", href: "#a" },
      { label: "B", href: "#b" },
    ];
    el.value = "#b";
    document.body.appendChild(el);
    await el.updateComplete;
    const links = el.shadowRoot!.querySelectorAll("a");
    expect(links[0].getAttribute("aria-current")).toBe("false");
    expect(links[1].getAttribute("aria-current")).toBe("page");
    el.remove();
  });

  it("dispatches ce-nav-select with the clicked href", async () => {
    const el = document.createElement("ce-nav-list") as CeNavList;
    el.items = [{ label: "A", href: "#a" }];
    document.body.appendChild(el);
    await el.updateComplete;
    let detail: { href: string } | null = null;
    el.addEventListener("ce-nav-select", (e) => {
      detail = (e as CustomEvent).detail;
    });
    const link = el.shadowRoot!.querySelector("a")!;
    link.addEventListener("click", (e) => e.preventDefault());
    link.click();
    expect(detail).toEqual({ href: "#a" });
    el.remove();
  });

  it("parses items from a JSON attribute before append", async () => {
    const el = document.createElement("ce-nav-list") as CeNavList;
    const value = [
      { label: "A", href: "#a" },
      { label: "B", href: "#b" },
      { label: "C", href: "#c" },
    ];
    el.setAttribute("items", JSON.stringify(value));
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.items).toEqual(value);
    const links = el.shadowRoot!.querySelectorAll("a");
    expect(links.length).toBe(3);
    el.remove();
  });

  it("falls back to [] when items attribute is invalid JSON", async () => {
    const el = document.createElement("ce-nav-list") as CeNavList;
    el.setAttribute("items", "not json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.items).toEqual([]);
    el.remove();
  });

  it("renders the optional per-item meta HTML as raw markup", async () => {
    const el = document.createElement("ce-nav-list") as CeNavList;
    el.items = [
      { label: "A", href: "#a", meta: "<span data-test='m'>3d ago</span>" },
      { label: "B", href: "#b" },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    const metaSpans = el.shadowRoot!.querySelectorAll(".ce-nav__meta");
    expect(metaSpans.length).toBe(1);
    const inner = metaSpans[0].querySelector("[data-test='m']");
    expect(inner).not.toBeNull();
    expect(inner!.textContent).toBe("3d ago");
    el.remove();
  });

  it("omits the meta block when meta field is absent", async () => {
    const el = document.createElement("ce-nav-list") as CeNavList;
    el.items = [{ label: "A", href: "#a" }];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll(".ce-nav__meta").length).toBe(0);
    el.remove();
  });

  it("renders labelHtml as raw markup when provided", async () => {
    const el = document.createElement("ce-nav-list") as CeNavList;
    el.items = [
      {
        label: "Card",
        labelHtml: "C<span data-hit>ar</span>d",
        href: "#card",
      },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    const inner = el.shadowRoot!.querySelector("[data-hit]");
    expect(inner).not.toBeNull();
    expect(inner!.textContent).toBe("ar");
    el.remove();
  });
});
