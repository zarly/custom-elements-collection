import { describe, it, expect } from "vitest";
import { groupKeyOf, orderGroupKeys, capitalize } from "./group.js";

const LABELS = { ui: "UI", lesson: "Lesson", internal: "Internal" };

function rec(over = {}) {
  return {
    tag: "ce-card",
    category: "ui",
    tier: "brick",
    stability: "stable",
    group: "Layout & primitives",
    created: "2026-04-15",
    ...over,
  };
}

describe("capitalize", () => {
  it("uppercases the first character", () => {
    expect(capitalize("brick")).toBe("Brick");
    expect(capitalize("")).toBe("");
    expect(capitalize(undefined)).toBeUndefined();
  });
});

describe("groupKeyOf", () => {
  it("group axis → 'UI · <group>' for ui category", () => {
    expect(groupKeyOf(rec(), "group", LABELS)).toBe("UI · Layout & primitives");
  });
  it("group axis → CATEGORY_LABEL for non-ui", () => {
    expect(groupKeyOf(rec({ category: "lesson" }), "group", LABELS)).toBe("Lesson");
  });
  it("tier axis capitalises", () => {
    expect(groupKeyOf(rec(), "tier", LABELS)).toBe("Brick");
  });
  it("stability axis capitalises", () => {
    expect(groupKeyOf(rec({ stability: "beta" }), "stability", LABELS)).toBe("Beta");
  });
  it("category axis uses CATEGORY_LABEL", () => {
    expect(groupKeyOf(rec({ category: "internal" }), "category", LABELS)).toBe("Internal");
  });
  it("createdMonth axis yields YYYY-MM", () => {
    expect(groupKeyOf(rec(), "createdMonth", LABELS)).toBe("2026-04");
  });
  it("alpha axis uses first char after the ce- prefix", () => {
    expect(groupKeyOf(rec({ tag: "ce-card" }), "alpha", LABELS)).toBe("C");
    expect(groupKeyOf(rec({ tag: "ce-chip" }), "alpha", LABELS)).toBe("C");
  });
});

describe("orderGroupKeys", () => {
  it("tier order is Brick → Widget → Layout", () => {
    expect(orderGroupKeys("tier", ["Layout", "Brick", "Widget"])).toEqual([
      "Brick",
      "Widget",
      "Layout",
    ]);
  });
  it("stability order is Stable → Beta → Experimental → Deprecated", () => {
    expect(
      orderGroupKeys("stability", ["Deprecated", "Stable", "Beta"]),
    ).toEqual(["Stable", "Beta", "Deprecated"]);
  });
  it("createdMonth sorts descending (newest first)", () => {
    expect(
      orderGroupKeys("createdMonth", ["2026-03", "2026-05", "2026-04"]),
    ).toEqual(["2026-05", "2026-04", "2026-03"]);
  });
  it("alpha sorts ascending", () => {
    expect(orderGroupKeys("alpha", ["C", "A", "B"])).toEqual(["A", "B", "C"]);
  });
});
