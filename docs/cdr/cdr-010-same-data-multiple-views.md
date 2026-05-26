---
id: CDR-010
title: Same data, multiple views — siblings over variants
status: accepted
date: 2026-05-22
compliance: SHOULD
tags: [api-design, composition, customization]
relates_to: [ADR-003, ADR-009, CDR-003, CDR-005, CDR-006]
---

# CDR-010 — Same data, multiple views — siblings over variants

## Context

A central goal of CEC is that the **same LLM-emitted markup can be re-rendered under different user customizations** without the LLM having to re-emit anything: themes, sort order, density, "show me this as a bar chart instead of a donut". The 2026-05-22 operator goal #5 framed this as "different customisations on user-side with the same output data … zero-cost abstractions".

[ADR-003](../adr/adr-003-theming.md) (CSS custom properties) and [CDR-003](cdr-003-presentation-policy-global.md) (presentation policy global) cover **theme** and **per-instance boolean policies**. They do not cover three remaining axes:

1. **Sort / filter / group of collection items.** Where does ordering live — in the markup, the component, or the consumer?
2. **View variants** that swap the renderer entirely (bar ↔ line ↔ area chart; donut ↔ pie; vertical ↔ horizontal bars).
3. **Data-shape stability across sibling components.** If `<ce-bar-chart values="[…]">` swaps to `<ce-line-chart values="[…]">`, does the same array work?

Without explicit rules, the path of least resistance is `<ce-chart as="bar"|"line"|"donut" values="[…]">` — one tag, an `as=` enum, three renderers under one roof. This locks consumers into a single tag's surface, defeats tree-shaking, and **forces every visual variant to live in JavaScript** instead of CSS or markup.

## Decision

### Rule 1 — No `view=` / `as=` / `variant=` enums that switch renderers

A single component MUST NOT expose an attribute (enum or boolean) that swaps the rendering technique to something a sibling component already does (or could). Instead:

- Ship **sibling components** that accept the same data shape.
- The LLM author chooses the tag; the consumer (or the wrapping layout) substitutes one tag for another by simple string replacement.

Concrete examples:

- ✅ `<ce-bar-chart values="[…]">`, `<ce-line-chart values="[…]">`, `<ce-area-chart values="[…]">` — three sibling tags, identical `values` shape.
- ❌ `<ce-chart kind="bar" values="[…]">` with the `kind` attribute switching between bar / line / area in one component.

This is **not** a ban on shape modifiers that stay within the same visual technique:

- ✅ `<ce-donut thickness="0">` (a donut with thickness=0 *is* a pie — same SVG geometry, one attribute drives the shape) — that's a degree-of-freedom, not a renderer swap.
- ✅ `<ce-bar-chart orientation="vertical|horizontal">` — same bars, different layout axis — borderline but acceptable when both modes share ≥80% of the code path.

The litmus: if implementing the alternative would mean a *different* `render()` method body, ship a sibling tag.

### Rule 2 — Sibling components in the same `group` share data shape

Components that live under the same `tags[0]` group (per [ADR-005](../adr/adr-005-component-meta.md) and `src/meta/groups.ts`) MUST either:

- Share their primary collection-prop name AND item shape (e.g. every chart-group component reads `values: number[]` OR `data: Array<{label, value, color?, meta?}>`), OR
- Declare `meta.shapeFamily: "<name>"` and provide a documented adapter when the consumer wants to cross families.

The shape families currently in use (codify on first applicable PR):

| Family | Primary prop | Item shape |
|---|---|---|
| `numeric-series` | `values` | `number[]` |
| `labelled-series` | `data` | `Array<{label: string, value: number, color?: string, meta?: string}>` |
| `key-value` | (slot children `<ce-kv key="…">value</ce-kv>`) | n/a |
| `time-series` | `data` | `Array<{t: string \| number, v: number}>` |
| `node-graph` | `nodes`, `edges` | `Array<{id, label?}>` / `Array<{from, to, weight?}>` |

When a new component lands in an existing group, it MUST adopt the family's shape, OR the meta declares `shapeFamily: "<new-family>"` with an entry in the table above.

### Rule 3 — Sort / filter / group is the consumer's job

Components MUST NOT expose a `sort=` / `order=` / `group-by=` attribute that re-orders or filters the collection passed in. The order in which items appear in the rendered DOM matches the order in which they appeared in `data=…` (JSON mode) or in the slotted children (slot mode per [CDR-005](cdr-005-collections-json-and-slot.md)) — **strictly stable**.

Re-ordering, filtering, and grouping live at the consumer layer:

- The consumer's wrapping component pre-sorts the array and emits the sorted markup, OR
- The consumer attaches a CSS-driven view variant via a custom property (e.g. `--ce-table-sort-order: desc` reverses display order via `flex-direction: row-reverse` / `order` rules in CSS), OR
- A separate `ce-collection-sort` wrapper component (future, opt-in) re-orders its children declaratively.

This keeps the LLM-emitted markup minimal: the model emits the data once; the user re-arranges it.

### Rule 4 — Theme & view policy extends CDR-003

