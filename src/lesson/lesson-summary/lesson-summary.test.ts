import { describe, it, expect, beforeAll, vi } from "vitest";
import { defineOnce } from "../../core/index.js";
import { LessonSummary } from "./lesson-summary.js";

beforeAll(() => defineOnce("lesson-summary", LessonSummary));

describe("<lesson-summary>", () => {
  it("renders default title 'Key Takeaways' when title prop not set", async () => {
    const el = document.createElement("lesson-summary") as LessonSummary;
    document.body.appendChild(el);
    await el.updateComplete;
    const title = el.shadowRoot!.querySelector(".lsu-title");
    expect(title?.textContent).toContain("Key Takeaways");
    el.remove();
  });

  it("custom title appears in header", async () => {
    const el = document.createElement("lesson-summary") as LessonSummary;
    el.title = "Chapter 3 Summary";
    document.body.appendChild(el);
    await el.updateComplete;
    const title = el.shadowRoot!.querySelector(".lsu-title");
    expect(title?.textContent).toContain("Chapter 3 Summary");
    el.remove();
  });

  it("items prop renders a ul with N items", async () => {
    const el = document.createElement("lesson-summary") as LessonSummary;
    el.items = ["First point", "Second point", "Third point"];
    document.body.appendChild(el);
    await el.updateComplete;
    const listItems = el.shadowRoot!.querySelectorAll(".lsu-item");
    expect(listItems.length).toBe(3);
    el.remove();
  });

  it("each item has a check prefix", async () => {
    const el = document.createElement("lesson-summary") as LessonSummary;
    el.items = ["A point"];
    document.body.appendChild(el);
    await el.updateComplete;
    const check = el.shadowRoot!.querySelector(".lsu-check");
    expect(check?.textContent?.trim()).toBe("✓");
    el.remove();
  });

  it("empty items renders slot instead", async () => {
    const el = document.createElement("lesson-summary") as LessonSummary;
    document.body.appendChild(el);
    await el.updateComplete;
    const slot = el.shadowRoot!.querySelector("slot");
    expect(slot).not.toBeNull();
    const list = el.shadowRoot!.querySelector(".lsu-list");
    expect(list).toBeNull();
    el.remove();
  });

  it("jsonProp parses items from attribute string", async () => {
    const el = document.createElement("lesson-summary") as LessonSummary;
    el.setAttribute("items", '["Point A","Point B"]');
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.items).toEqual(["Point A", "Point B"]);
    el.remove();
  });

  it("title shown with amber color class", async () => {
    const el = document.createElement("lesson-summary") as LessonSummary;
    document.body.appendChild(el);
    await el.updateComplete;
    const title = el.shadowRoot!.querySelector(".lsu-title");
    expect(title).not.toBeNull();
    el.remove();
  });

  it("falls back gracefully on malformed items JSON", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = document.createElement("lesson-summary") as LessonSummary;
    el.setAttribute("items", "not-json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.items).toEqual([]);
    warn.mockRestore();
    el.remove();
  });
});
