/**
 * Number formatters shared by chart components. Pure functions, no DOM,
 * tree-shakeable. Built on `Intl.NumberFormat` so locales come for free.
 *
 * Each formatter caches the underlying `Intl.NumberFormat` per (locale,
 * options) pair to avoid repeatedly constructing one on hot render paths.
 *
 * The default locale is `undefined`, which lets `Intl.NumberFormat` pick the
 * runtime default — matches existing behavior of native `toLocaleString()`.
 */

type FormatterCache = Map<string, Intl.NumberFormat>;
const cache: FormatterCache = new Map();

function getFormatter(
  locale: string | undefined,
  options: Intl.NumberFormatOptions
): Intl.NumberFormat {
  const key = `${locale ?? ""}|${JSON.stringify(options)}`;
  let fmt = cache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, options);
    cache.set(key, fmt);
  }
  return fmt;
}

/** Format a plain number — locale-aware thousand separators. */
export function number(v: number, locale?: string): string {
  return getFormatter(locale, {}).format(v);
}

/**
 * Format a fraction as a percent. `0.345 → "34.5%"`. `fractionDigits`
 * defaults to 1; pass 0 for whole percents.
 */
export function percent(
  v: number,
  fractionDigits = 1,
  locale?: string
): string {
  return getFormatter(locale, {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(v);
}

/** Format as a currency. ISO 4217 code, e.g. `"USD"`, `"EUR"`. */
export function currency(
  v: number,
  currencyCode: string,
  locale?: string
): string {
  return getFormatter(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(v);
}

/**
 * Compact notation: `1234 → "1.2K"`, `2_000_000 → "2M"`. Useful for axis
 * tick labels and KPI tiles.
 */
export function compact(v: number, locale?: string): string {
  return getFormatter(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);
}