CSS-driven view variants (already mandated by [CDR-003](cdr-003-presentation-policy-global.md) for booleans) extend to enums when the enum is *presentation policy*, not data:

- ✅ `--ce-bar-chart-density: compact | comfortable | spacious` — three policy values, set on `:root`, no per-instance attribute.
- ✅ `--ce-table-sort-order: asc | desc | index` — sort policy at the document layer.
- ❌ `<ce-bar-chart density="compact" sort="desc">` — both belong in CSS variables on `:root`.

## Goal / Definition of success

- Zero components ship with `view=`/`as=`/`kind=`/`variant=` switching renderers within one tag.
- Every chart / list / table / graph component documents its `shapeFamily` in meta.
- Same `values=[…]` markup, fed to two sibling tags, renders the same data — verified by a families-snapshot test.
- Sort / filter / group never appears as a component attribute; tests exist for "swap two items in the input → DOM swap matches".

## When to apply

- Designing a new chart, list, graph, or any collection-rendering component.
- Considering an `as=` / `view=` / `kind=` attribute on an existing component.
- A consumer asks for "the same data, but as a different chart".

## When NOT to apply

- **Degree-of-freedom modifiers within the same renderer** (`thickness`, `orientation`, `radius`) — not a renderer swap.
- **Form-control type** (`<ce-input type="text|email|number">`) — type is an HTML form semantics primitive, not a renderer swap.
- **Layout density variants** that are pure CSS — preferred to go through CSS variables anyway (rule 4).

## Good examples

```html
<!-- Same data, three sibling tags — consumer chooses the renderer -->
<ce-bar-chart  values="[42,28,18,12]" labels='["Direct","Search","Referral","Social"]'></ce-bar-chart>
<ce-line-chart values="[42,28,18,12]" labels='["Direct","Search","Referral","Social"]'></ce-line-chart>
<ce-area-chart values="[42,28,18,12]" labels='["Direct","Search","Referral","Social"]'></ce-area-chart>

<!-- Sort lives at the document layer -->
<style>:root { --ce-table-sort-order: desc; }</style>
<ce-table data='[…unsorted as the LLM emitted it…]'></ce-table>

<!-- Density is policy, not per-instance -->
<style>:root { --ce-bar-chart-density: compact; }</style>
<ce-bar-chart values="[1,2,3]"></ce-bar-chart>
<ce-bar-chart values="[4,5,6]"></ce-bar-chart>
```

## Bad examples (anti-patterns)

```html
<!-- ❌ Renderer-swap enum -->
<ce-chart kind="bar"  values="[…]"></ce-chart>
<ce-chart kind="line" values="[…]"></ce-chart>
<ce-chart kind="area" values="[…]"></ce-chart>
<!-- Three renderers under one tag. Locks consumers, defeats tree-shaking,
     and the LLM author must guess which value to emit. -->

<!-- ❌ Sort as component attribute -->
<ce-bar-chart sort="desc" data='[…]'></ce-bar-chart>
<!-- The LLM author now decides ordering. Re-runs produce different markup
     for the same logical data. -->

<!-- ❌ Sibling components disagree on shape -->
<ce-bar-chart values="[1,2,3]"></ce-bar-chart>
<ce-line-chart data='[{x:0,y:1},{x:1,y:2}]'></ce-line-chart>
<!-- Same group, incompatible shapes. Can't substitute one for the other
     without re-emitting markup. -->
```

## Consequences

- ✅ "Same data, different view" works by tag substitution — one string replace, zero re-emit.
- ✅ Each renderer is a small, focused component (better tree-shaking, smaller bundles per use case).
- ✅ Sort / filter / group decisions live at the consumer layer, where they belong.
- ✅ The LLM emits the minimum: data + tag name. Customisation is downstream.
- ✅ Disarms sabotage move #3 (CSS-var sprawl) by giving "view variant" a clear home (sibling tag + CSS var on `:root`), which keeps the `:root` token surface from ballooning.
- ⚠️ More tags in the catalog — but each is smaller, more focused, and tree-shakable.
- ⚠️ Authors must remember the shape-family contract when adding a new component to an existing group.

## Validation

- **Lint candidate:** `rule_no_renderer_swap_enum` — flag any `meta.json` prop named `view | as | kind | variant | type` whose enum values include any pair that maps to plausibly distinct renderers (heuristic: enum values that appear as tag suffixes in other components, e.g. `kind="bar"` while `ce-bar-chart` exists).
- **Lint candidate:** `rule_no_sort_attribute` — flag `meta.json` props named `sort | order | order-by | group-by | filter`.
- **Snapshot test:** `tests/shape-families/families.test.ts` — for every shape family, render the same input through every member of the family, assert no errors and (per family) some lightweight invariants (e.g. labelled-series components all expose `label` text to the accessibility tree).
- **Manual review checklist:** *"Does this attribute switch what the `render()` method body does, or is it a degree of freedom within the same body?"* If the former → split into a sibling tag.

## History

- 2026-05-22 — Accepted. Triggered by the 2026-05-22 rules-corpus audit (`vis/cec-rules-audit-2026-05-22.html`) and the operator's framing of goal #5 (same data, multiple customizations, zero-cost abstractions).
