import { describe, it, expect } from "vitest";
import { matchesQuery, escRegex, highlightLabel } from "./query.js";

describe("matchesQuery", () => {
  const rec = { searchHaystack: "ce-card layout primitive content card" };

  it("returns true for an empty query", () => {
    expect(matchesQuery(rec, "")).toBe(true);
  });

  it("returns true on substring match", () => {
    expect(matchesQuery(rec, "card")).toBe(true);
  });

  it("returns false on a miss", () => {
    expect(matchesQuery(rec, "zzz")).toBe(false);
  });
});

describe("escRegex", () => {
  it("escapes regex metacharacters", () => {
    expect(escRegex("a.b+c?")).toBe("a\\.b\\+c\\?");
  });

  it("returns plain text untouched", () => {
    expect(escRegex("chart")).toBe("chart");
  });
});

describe("highlightLabel", () => {
  it("wraps the first occurrence in <ce-mark>", () => {
    expect(highlightLabel("Card", "ar")).toBe("C<ce-mark>ar</ce-mark>d");
  });

  it("is case-insensitive for matching but preserves case in output", () => {
    expect(highlightLabel("Card", "CA")).toBe("<ce-mark>Ca</ce-mark>rd");
  });

  it("escapes HTML characters in the surrounding text", () => {
    expect(highlightLabel("a<b>c", "b")).toBe(
      "a&lt;<ce-mark>b</ce-mark>&gt;c",
    );
  });

  it("returns the plain escaped label on no match", () => {
    expect(highlightLabel("Card", "zzz")).toBe("Card");
  });

  it("handles empty query as plain escape", () => {
    expect(highlightLabel("a<b>", "")).toBe("a&lt;b&gt;");
  });
});
