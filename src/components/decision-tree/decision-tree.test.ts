import { describe, it, expect, beforeAll, vi } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeDecisionTree } from "./decision-tree.js";

beforeAll(() => defineOnce("ce-decision-tree", CeDecisionTree));

describe("<ce-decision-tree>", () => {
  it("renders the question", async () => {
    const el = document.createElement("ce-decision-tree") as CeDecisionTree;
    el.question = "Does the cell exist?";
    el.branches = [];
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".ce-tree__q")?.textContent).toBe(
      "Does the cell exist?"
    );
    el.remove();
  });

  it("renders one branch per entry", async () => {
    const el = document.createElement("ce-decision-tree") as CeDecisionTree;
    el.question = "x";
    el.branches = [
      { label: "Yes", kind: "yes", result: "Use THERE" },
      { label: "No", kind: "no", result: "Use THEY" },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    const branches = el.shadowRoot!.querySelectorAll(".ce-tree__branch");
    expect(branches.length).toBe(2);
    expect(branches[0].classList.contains("yes")).toBe(true);
    expect(branches[1].classList.contains("no")).toBe(true);
    el.remove();
  });

  it("renders branch label and result", async () => {
    const el = document.createElement("ce-decision-tree") as CeDecisionTree;
    el.question = "x";
    el.branches = [{ label: "Affirm", result: "Path A" }];
    document.body.appendChild(el);
    await el.updateComplete;
    const branch = el.shadowRoot!.querySelector(".ce-tree__branch")!;
    expect(branch.querySelector(".ce-tree__label")?.textContent).toBe("Affirm");
    expect(branch.querySelector(".ce-tree__result")?.textContent).toBe("Path A");
    el.remove();
  });

  it("uses ↓ YES / ↓ NO arrows for kinded branches", async () => {
    const el = document.createElement("ce-decision-tree") as CeDecisionTree;
    el.question = "x";
    el.branches = [
      { label: "y", kind: "yes", result: "a" },
      { label: "n", kind: "no", result: "b" },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    const arrows = el.shadowRoot!.querySelectorAll(".ce-tree__arrow");
    expect(arrows[0].textContent?.trim()).toBe("↓ YES");
    expect(arrows[1].textContent?.trim()).toBe("↓ NO");
    el.remove();
  });

  it("parses branches from a JSON attribute before append", async () => {
    const el = document.createElement("ce-decision-tree") as CeDecisionTree;
    const value = [
      { label: "Yes", kind: "yes", result: "Use THERE" },
      { label: "No", kind: "no", result: "Use THEY" },
    ];
    el.setAttribute("branches", JSON.stringify(value));
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.branches).toEqual(value);
    const branches = el.shadowRoot!.querySelectorAll(".ce-tree__branch");
    expect(branches.length).toBe(2);
    expect(branches[0].classList.contains("yes")).toBe(true);
    expect(branches[1].classList.contains("no")).toBe(true);
    el.remove();
  });

  it("falls back to [] and warns when branches attribute is invalid JSON", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = document.createElement("ce-decision-tree") as CeDecisionTree;
    el.setAttribute("branches", "not json");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.branches).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    el.remove();
  });
});
