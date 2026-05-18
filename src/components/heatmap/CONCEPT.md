# `<ce-heatmap>` — Design Rationale

## 2026-05-18 — Dual mode + CellInput type widening

### Context

The original `<ce-heatmap>` accepted only `data: number[][]`. Two gaps surfaced:

1. **Authoring friction** — a 5×7 grid as a JSON attribute is a 200-character single-line string; diff granularity collapses to one line; escaping is error-prone for humans.
2. **Cell expressivity** — there was no way to override individual cell colors, add tooltips, or carry rich display text per cell.

### Options weighed

**Option A — JSON-only with richer CellInput shape**

Widen `data` to `(number | CellInput)[][]` where `CellInput = { value?, tone?, title? }`. All existing `number[][]` usage continues unchanged (CDR-008 additive). Tone overrides palette-derived alpha; title becomes the cell tooltip.

- Pro: single API, all structural data is co-located.
- Con: handwritten markup for large grids is still hostile (long attribute).

**Option B — Slot mode only, deprecate JSON**

Remove JSON path; require `<ce-heat-row>`/`<ce-heat-cell>` children for all usage.

- Pro: cleanest API.
- Con: breaks every existing user; violates CDR-008. Ruled out.

**Option C (chosen) — Both modes per CDR-005**

Keep JSON mode (now accepting `(number | CellInput)[][]`), add slot mode via `<ce-heat-row>` + `<ce-heat-cell>` children. Resolution order per CDR-005:
1. `data` non-empty → JSON mode (current behaviour, CDR-008 preserved).
2. Else slot children present → slot mode.
3. Neither → empty state.

Both modes produce visually identical output for equivalent data (snapshot parity test).

### CellInput design

`tone` (1-5) overrides the palette-derived alpha via the same ramp as `<ce-heat-cell>`. This is a configuration number driving layout math — CDR-002 NOT-applicable per its "numeric/boolean primitives that drive layout or math" exception.

`title` must be a plain string per HTML spec — CDR-002 NOT-applicable per "ARIA labels / identity attributes must be plain strings."

### CeHeatCell.toneToAlpha as shared logic

The alpha ramp (1→0.05, 5→0.55, step 0.125) is defined once in `CeHeatCell.toneToAlpha()` (static method) and called from both `CeHeatCell` standalone rendering and `CeHeatmap.#colorFor()`. This keeps the ramp calculation canonical — if the ramp ever changes, one edit covers both paths.

### Slot-mode value extraction

In slot mode, the parent reads `tone` from `<ce-heat-cell tone="…">` and `textContent` as both display text and numeric fallback. If the cell text is not a parseable float (e.g., "SDK", "V"), the numeric value defaults to 0. This is intentional: when using slot mode the caller controls display text independently of color, and tone explicitly sets the intensity. Palette scaling by value is only meaningful in JSON mode where all values are numeric.
