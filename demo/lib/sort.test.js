import { describe, it, expect } from "vitest";
import { comparator, cmpDateDesc } from "./sort.js";

const recs = [
  { tag: "ce-card", updated: "2026-05-10", created: "2026-04-01", dependentsCount: 12 },
  { tag: "ce-chip", updated: "2026-05-15", created: "2026-04-02", dependentsCount: 8 },
  { tag: "ce-button", updated: "2026-05-05", created: "2026-03-15", dependentsCount: 5 },
  { tag: "ce-orphan", updated: null, created: null, dependentsCount: 0 },
];

function sorted(by) {
  return [...recs].sort(comparator(by)).map((r) => r.tag);
}

describe("comparator", () => {
  it("a-z sorts by tag ascending", () => {
    expect(sorted("a-z")).toEqual(["ce-button", "ce-card", "ce-chip", "ce-orphan"]);
  });

  it("z-a reverses tag order", () => {
    expect(sorted("z-a")).toEqual(["ce-orphan", "ce-chip", "ce-card", "ce-button"]);
  });

  it("recent-updated puts newest first; nulls last", () => {
    expect(sorted("recent-updated")).toEqual([
      "ce-chip",
      "ce-card",
      "ce-button",
      "ce-orphan",
    ]);
  });

  it("recent-created mirrors recent-updated on the created column", () => {
    expect(sorted("recent-created")).toEqual([
      "ce-chip",
      "ce-card",
      "ce-button",
      "ce-orphan",
    ]);
  });

  it("most-deps ranks by dependents desc; ties break by tag", () => {
    expect(sorted("most-deps")).toEqual(["ce-card", "ce-chip", "ce-button", "ce-orphan"]);
  });

  it("least-deps inverts the dependents order", () => {
    expect(sorted("least-deps")).toEqual(["ce-orphan", "ce-button", "ce-chip", "ce-card"]);
  });

  it("unknown sortBy falls back to a-z", () => {
    expect(sorted("nonsense")).toEqual(["ce-button", "ce-card", "ce-chip", "ce-orphan"]);
  });
});

describe("cmpDateDesc", () => {
  it("puts later dates first", () => {
    expect(cmpDateDesc("2026-05-01", "2026-04-01")).toBeLessThan(0);
    expect(cmpDateDesc("2026-04-01", "2026-05-01")).toBeGreaterThan(0);
  });
  it("treats nulls as 'later than nothing'", () => {
    expect(cmpDateDesc(null, "2026-04-01")).toBeGreaterThan(0);
    expect(cmpDateDesc("2026-04-01", null)).toBeLessThan(0);
    expect(cmpDateDesc(null, null)).toBe(0);
  });
});
