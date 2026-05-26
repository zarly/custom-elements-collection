import { describe, it, expect } from "vitest";
import {
  valueCounts,
  valueCountsOnRemove,
  rankValues,
  pickCandidates,
} from "./facets.js";

function rec(tag, tags, extras = {}) {
  return { tag, tags, ...extras };
}

const FREE_TAGS = (r) => r.tags.slice(1);

const RECORDS = [
  rec("ce-card",   ["Layout & primitives", "primitive", "container"]),
  rec("ce-grid",   ["Layout & primitives", "primitive", "layout"]),
  rec("ce-kpi",    ["Data display", "metric", "primitive"]),
  rec("ce-chart",  ["Data display", "metric", "chart"]),
  rec("ce-input",  ["Form controls", "form", "input"]),
];

// Trivial predicate: only filters on the `tags` set (AND).
function passes(record, filters) {
  if (filters.tags?.size) {
    const free = record.tags.slice(1);
    for (const t of filters.tags) if (!free.includes(t)) return false;
  }
  return true;
}

const emptyFilters = () => ({ tags: new Set() });

describe("valueCounts", () => {
  it("counts every encountered value when no candidates restrict", () => {
    const counts = valueCounts(RECORDS, emptyFilters(), passes, FREE_TAGS);
    expect(counts.get("primitive")).toBe(3);
    expect(counts.get("metric")).toBe(2);
    expect(counts.get("container")).toBe(1);
    expect(counts.has("Layout & primitives")).toBe(false); // tags[0] excluded by FREE_TAGS
  });

  it("restricts counting to candidates", () => {
    const counts = valueCounts(
      RECORDS,
      emptyFilters(),
      passes,
      FREE_TAGS,
      ["primitive", "metric", "nonexistent"],
    );
    expect([...counts.keys()].sort()).toEqual(
      ["metric", "nonexistent", "primitive"],
    );
    expect(counts.get("primitive")).toBe(3);
    expect(counts.get("metric")).toBe(2);
    expect(counts.get("nonexistent")).toBe(0);
  });

  it("reflects current filter state — selected tag drives others toward 0", () => {
    // Once "form" is selected, only ce-input passes; "primitive" should drop to 0.
    const filters = { tags: new Set(["form"]) };
    const counts = valueCounts(
      RECORDS, filters, passes, FREE_TAGS,
      ["form", "primitive", "input"],
    );
    expect(counts.get("form")).toBe(1);
    expect(counts.get("input")).toBe(1);
    expect(counts.get("primitive")).toBe(0);
  });

  it("does not double-count duplicate values within one record", () => {
    const records = [rec("x", ["g", "dup", "dup", "other"])];
    const counts = valueCounts(
      records, emptyFilters(), passes, FREE_TAGS,
    );
    expect(counts.get("dup")).toBe(1);
    expect(counts.get("other")).toBe(1);
  });
});

describe("valueCountsOnRemove", () => {
  it("reports the result-set size after each selected value is dropped", () => {
    // tags = {primitive, metric} — only ce-kpi satisfies both (count = 1).
    // Drop "metric" → tags = {primitive} → ce-card, ce-grid, ce-kpi (3).
    // Drop "primitive" → tags = {metric} → ce-kpi, ce-chart (2).
    const filters = { tags: new Set(["primitive", "metric"]) };
    const out = valueCountsOnRemove(
      RECORDS, filters, "tags", passes, filters.tags,
    );
    expect(out.get("metric")).toBe(3);
    expect(out.get("primitive")).toBe(2);
  });

  it("returns total record count when removing the only selected value", () => {
    const filters = { tags: new Set(["form"]) };
    const out = valueCountsOnRemove(
      RECORDS, filters, "tags", passes, filters.tags,
    );
    expect(out.get("form")).toBe(RECORDS.length);
  });

  it("returns an empty map when nothing is selected", () => {
    const out = valueCountsOnRemove(
      RECORDS, { tags: new Set() }, "tags", passes, new Set(),
    );
    expect(out.size).toBe(0);
  });
});

describe("rankValues", () => {
  it("sorts by descending count then alphabetically, ignoring tags[0]", () => {
    const ranked = rankValues(RECORDS, FREE_TAGS);
    // primitive=3, metric=2; remaining all =1 → alpha order
    expect(ranked[0]).toEqual(["primitive", 3]);
    expect(ranked[1]).toEqual(["metric", 2]);
    const ones = ranked.slice(2).map(([v]) => v);
    expect(ones).toEqual([...ones].sort());
  });
});

describe("pickCandidates", () => {
  it("returns top-N values sorted by population rank", () => {
    const out = pickCandidates(RECORDS, FREE_TAGS, new Set(), 2);
    expect(out).toEqual(["primitive", "metric"]);
  });

  it("includes selected values even when they fall outside the rank cutoff", () => {
    // limit=1 → only top "primitive" by rank; selecting "input" must keep it visible.
    const out = pickCandidates(RECORDS, FREE_TAGS, new Set(["input"]), 1);
    expect(out).toContain("primitive");
    expect(out).toContain("input");
    // Selected first.
    expect(out[0]).toBe("input");
  });

  it("orders selected values before unselected", () => {
    const out = pickCandidates(
      RECORDS, FREE_TAGS, new Set(["metric"]), 5,
    );
    expect(out[0]).toBe("metric");
    // After selected, "primitive" wins on rank (3) over "metric"-already-placed.
    expect(out[1]).toBe("primitive");
  });

  it("returns every value when limit is Infinity", () => {
    const out = pickCandidates(RECORDS, FREE_TAGS, new Set(), Infinity);
    // Every free-tag across the corpus must appear.
    const allTags = new Set();
    for (const r of RECORDS) for (const t of r.tags.slice(1)) allTags.add(t);
    expect(new Set(out)).toEqual(allTags);
  });
});
