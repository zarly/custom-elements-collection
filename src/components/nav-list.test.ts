import { describe, it, expect, beforeAll, vi } from "vitest";
import { defineOnce } from "../core/index.js";
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

  it("falls back to [] and warns when items attribute is invalid JSON", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = document.createElement("ce-nav-list") as CeNavList;
    el.setAttribute("items", "not json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.items).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    el.remove();
  });
});
