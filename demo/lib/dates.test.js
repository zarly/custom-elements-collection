import { describe, it, expect } from "vitest";
import { esc, daysSinceIso, buildRowMeta } from "./dates.js";

describe("esc", () => {
  it("escapes &, <, >, and \"", () => {
    expect(esc('a & b <c> "d"')).toBe("a &amp; b &lt;c&gt; &quot;d&quot;");
  });
  it("stringifies numbers and other primitives", () => {
    expect(esc(7)).toBe("7");
    expect(esc(null)).toBe("null");
  });
});

describe("daysSinceIso", () => {
  it("returns Infinity for null / falsy input", () => {
    expect(daysSinceIso(null)).toBe(Infinity);
    expect(daysSinceIso("")).toBe(Infinity);
  });
  it("returns 0 for today", () => {
    const d = new Date();
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    expect(daysSinceIso(iso)).toBe(0);
  });
  it("returns positive integer for past dates", () => {
    expect(daysSinceIso("2000-01-01")).toBeGreaterThan(9000);
  });
});

describe("buildRowMeta", () => {
  it("returns empty string with no view options (default all OFF)", () => {
    // No view arg → all flags default to falsy → no output.
    expect(buildRowMeta({ updated: "2020-01-01", stability: "beta" })).toBe("");
  });

  it("returns empty string when view is explicitly all-false", () => {
    expect(
      buildRowMeta(
        { updated: "2020-01-01", stability: "experimental" },
        { showStability: false, showUpdated: false, showCreated: false },
      ),
    ).toBe("");
  });

  it("showStability: renders chip for non-stable components", () => {
    const html = buildRowMeta({ stability: "beta" }, { showStability: true });
    expect(html).toContain("ce-chip");
    expect(html).toContain("beta");
  });

  it("showStability: does NOT render chip for stable components", () => {
    const html = buildRowMeta(
      { stability: "stable", updated: "2000-01-01" },
      { showStability: true },
    );
    expect(html).not.toContain("ce-chip");
  });

  it("showUpdated: renders ce-relative-time for recent dates (≤30 days)", () => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const html = buildRowMeta({ updated: iso }, { showUpdated: true });
    expect(html).toContain("ce-relative-time");
  });

  it("showUpdated: renders plain ISO date for older dates", () => {
    const html = buildRowMeta({ updated: "2000-01-01" }, { showUpdated: true });
    expect(html).toContain("2000-01-01");
    expect(html).toContain("nav-meta-old");
    expect(html).not.toContain("ce-relative-time");
  });

  it("showUpdated: omits updated when record has no updated date", () => {
    const html = buildRowMeta({ updated: null }, { showUpdated: true });
    expect(html).toBe("");
  });

  it("showCreated: renders created date", () => {
    const html = buildRowMeta({ created: "2024-03-01" }, { showCreated: true });
    expect(html).toContain("2024-03-01");
    expect(html).toContain("nav-meta-old");
  });

  it("showCreated: omits created when record has no created date", () => {
    const html = buildRowMeta({}, { showCreated: true });
    expect(html).toBe("");
  });

  it("multiple view flags produce multiple parts joined by space", () => {
    const html = buildRowMeta(
      { stability: "experimental", created: "2024-01-01" },
      { showStability: true, showCreated: true },
    );
    expect(html).toContain("ce-chip");
    expect(html).toContain("2024-01-01");
    // Parts are joined by a space.
    expect(html.indexOf("ce-chip")).toBeLessThan(html.indexOf("2024-01-01"));
  });
});
