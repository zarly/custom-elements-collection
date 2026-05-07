/**
 * Easing curves and a `prefers-reduced-motion` gate. Pure functions; the
 * media-query check is the only DOM touch and is guarded for SSR / vitest
 * environments that do not stub `matchMedia`.
 */

/** Linear pass-through. Provided for symmetry with `cubicOut`. */
export function linear(t: number): number {
  return t;
}

/**
 * Cubic ease-out: fast start, gentle landing. Default for chart transitions
 * (tooltip fades, fill widths, path tweens).
 */
export function cubicOut(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u;
}

/**
 * Detects `prefers-reduced-motion: reduce`. Returns `false` when no DOM /
 * matchMedia is available — assume the consumer wants motion unless the OS
 * has explicitly opted out.
 */
export function isReducedMotion(): boolean {
  if (typeof globalThis === "undefined") return false;
  const mm = (globalThis as { matchMedia?: (q: string) => MediaQueryList })
    .matchMedia;
  if (typeof mm !== "function") return false;
  try {
    return mm("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * Motion gate: returns `value` when motion is allowed, otherwise the
 * fallback. Defaults to `0` (the typical "no animation" sentinel — duration
 * in ms, distance in px, etc).
 *
 *   gateMotion(200)              // 200 normally, 0 when reduce-motion
 *   gateMotion("0.3s", "0s")     // disable a CSS transition string
 *   gateMotion(true, false)      // boolean toggle
 */
export function gateMotion(value: number): number;
export function gateMotion<T>(value: T, fallback: T): T;
export function gateMotion<T>(value: T, fallback?: T): T {
  if (!isReducedMotion()) return value;
  if (fallback === undefined) {
    return 0 as unknown as T;
  }
  return fallback;
}
