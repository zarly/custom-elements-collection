/**
 * Minimal classnames helper. Filters out falsy values and joins with " ".
 *
 * classNames("a", false && "b", cond ? "c" : null, { d: true, e: false })
 *   === "a c d"
 */
export type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, boolean | null | undefined>
  | ClassValue[];

export function classNames(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const v of values) {
    if (!v) continue;
    if (typeof v === "string" || typeof v === "number") {
      out.push(String(v));
    } else if (Array.isArray(v)) {
      const nested = classNames(...v);
      if (nested) out.push(nested);
    } else if (typeof v === "object") {
      for (const [k, enabled] of Object.entries(v)) {
        if (enabled) out.push(k);
      }
    }
  }
  return out.join(" ");
}
