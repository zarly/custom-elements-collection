import { describe, it, expect } from "vitest";
import { classNames } from "./class-names.js";

describe("classNames", () => {
  it("joins strings", () => {
    expect(classNames("a", "b", "c")).toBe("a b c");
  });

  it("drops falsy values", () => {
    expect(classNames("a", false, null, undefined, "", 0, "b")).toBe("a b");
  });

  it("resolves ternaries", () => {
    const on = true;
    const off = false;
    expect(classNames("a", on ? "b" : null, off ? "c" : null)).toBe("a b");
  });

  it("resolves object maps", () => {
    expect(classNames("base", { active: true, disabled: false, loading: true })).toBe(
      "base active loading"
    );
  });

  it("flattens arrays", () => {
    expect(classNames("a", ["b", "c", ["d", { e: true }]])).toBe("a b c d e");
  });

  it("handles numbers", () => {
    expect(classNames("col", 3)).toBe("col 3");
  });

  it("returns empty string for all-falsy input", () => {
    expect(classNames(false, null, undefined)).toBe("");
  });

  it("does not include keys whose value is null/undefined", () => {
    expect(classNames({ a: null, b: undefined, c: true })).toBe("c");
  });
});
