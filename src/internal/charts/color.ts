/**
 * Color resolution shared by chart components. Hybrid model — a `color` prop
 * accepts either a closed-enum named token (`"blue"`, `"green"`, …) which
 * maps to `var(--ce-color-${name})`, or an arbitrary CSS color expression
 * (`"#5a8"`, `"rgb(…)"`, `"oklch(…)"`, `"var(--my-token)"`) which is
 * returned as-is.
 */

/**
 * The closed-enum names the existing repo recognises. Kept tight on purpose
 * so the back-compat path with `<ce-bar-chart color="…">` stays clean. The
 * widened universe lives in `CecColor` (`src/core/types.ts`) which also
 * includes `"neutral"` — neutral is intentionally NOT a chart color.
 */
export const NAMED_CHART_COLORS = [
  "blue",
  "green",
  "red",
  "amber",
  "purple",
  "cyan",
] as const;

export type NamedChartColor = (typeof NAMED_CHART_COLORS)[number];

/**
 * Default multi-series palette for `ce-plot`. Order chosen to put red last
 * so a series doesn't accidentally inherit error semantics by sitting in the
 * default cycle.
 */
export const DEFAULT_PALETTE: readonly NamedChartColor[] = [
  "blue",
  "green",
  "amber",
  "purple",
  "cyan",
  "red",
];

const NAMED_SET: ReadonlySet<string> = new Set(NAMED_CHART_COLORS);

/** True if `s` is one of the closed-enum chart color names. */
export function isNamedChartColor(s: string | undefined): s is NamedChartColor {
  return typeof s === "string" && NAMED_SET.has(s);
}

/**
 * Resolve a user-supplied color string into a value safe to drop into a
 * `style` attribute or a CSS custom-property declaration.
 *
 *   resolveColor()                  → "var(--ce-color-blue)"
 *   resolveColor("blue")            → "var(--ce-color-blue)"
 *   resolveColor("#5a8")            → "#5a8"
 *   resolveColor("rgb(0 0 0)")      → "rgb(0 0 0)"
 *   resolveColor("var(--brand)")    → "var(--brand)"
 *   resolveColor(undefined, "--ce-color-green")
 *                                   → "var(--ce-color-green)"
 *
 * The fallback parameter is a token *name* (with the leading `--`), not a
 * full CSS expression. The default — `--ce-color-blue` — matches the
 * existing `ce-bar-chart` default and avoids depending on an unshipped
 * `--ce-accent` token.
 */
export function resolveColor(
  input: string | undefined,
  fallbackToken = "--ce-color-blue"
): string {
  if (input === undefined || input === "") {
    return `var(${fallbackToken})`;
  }
  if (isNamedChartColor(input)) {
    return `var(--ce-color-${input})`;
  }
  return input;
}

/**
 * Convenience for series cycling: pick the Nth palette color and resolve it
 * to a CSS expression. Negative indices wrap with positive modulo so callers
 * don't need to clamp.
 */
export function paletteColor(
  index: number,
  palette: readonly NamedChartColor[] = DEFAULT_PALETTE
): string {
  const len = palette.length;
  if (len === 0) return resolveColor(undefined);
  const i = ((index % len) + len) % len;
  return resolveColor(palette[i]);
}
