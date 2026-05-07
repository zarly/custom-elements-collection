import { describe, it, expect, afterEach, vi } from "vitest";
import { linear, cubicOut, isReducedMotion, gateMotion } from "./easing.js";

describe("linear", () => {
  it("returns the input unchanged", () => {
    expect(linear(0)).toBe(0);
    expect(linear(0.5)).toBe(0.5);
    expect(linear(1)).toBe(1);
  });
});

describe("cubicOut", () => {
  it("anchors at t=0 and t=1", () => {
    expect(cubicOut(0)).toBe(0);
    expect(cubicOut(1)).toBe(1);
  });

  it("eases out — output exceeds input mid-curve", () => {
    expect(cubicOut(0.5)).toBeGreaterThan(0.5);
    expect(cubicOut(0.25)).toBeGreaterThan(0.25);
  });

  it("is monotonically increasing", () => {
    let prev = cubicOut(0);
    for (let i = 1; i <= 10; i++) {
      const v = cubicOut(i / 10);
      expect(v).toBeGreaterThan(prev);
      prev = v;
    }
  });
});

describe("isReducedMotion + gateMotion", () => {
  // jsdom does not implement matchMedia by default; we install a stub per case.
  const originalMatchMedia = (globalThis as { matchMedia?: unknown }).matchMedia;

  afterEach(() => {
    if (originalMatchMedia === undefined) {
      delete (globalThis as { matchMedia?: unknown }).matchMedia;
    } else {
      (globalThis as { matchMedia?: unknown }).matchMedia = originalMatchMedia;
    }
  });

  function stubMatchMedia(matches: boolean) {
    (globalThis as { matchMedia?: (q: string) => MediaQueryList }).matchMedia =
      vi.fn(
        (q: string) =>
          ({
            matches,
            media: q,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
          }) as unknown as MediaQueryList
      );
  }

  it("returns false when matchMedia is missing", () => {
    delete (globalThis as { matchMedia?: unknown }).matchMedia;
    expect(isReducedMotion()).toBe(false);
    expect(gateMotion(200)).toBe(200);
  });

  it("returns false when reduce-motion is not set", () => {
    stubMatchMedia(false);
    expect(isReducedMotion()).toBe(false);
    expect(gateMotion(200)).toBe(200);
    expect(gateMotion("0.3s", "0s")).toBe("0.3s");
  });

  it("returns true and zeros motion when reduce-motion is set", () => {
    stubMatchMedia(true);
    expect(isReducedMotion()).toBe(true);
    expect(gateMotion(200)).toBe(0);
  });

  it("uses the explicit fallback when reduce-motion is set", () => {
    stubMatchMedia(true);
    expect(gateMotion("0.3s", "0s")).toBe("0s");
    expect(gateMotion(true, false)).toBe(false);
  });

  it("survives a matchMedia that throws", () => {
    (globalThis as { matchMedia?: unknown }).matchMedia = () => {
      throw new Error("not supported");
    };
    expect(isReducedMotion()).toBe(false);
    expect(gateMotion(200)).toBe(200);
  });
});
