import { describe, it, expect } from "vitest";
import {
  passesFilters,
  isDefaultFilters,
  activeFilterCount,
  HAS_FIELD,
} from "./filters.js";

function emptyFilters() {
  return {
    stab: new Set(),
    tier: new Set(),
    cat: new Set(),
    has: new Set(),
    tags: new Set(),
    created: 0,
    updated: 0,
  };
}

function rec(over = {}) {
  return {
    tag: "ce-card",
    stability: "stable",
    tier: "brick",
    category: "ui",
    tags: ["Layout & primitives", "primitive"],
    hasEvents: false,
    hasSlots: true,
    hasCssVars: true,
    hasGlobalDeps: false,
    hasSideEffects: false,
    created: "2026-04-15",
    updated: "2026-05-15",
    ...over,
  };
}

describe("isDefaultFilters", () => {
  it("true for an empty filter set", () => {
    expect(isDefaultFilters(emptyFilters())).toBe(true);
  });
  it("false when any axis is non-empty", () => {
    const f = emptyFilters();
    f.stab.add("stable");
    expect(isDefaultFilters(f)).toBe(false);
  });
});

describe("activeFilterCount", () => {
  it("counts each non-empty axis once (not per value)", () => {
    const f = emptyFilters();
    f.stab.add("stable");
    f.stab.add("beta");
    f.tier.add("brick");
    f.created = 7;
    expect(activeFilterCount(f)).toBe(3);
  });
});

describe("passesFilters", () => {
  it("passes everything when filters are empty", () => {
    expect(passesFilters(rec(), emptyFilters())).toBe(true);
  });

  it("filters stability — AND across axes", () => {
    const f = emptyFilters();
    f.stab.add("beta");
    expect(passesFilters(rec({ stability: "stable" }), f)).toBe(false);
    expect(passesFilters(rec({ stability: "beta" }), f)).toBe(true);
  });

  it("OR semantics within a multi-select", () => {
    const f = emptyFilters();
    f.tier.add("brick");
    f.tier.add("widget");
    expect(passesFilters(rec({ tier: "brick" }), f)).toBe(true);
    expect(passesFilters(rec({ tier: "widget" }), f)).toBe(true);
    expect(passesFilters(rec({ tier: "layout" }), f)).toBe(false);
  });

  it("has-* axis ANDs across the picked capabilities", () => {
    const f = emptyFilters();
    f.has.add("events");
    f.has.add("slots");
    expect(passesFilters(rec({ hasEvents: true, hasSlots: true }), f)).toBe(true);
    expect(passesFilters(rec({ hasEvents: true, hasSlots: false }), f)).toBe(false);
  });

  it("free-form tags axis ANDs across the selected tags (skipping tags[0])", () => {
    const f = emptyFilters();
    f.tags.add("primitive");
    expect(passesFilters(rec({ tags: ["Layout & primitives", "primitive"] }), f)).toBe(true);
    expect(passesFilters(rec({ tags: ["Layout & primitives", "other"] }), f)).toBe(false);
  });

  it("requires every selected tag (AND, not OR)", () => {
    const f = emptyFilters();
    f.tags.add("primitive");
    f.tags.add("form");
    expect(
      passesFilters(rec({ tags: ["Group", "primitive", "form"] }), f),
    ).toBe(true);
    expect(
      passesFilters(rec({ tags: ["Group", "primitive"] }), f),
    ).toBe(false);
    expect(
      passesFilters(rec({ tags: ["Group", "form"] }), f),
    ).toBe(false);
  });

  it("ignores tags[0] (the canonical group) when matching tags axis", () => {
    const f = emptyFilters();
    f.tags.add("Layout & primitives");
    // Canonical group sits at tags[0] and is excluded from the free-tag axis.
    expect(
      passesFilters(rec({ tags: ["Layout & primitives", "primitive"] }), f),
    ).toBe(false);
  });

  it("created-in-last filters by integer day count", () => {
    const f = emptyFilters();
    // Use a date far in the past — should be excluded with created=7.
    f.created = 7;
    expect(passesFilters(rec({ created: "1970-01-01" }), f)).toBe(false);
  });

  it("HAS_FIELD maps every UI label to a record field", () => {
    expect(Object.values(HAS_FIELD)).toEqual([
      "hasEvents",
      "hasSlots",
      "hasCssVars",
      "hasGlobalDeps",
      "hasSideEffects",
    ]);
  });
});
