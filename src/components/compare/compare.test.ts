import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeCompare } from "./compare.js";

beforeAll(() => defineOnce("ce-compare", CeCompare));

describe("<ce-compare>", () => {
  it("renders default labels Before / After", async () => {
    const el = document.createElement("ce-compare") as CeCompare;
    document.body.appendChild(el);
    await el.updateComplete;
    const labels = el.shadowRoot!.querySelectorAll(".ce-compare__label");
    expect(labels[0].textContent).toBe("Before");
    expect(labels[1].textContent).toBe("After");
    el.remove();
  });

  it("honors custom labels", async () => {
    const el = document.createElement("ce-compare") as CeCompare;
    el.setAttribute("before-label", "Old world");
    el.setAttribute("after-label", "New world");
    document.body.appendChild(el);
    await el.updateComplete;
    const labels = el.shadowRoot!.querySelectorAll(".ce-compare__label");
    expect(labels[0].textContent).toBe("Old world");
    expect(labels[1].textContent).toBe("New world");
    el.remove();
  });

  it("renders the arrow by default", async () => {
    const el = document.createElement("ce-compare") as CeCompare;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-compare__arrow")?.textContent).toBe("→");
    el.remove();
  });

  it("accepts custom arrow", async () => {
    const el = document.createElement("ce-compare") as CeCompare;
    el.arrow = "vs";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-compare__arrow")?.textContent).toBe("vs");
    el.remove();
  });

  it("hides arrow when attribute is empty string", async () => {
    const el = document.createElement("ce-compare") as CeCompare;
    el.arrow = "";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-compare__arrow")).toBeNull();
    el.remove();
  });

  it("has before and after slots", async () => {
    const el = document.createElement("ce-compare") as CeCompare;
    document.body.appendChild(el);
    await el.updateComplete;
    const names = Array.from(el.shadowRoot!.querySelectorAll("slot")).map((s) =>
      s.getAttribute("name")
    );
    expect(names).toContain("before");
    expect(names).toContain("after");
    el.remove();
  });
});
