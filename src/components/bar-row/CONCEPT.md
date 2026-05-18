# `<ce-bar-row>` — design rationale

Per [ADR-008](../../../docs/adr/adr-008-component-concept-files.md).

## 2026-05-18 — Initial implementation

### Why a separate primitive from `ce-bar-chart`

Corpus audit of 335 vis/ HTML files found 1874 raw occurrences of the `.bar-row` pattern:

```html
<div class="bar-row">
  <div class="bar-label">Engineering</div>
  <div class="bar-track"><div class="bar-fill" style="width:56%;background:var(--accent);">9 agents</div></div>
</div>
```

Two distinct use cases emerged:
1. **Single-row standalone** — a progress indicator, quota display, or skill bar that stands alone (not part of a ranked comparison).
2. **Multi-row chart** — N rows compared against each other with auto-scale to the max value.

`ce-bar-chart` handles case 2. `ce-bar-row` handles case 1 *and* serves as the atomic unit inside `ce-bar-chart` for slot-children mode (CDR-005). Keeping them separate follows CDR-006 (compose, no hard wrappers) — the chart wraps rows, not the other way around.

### CDR-005 resolution order (slot children mode)

When `<ce-bar-row>` elements are children of `<ce-bar-chart>`:

1. `ce-bar-chart.data` JSON prop non-empty → use it; `ce-bar-row` children are ignored.
2. Else iterate `<ce-bar-row>` children; the chart reads `value` and `color` attributes, and the `label` / `meta` slot HTML via `querySelector`.
3. Else render empty state.

The `ce-bar-row` element itself renders `nothing` (display:contents) when nested — it is a pure data carrier in that context. The chart parent owns the rendering.

### Shadow DOM (deviation from Light DOM default)

`ce-bar-row` uses Shadow DOM (`createShadowRootWithStyles()`) because the `:host([color="..."])` selectors for the six named colors require Shadow DOM specificity isolation. Without it, consumer stylesheets would easily override the fill colors unintentionally. This is the same justification used by `ce-card` and `ce-verdict`.

Light DOM is still used for slot content (label, meta) — the shadow boundary does not prevent slot content from reaching the parent chart's `querySelector` scan because slots in Shadow DOM are assigned from the light DOM parent, and `querySelectorAll("[slot='label']")` on the host element still finds them.

### `value-display` — three-value style enum (CDR-001)

Where to render the fill value is a presentation policy (CDR-003), not a content decision. Three canonical positions cover all corpus patterns:
- `inside` — default; matches the raw `bar-fill` pattern where the percentage is inside the fill.
- `outside` — value shown right of the track; useful when the fill is narrow.
- `hidden` — no value rendered; consumer shows it elsewhere or provides meta text.

Three values is within the CDR-001 finite-enum budget (≤5 canonical values).

### `max` attribute

Raw corpus usage often drives fill from arbitrary counts (e.g. value=7 of max=10 tasks). Without `max`, consumers must pre-compute percentages and pass 0..100. Adding `max` lets the element do the arithmetic and also correctly sets `aria-valuemax`. Default is 100, matching the most common implicit assumption.

When `ce-bar-row` is nested inside `ce-bar-chart`, the chart's own `max` / auto-scale governs fill width and the row's `max` attribute is not read. This is documented in meta.limitations.

### `label` and `meta` string attributes

Added alongside the slot equivalents (CDR-002 carve-out rationale): for simple prose labels, requiring a slot child adds unnecessary verbosity. The attribute form is LLM-friendly and matches the existing `ce-bar-chart` JSON `BarRow.label` / `.meta` field names. Rich slot always wins over the attribute — the resolution is explicit and documented.

### ARIA

In standalone mode the track carries `role="progressbar"` with:
- `aria-valuemin="0"`
- `aria-valuemax` = `max` attribute
- `aria-valuenow` = `value` attribute
- `aria-label` = label slot text → label attribute → formatted value (priority order)

When nested inside `ce-bar-chart` the element renders nothing and the parent chart handles ARIA for each row.

### Deferred

- Animated transition in standalone mode (`prefers-reduced-motion` media query is respected, but no `animated` boolean like `ce-bar-chart`). Could be added additively per CDR-008 if corpus demand warrants.
- `ce-bar-row` does not emit chart events (`ce-chart-hover`, `ce-chart-select`). In standalone mode these would require a click handler. Deferred — low corpus signal for interactive standalone rows.
