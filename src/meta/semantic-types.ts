/**
 * Semantic property types — see CDR-012.
 *
 * A closed enum of well-known semantic categories that components can
 * declare on individual props. TypeScript says `string`; this enum says
 * "this is an email" / "this is a percent 0..100" / "this is a hex color".
 *
 * Used by:
 *   - studio submit-time validation (refuse a meta value that doesn't
 *     match the declared semantic shape)
 *   - llm-benchmark scorer canonicalization (treat `96%` and `0.96` as
 *     the same value for `percent-0-100`)
 *   - LLM tool-use prompts (richer prop documentation than `string`)
 *
 * To extend: add an entry here + describe the canonicalization in
 * `studio/src/lib/semantic-validators.ts` + score in
 * `llm-benchmark/src/analyzers/selection.ts`. Bumping this list is a
 * minor version per CDR-008 (additive); narrowing is a major.
 */

export const SEMANTIC_TYPES = [
  // — Identifiers ————————————————————————————————
  "email",
  "url",
  "phone",
  "uuid",
  "ce-tag",
  "semver",
  "lang-code",
  "currency-code",

  // — Numeric scales —————————————————————————————
  "percent-0-100",
  "ratio-0-1",
  "rating-scale-5",
  "rating-scale-10",
  "size-pixels",

  // — Enumerations ——————————————————————————————
  "size-scale", // sm / md / lg
  "color-tone", // info / success / warn / danger
  "category", // generic categorical

  // — Time ————————————————————————————————————————
  "iso-date",
  "iso-datetime",
  "iso-duration",
  "unix-timestamp",

  // — Color ———————————————————————————————————————
  "hex-color",
  "rgb-color",
  "token-color",

  // — Person / address ——————————————————————————
  "name-first",
  "name-last",
  "name-full",
  "address-line",
  "address-postal",
  "address-country",

  // — Content payload ——————————————————————————
  "markdown",
  "html",
  "json",
  "plaintext",

  // — Files / media ———————————————————————————
  "mime-type",
  "file-extension",
  "image-url",
  "video-url",

  // — Other —————————————————————————————————————
  "regex",
  "cron-expression",
  "geo-coord",
] as const;

export type SemanticType = (typeof SEMANTIC_TYPES)[number];

export const SEMANTIC_TYPE_SET: ReadonlySet<string> = new Set(SEMANTIC_TYPES);

export function isSemanticType(value: string): value is SemanticType {
  return SEMANTIC_TYPE_SET.has(value);
}
