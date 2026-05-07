/**
 * Scale + tick utilities for chart axes. D3-style "nice number" algorithm
 * inlined so we don't pull a 70-KB dep for what is fundamentally a 25-line
 * function.
 *
 * Reference: Heckbert, "Nice Numbers for Graph Labels", 1990, Graphics Gems.
 */

export interface NiceTicksResult {
  /** The tick values themselves, evenly spaced on `step`. */
  ticks: number[];
  /** The lower bound rounded down to a multiple of `step`. */
  niceMin: number;
  /** The upper bound rounded up to a multiple of `step`. */
  niceMax: number;
  /** The step between adjacent ticks. `0` when min === max. */
  step: number;
}

/** Round a positive number to the nearest "nice" 1/2/5/10 × 10ⁿ. */
function niceNum(range: number, round: boolean): number {
  if (range <= 0) return 0;
  const exponent = Math.floor(Math.log10(range));
  const magnitude = Math.pow(10, exponent);
  const fraction = range / magnitude;
  let nice: number;
  if (round) {
    if (fraction < 1.5) nice = 1;
    else if (fraction < 3) nice = 2;
    else if (fraction < 7) nice = 5;
    else nice = 10;
  } else {
    if (fraction <= 1) nice = 1;
    else if (fraction <= 2) nice = 2;
    else if (fraction <= 5) nice = 5;
    else nice = 10;
  }
  return nice * magnitude;
}

/**
 * Compute pretty axis ticks for a numeric domain `[min, max]`.
 *
 * Targets `count` divisions but always returns *nice* values, which means
 * the actual tick count may differ by ±1. Use `niceMin` / `niceMax` to set
 * the axis domain so that both endpoints land on a tick.
 *
 * Edge cases:
 *  - `min === max` ⇒ single tick at `min`, `step` of `0`.
 *  - `min > max`   ⇒ silently swapped.
 *  - non-finite inputs ⇒ empty `ticks`, `step` of `0`.
 */
export function niceTicks(
  min: number,
  max: number,
  count = 5
): NiceTicksResult {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { ticks: [], niceMin: 0, niceMax: 0, step: 0 };
  }
  if (min > max) [min, max] = [max, min];
  if (min === max) {
    return { ticks: [min], niceMin: min, niceMax: max, step: 0 };
  }
  const range = niceNum(max - min, false);
  const divisions = Math.max(1, count - 1);
  const step = niceNum(range / divisions, true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  // Use a half-step epsilon so floating-point error doesn't drop the last tick.
  for (let v = niceMin; v <= niceMax + step / 2; v += step) {
    // toFixed(10) → Number normalizes 0.1 + 0.2 → 0.3 noise.
    ticks.push(Number(v.toFixed(10)));
  }
  return { ticks, niceMin, niceMax, step };
}

/**
 * Linear scale: project a value from `[domainMin, domainMax]` onto
 * `[rangeMin, rangeMax]`. Returns `rangeMin` when the domain has zero
 * extent (avoids NaN).
 */
export function linearScale(
  value: number,
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number
): number {
  const span = domainMax - domainMin;
  if (span === 0) return rangeMin;
  const t = (value - domainMin) / span;
  return rangeMin + t * (rangeMax - rangeMin);
}
