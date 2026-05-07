import { describe, it, expect } from "vitest";
import { niceTicks, linearScale } from "./scale.js";

describe("niceTicks", () => {
  it("produces nice 1/2/5×10ⁿ ticks for a 0–100 range", () => {
    // The Heckbert algorithm only uses step values 1, 2, 5, 10. For count=5
    // and range=100 it chooses step=20 (six ticks), not step=25 (five ticks).
    const r = niceTicks(0, 100, 5);
    expect(r.ticks).toEqual([0, 20, 40, 60, 80, 100]);
    expect(r.niceMin).toBe(0);
    expect(r.niceMax).toBe(100);
    expect(r.step).toBe(20);
  });

  it("expands the domain to nice values", () => {
    const r = niceTicks(3, 97, 5);
    expect(r.niceMin).toBeLessThanOrEqual(3);
    expect(r.niceMax).toBeGreaterThanOrEqual(97);
    expect(r.ticks[0]).toBe(r.niceMin);
    expect(r.ticks[r.ticks.length - 1]).toBe(r.niceMax);
  });

  it("handles a fractional domain", () => {
    const r = niceTicks(0, 1, 5);
    expect(r.ticks).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    expect(r.step).toBe(0.2);
  });

  it("collapses to a single tick when min === max", () => {
    const r = niceTicks(7, 7, 5);
    expect(r.ticks).toEqual([7]);
    expect(r.step).toBe(0);
  });

  it("swaps min/max if reversed", () => {
    const a = niceTicks(0, 100, 5);
    const b = niceTicks(100, 0, 5);
    expect(b.ticks).toEqual(a.ticks);
  });

  it("returns empty ticks for non-finite input", () => {
    expect(niceTicks(NaN, 10).ticks).toEqual([]);
    expect(niceTicks(0, Infinity).ticks).toEqual([]);
  });

  it("handles negative ranges", () => {
    const r = niceTicks(-50, 50, 5);
    expect(r.niceMin).toBeLessThanOrEqual(-50);
    expect(r.niceMax).toBeGreaterThanOrEqual(50);
    expect(r.ticks).toContain(0);
  });
});

describe("linearScale", () => {
  it("projects the midpoint", () => {
    expect(linearScale(50, 0, 100, 0, 200)).toBe(100);
  });

  it("projects the endpoints", () => {
    expect(linearScale(0, 0, 100, 10, 20)).toBe(10);
    expect(linearScale(100, 0, 100, 10, 20)).toBe(20);
  });

  it("returns rangeMin on a zero-extent domain", () => {
    expect(linearScale(5, 7, 7, 0, 100)).toBe(0);
  });

  it("supports inverted ranges (e.g. SVG y-axis)", () => {
    expect(linearScale(0, 0, 100, 200, 0)).toBe(200);
    expect(linearScale(100, 0, 100, 200, 0)).toBe(0);
    expect(linearScale(50, 0, 100, 200, 0)).toBe(100);
  });
});
