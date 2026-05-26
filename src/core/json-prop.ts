import type { PropertyDeclaration } from "lit";

/**
 * `PropertyDeclaration` helper for properties whose value is an object or
 * array yet must also be settable from a plain HTML attribute string — so the
 * tag can be used in a static HTML page without any accompanying `<script>`.
 *
 * Behaviour:
 *   - Attribute absent / empty → `fallback` is used.
 *   - Attribute present & parseable JSON → parsed value.
 *   - Attribute present & malformed JSON → `fallback` (ADR-013: silent;
 *     consumers can surface the error via `data-ce-error="json-parse"` on
 *     their own host element if they need to flag it).
 *
 * JS assignment (`el.rows = [...]`) continues to work exactly as before.
 *
 * Usage:
 *   ```ts
 *   import { jsonProp } from "../core/index.js";
 *
 *   export class CeBarChart extends CecElement {
 *     @property(jsonProp<BarRow[]>([]))
 *     rows: BarRow[] = [];
 *   }
 *   ```
 *
 * @param fallback  Value used when the attribute is missing or unparseable.
 * @param attribute Attribute name. Pass `true` (default) to derive from the
 *                  property name, a string to override, or `false` to disable
 *                  attribute binding entirely.
 */
export function jsonProp<T>(
  fallback: T,
  attribute: string | boolean = true,
): PropertyDeclaration<T> {
  return {
    attribute,
    converter: {
      fromAttribute(value: string | null): T {
        if (value == null || value === "") return fallback;
        try {
          return JSON.parse(value) as T;
        } catch {
          return fallback;
        }
      },
      toAttribute(value: T): string | null {
        if (value == null) return null;
        try {
          return JSON.stringify(value);
        } catch {
          return null;
        }
      },
    },
  };
}
