import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeFilterBar } from "./filter-bar.js";

beforeAll(() => defineOnce("ce-filter-bar", CeFilterBar));

describe("<ce-filter-bar>", () => {
  it("renders one button per option", async () => {
    const el = document.createElement("ce-filter-bar") as CeFilterBar;
    el.options = [
      { value: "all", label: "All" },
      { value: "open", label: "Open" },
      { value: "done", label: "Done" },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    const btns = el.shadowRoot!.querySelectorAll(".ce-filter__btn");
    expect(btns.length).toBe(3);
    el.remove();
  });

  it("marks selected value as aria-pressed=true", async () => {
    const el = document.createElement("ce-filter-bar") as CeFilterBar;
    el.options = [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
    ];
    el.value = "a";
    document.body.appendChild(el);
    await el.updateComplete;
    const btns = el.shadowRoot!.querySelectorAll(".ce-filter__btn");
    expect(btns[0].getAttribute("aria-pressed")).toBe("true");
    expect(btns[1].getAttribute("aria-pressed")).toBe("false");
    el.remove();
  });

  it("dispatches ce-filter-change with new value on click (single select)", async () => {
    const el = document.createElement("ce-filter-bar") as CeFilterBar;
    el.options = [{ value: "a", label: "A" }, { value: "b", label: "B" }];
    document.body.appendChild(el);
    await el.updateComplete;
    let detail: { value: string; values: string[] } | null = null;
    el.addEventListener("ce-filter-change", (e) => {
      detail = (e as CustomEvent).detail;
    });
    const btns = el.shadowRoot!.querySelectorAll(".ce-filter__btn");
    (btns[0] as HTMLButtonElement).click();
    expect(detail).toEqual({ value: "a", values: ["a"] });
    el.remove();
  });

  it("toggles off the same value when clicked again (single select)", async () => {
    const el = document.createElement("ce-filter-bar") as CeFilterBar;
    el.options = [{ value: "a", label: "A" }];
    el.value = "a";
    document.body.appendChild(el);
    await el.updateComplete;
    const btn = el.shadowRoot!.querySelector(".ce-filter__btn") as HTMLButtonElement;
    btn.click();
    expect(el.value).toBe("");
    el.remove();
  });

  it("multi-select adds and removes values", async () => {
    const el = document.createElement("ce-filter-bar") as CeFilterBar;
    el.multiple = true;
    el.options = [{ value: "a", label: "A" }, { value: "b", label: "B" }];
    document.body.appendChild(el);
    await el.updateComplete;
    const btns = el.shadowRoot!.querySelectorAll(".ce-filter__btn");
    (btns[0] as HTMLButtonElement).click();
    (btns[1] as HTMLButtonElement).click();
    expect(el.value.split(",").sort()).toEqual(["a", "b"]);
    (btns[0] as HTMLButtonElement).click();
    expect(el.value).toBe("b");
    el.remove();
  });

  it("renders count chip when option has count", async () => {
    const el = document.createElement("ce-filter-bar") as CeFilterBar;
    el.options = [{ value: "x", label: "X", count: 42 }];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-filter__count")?.textContent).toBe("42");
    el.remove();
  });

  it("parses options from a JSON attribute before append", async () => {
    const el = document.createElement("ce-filter-bar") as CeFilterBar;
    const value = [
      { value: "all", label: "All" },
      { value: "open", label: "Open" },
      { value: "done", label: "Done" },
    ];
    el.setAttribute("options", JSON.stringify(value));
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.options).toEqual(value);
    const btns = el.shadowRoot!.querySelectorAll(".ce-filter__btn");
    expect(btns.length).toBe(3);
    el.remove();
  });

  it("falls back to [] when options attribute is invalid JSON", async () => {
    const el = document.createElement("ce-filter-bar") as CeFilterBar;
    el.setAttribute("options", "not json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.options).toEqual([]);
    el.remove();
  });
});
