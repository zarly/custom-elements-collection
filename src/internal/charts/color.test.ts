import { describe, it, expect } from "vitest";
import {
  NAMED_CHART_COLORS,
  DEFAULT_PALETTE,
  isNamedChartColor,
  resolveColor,
  paletteColor,
} from "./color.js";

describe("isNamedChartColor", () => {
  it("recognises every entry in NAMED_CHART_COLORS", () => {
    for (const name of NAMED_CHART_COLORS) {
      expect(isNamedChartColor(name)).toBe(true);
    }
  });

  it("rejects unknown strings", () => {
    expect(isNamedChartColor("teal")).toBe(false);
    expect(isNamedChartColor("neutral")).toBe(false);
    expect(isNamedChartColor("#5a8")).toBe(false);
  });

  it("rejects undefined / empty", () => {
    expect(isNamedChartColor(undefined)).toBe(false);
    expect(isNamedChartColor("")).toBe(false);
  });
});

describe("resolveColor", () => {
  it("falls back to --ce-color-blue when input is undefined", () => {
    expect(resolveColor(undefined)).toBe("var(--ce-color-blue)");
  });

  it("falls back when input is empty string", () => {
    expect(resolveColor("")).toBe("var(--ce-color-blue)");
  });

  it("respects a custom fallback token", () => {
    expect(resolveColor(undefined, "--ce-color-green")).toBe(
      "var(--ce-color-green)"
    );
  });

  it("maps named colors to ce-color-* tokens", () => {
    expect(resolveColor("blue")).toBe("var(--ce-color-blue)");
    expect(resolveColor("amber")).toBe("var(--ce-color-amber)");
    expect(resolveColor("cyan")).toBe("var(--ce-color-cyan)");
  });

  it("returns hex literals as-is", () => {
    expect(resolveColor("#5a8")).toBe("#5a8");
    expect(resolveColor("#ff00aa")).toBe("#ff00aa");
  });

  it("returns rgb()/hsl()/oklch() as-is", () => {
    expect(resolveColor("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
    expect(resolveColor("hsl(120 50% 50%)")).toBe("hsl(120 50% 50%)");
    expect(resolveColor("oklch(0.7 0.15 200)")).toBe("oklch(0.7 0.15 200)");
  });

  it("returns var(...) references as-is", () => {
    expect(resolveColor("var(--brand-primary)")).toBe(
      "var(--brand-primary)"
    );
  });
});

describe("paletteColor", () => {
  it("returns the palette entry at the index", () => {
    expect(paletteColor(0)).toBe(`var(--ce-color-${DEFAULT_PALETTE[0]})`);
    expect(paletteColor(1)).toBe(`var(--ce-color-${DEFAULT_PALETTE[1]})`);
  });

  it("wraps past the palette length", () => {
    const wrapped = paletteColor(DEFAULT_PALETTE.length);
    expect(wrapped).toBe(`var(--ce-color-${DEFAULT_PALETTE[0]})`);
  });

  it("wraps negative indices with positive modulo", () => {
    expect(paletteColor(-1)).toBe(
      `var(--ce-color-${DEFAULT_PALETTE[DEFAULT_PALETTE.length - 1]})`
    );
  });

  it("accepts a custom palette", () => {
    expect(paletteColor(0, ["red"])).toBe("var(--ce-color-red)");
    expect(paletteColor(3, ["red", "green"])).toBe("var(--ce-color-green)");
  });

  it("falls back to the default token on an empty palette", () => {
    expect(paletteColor(0, [])).toBe("var(--ce-color-blue)");
  });
});
