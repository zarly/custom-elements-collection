import { describe, it, expect } from "vitest";
import { number, percent, currency, compact } from "./format.js";

// All assertions use `en-US` to keep tests deterministic across CI locales.

describe("format.number", () => {
  it("returns a localized integer", () => {
    expect(number(1234, "en-US")).toBe("1,234");
  });

  it("preserves a decimal", () => {
    expect(number(12.5, "en-US")).toBe("12.5");
  });

  it("formats zero", () => {
    expect(number(0, "en-US")).toBe("0");
  });

  it("formats a negative", () => {
    expect(number(-1500, "en-US")).toBe("-1,500");
  });
});

describe("format.percent", () => {
  it("renders one fraction digit by default", () => {
    expect(percent(0.345, undefined, "en-US")).toBe("34.5%");
  });

  it("respects custom fraction digits", () => {
    expect(percent(0.5, 0, "en-US")).toBe("50%");
  });

  it("formats zero", () => {
    expect(percent(0, 0, "en-US")).toBe("0%");
  });
});

describe("format.currency", () => {
  it("formats USD", () => {
    expect(currency(1234, "USD", "en-US")).toBe("$1,234.00");
  });

  it("formats EUR with a dedicated locale", () => {
    // de-DE uses non-breaking spaces and trailing currency symbol.
    const out = currency(1234, "EUR", "de-DE");
    // Match digits and symbol presence — locale glyphs (NBSP) vary by ICU build.
    expect(out).toContain("1.234,00");
    expect(out).toContain("€"); // €
  });
});

describe("format.compact", () => {
  it("compacts thousands", () => {
    expect(compact(1234, "en-US")).toBe("1.2K");
  });

  it("compacts millions", () => {
    expect(compact(2_000_000, "en-US")).toBe("2M");
  });

  it("leaves small numbers as-is", () => {
    expect(compact(42, "en-US")).toBe("42");
  });
});

describe("format caching", () => {
  it("returns identical output on repeat calls (smoke check)", () => {
    const a = number(1000, "en-US");
    const b = number(1000, "en-US");
    expect(a).toBe(b);
  });
});
