---
id: CDR-005
title: Collections accept both data-array and slot-children
status: accepted
date: 2026-05-18
compliance: SHOULD
tags: [api-design, composition, ergonomics]
relates_to: [ADR-009, CDR-002, CDR-006, src/components/bar-chart, src/components/flow, src/components/checklist, src/components/tabs]
---

# CDR-005 — Collections accept both data-array and slot-children

## Context

Components that render a **collection** of homogeneous items — bar rows, flow steps, checklist items, donut segments, heatmap cells, tabs, filter options — need to accept their data. There are two correct shapes for this, each suited to a different authoring context:

- **JSON-on-attribute** — `data='[{...}, ...]'`. Right for generated content (server-side rendering, LLM-emitted markup, programmatic creation). Compact, machine-friendly.
- **Slot-children** — `<ce-x><ce-x-item .../></ce-x>`. Right for handwritten markup. Diff-friendly (one line per item), rich children possible (per CDR-002), no JSON escaping in HTML attributes.

Forcing one shape excludes the other authoring style. The audit confirmed this: components with JSON-only collection APIs (`ce-bar-chart`, `ce-flow`, `ce-decision-tree`, `ce-heatmap`) showed low handwritten adoption because the JSON-on-attribute string is hostile to humans (long line, escaping, no per-item diff).

`ce-tabs` already does both (string array OR slotted `<button slot="tab">` children). This CDR codifies that pattern as a default.

## Decision

Components rendering a collection of items accept BOTH shapes. Resolution order:

1. **`data` JSON attribute non-empty** → use it. (Current behaviour for existing components.)
2. **Else iterate matching `<ce-x-item>` slot children.**
3. **Else render the empty state.**

Both shapes must produce visually identical output for equivalent data. Existing JSON-only components MAY add slot mode as an additive change; this is preferred over breaking the JSON API.

## Goal / Definition of success

- Every collection-shaped component documents both modes in `examples.html` (at least one example per mode).
- Switching from JSON to slot mode produces identical rendering for equivalent data — verified by snapshot test.
- Existing JSON-only components add slot mode without breaking existing consumers.

## When to apply

- Component renders 1..N homogeneous items: rows, steps, segments, cells, options.
- Items have a small, well-defined shape (label/value/color or similar).

## When NOT to apply

- **Single-value primitives** — `ce-kpi`, `ce-callout`, `ce-progress` (single bar). No collection means no second shape to offer.
- **Components where one shape is genuinely impossible** — extremely rare, but document why if so.
- **Layout-only wrappers** — `ce-grid`, `ce-section` already accept arbitrary slot children; no JSON shape is meaningful.

## Good examples

```html
<!-- JSON mode — for LLM / generator output -->
<ce-bar-chart data='[
  {"label":"Hero","value":42,"meta":"+12%"},
  {"label":"Kpi","value":27,"color":"green"}
]'></ce-bar-chart>

<!-- Slot mode — for handwritten markup with rich content -->
<ce-bar-chart>
  <ce-bar-row value="42" color="blue">
    <span slot="label">Hero <ce-chip type="amber">new</ce-chip></span>
    <span slot="meta">+12%</span>
  </ce-bar-row>
  <ce-bar-row value="27" color="green">
    <span slot="label">Kpi</span>
  </ce-bar-row>
</ce-bar-chart>

<!-- Tabs — both modes already supported -->
<ce-tabs tabs='["Overview","Settings","Logs"]'>
  <div slot="panel">…</div>
</ce-tabs>

<ce-tabs>
  <button slot="tab">📊 Dashboard</button>
  <div slot="panel">…</div>
</ce-tabs>
```

## Bad examples (anti-patterns)

```html
<!-- ❌ JSON-only forces single-line monoliths -->
<ce-bar-chart data='[{"label":"A","value":1},{"label":"B","value":2},{"label":"C","value":3},{"label":"D","value":4},{"label":"E","value":5}]'></ce-bar-chart>
<!-- Diff blame shows the whole string as one touched line.
     Per-item edits are hostile. -->

<!-- ❌ Two parallel APIs without a clear resolution rule -->
<ce-bar-chart data='[...]'>
  <ce-bar-row .../>   <!-- silently ignored? merged? both? -->
</ce-bar-chart>
<!-- The resolution order (CDR rule) must be explicit and documented. -->
```

## Consequences

- ✅ Generator AND human authoring ergonomics both covered.
- ✅ Diff-friendly when handwritten — one line per item, blame granularity intact.
- ✅ Rich children possible per CDR-002 (label can be a chip, value can be a link).
- ✅ Composes with CDR-006 — slot mode is a composition point.
- ⚠️ Two paths to test and document — handled by snapshot tests at parity.
- ⚠️ Resolution order must be explicit; ambiguity creates bugs.

## Validation

- **Lint rule (encoded):** `cec-validation-rules.md` R4 — collection components with a JSON-array prop MUST also accept slot children. Encoded as `rule_slot_alongside_json` in `validate.py`.
- **Snapshot tests:** identical data via JSON and slot mode must render identically (visual diff at parity).
- **Manual review checklist:** *"Does this collection component expose a JSON shape? Does it also accept slotted children? Are both modes shown in `examples.html`?"*

## History

- 2026-05-18 — Accepted as the canonical statement. Codifies the pattern that `ce-tabs` already exemplifies.
- Already partially encoded as R4 in `cec-validation-rules.md`.
