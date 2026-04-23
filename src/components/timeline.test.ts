import { describe, it, expect, beforeAll, vi } from "vitest";
import { defineOnce } from "../core/index.js";
import { CeTimeline } from "./timeline.js";

beforeAll(() => defineOnce("ce-timeline", CeTimeline));

describe("<ce-timeline>", () => {
  it("renders one item per entry with title and meta", async () => {
    const el = document.createElement("ce-timeline") as CeTimeline;
    el.items = [
      { title: "Design", meta: "Week 1" },
      { title: "Build", meta: "Weeks 2-3" },
      { title: "Ship", meta: "Week 4" },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    const items = el.shadowRoot!.querySelectorAll(".ce-tl-item");
    expect(items.length).toBe(3);
    expect(items[0].querySelector(".ce-tl-title")?.textContent).toBe("Design");
    expect(items[0].querySelector(".ce-tl-meta")?.textContent).toBe("Week 1");
    el.remove();
  });

  it("applies color class on the dot", async () => {
    const el = document.createElement("ce-timeline") as CeTimeline;
    el.items = [
      { title: "a", color: "green" },
      { title: "b", color: "red" },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    const dots = el.shadowRoot!.querySelectorAll(".ce-tl-dot");
    expect(dots[0].classList.contains("c-green")).toBe(true);
    expect(dots[1].classList.contains("c-red")).toBe(true);
    el.remove();
  });

  it("renders a custom icon inside the dot", async () => {
    const el = document.createElement("ce-timeline") as CeTimeline;
    el.items = [{ title: "x", icon: "★" }];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(
      el.shadowRoot!.querySelector(".ce-tl-dot")?.textContent?.trim()
    ).toBe("★");
    el.remove();
  });

  it("omits meta and description when not provided", async () => {
    const el = document.createElement("ce-timeline") as CeTimeline;
    el.items = [{ title: "bare" }];
    document.body.appendChild(el);
    await el.updateComplete;
    const item = el.shadowRoot!.querySelector(".ce-tl-item")!;
    expect(item.querySelector(".ce-tl-meta")).toBeNull();
    expect(item.querySelector(".ce-tl-desc")).toBeNull();
    el.remove();
  });

  it("reflects orientation attribute", async () => {
    const el = document.createElement("ce-timeline") as CeTimeline;
    el.orientation = "horizontal";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("orientation")).toBe("horizontal");
    el.remove();
  });

  it("parses `items` from a JSON attribute set before connect", async () => {
    const el = document.createElement("ce-timeline") as CeTimeline;
    const items = [
      { title: "Design", meta: "Week 1" },
      { title: "Build", meta: "Weeks 2-3" },
      { title: "Ship", meta: "Week 4" },
    ];
    el.setAttribute("items", JSON.stringify(items));
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.items).toEqual(items);
    expect(el.shadowRoot!.querySelectorAll(".ce-tl-item").length).toBe(3);
    el.remove();
  });

  it("falls back to [] and warns when `items` attribute is invalid JSON", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = document.createElement("ce-timeline") as CeTimeline;
    el.setAttribute("items", "not json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.items).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    el.remove();
  });
});
