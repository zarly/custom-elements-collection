# ce-step — Design Concept

## Standalone-vs-nested duality

`ce-step` is designed to work in two modes without any behavioral branching inside the component itself:

1. **Standalone** — dropped directly into a page or a `<ce-card>`. The `n` attribute drives the disk display; no parent needed.
2. **Nested in `<ce-steps>`** — the parent container observes its `<ce-step>` children via `MutationObserver` and, when `auto-number` is enabled, sets `n` on each child that lacks it. `ce-step` does not need to know it is nested; it just reads its own `n` attribute.

This avoids any `connectedCallback` "am I inside ce-steps?" detection, which would create a hard coupling between sibling components (CDR-006 violation). The parent writes; the child reads.

## Why `state` is a 3-value enum

CDR-001 caps style enums at ≤ 5 canonical values. The corpus shows exactly three meaningful visual states for a process step:

- `pending` — not started; neutral disk.
- `active` — currently in progress; highlighted disk + bold title + `aria-current="step"`.
- `done` — completed; green disk + check icon + visually-hidden "Completed:" for screen readers.

Expanding to `skipped`, `blocked`, `failed`, etc. was considered and rejected: those are domain vocabulary words, not style primitives. Callers needing those signals should compose with a `<ce-chip>` in the description slot (e.g. `<ce-chip type="red">Blocked</ce-chip>`), keeping the step's own API minimal.

## Why Shadow DOM for ce-step

`ce-step` uses Shadow DOM because `:host([state="active"])` selectors are needed to drive disk color via CSS custom properties scoped to the host. Light DOM would require per-element inline styles or class manipulation — more JS, less CSS. The slot channels (default, title, meta) remain open per ADR-002's intent: Shadow DOM is the exception chosen specifically for `:host()` selectors.

## `has-n` attribute approach

Lit doesn't support `v-if` on `:host()` pseudo-class for property-derived CSS; instead a synthetic `has-n` attribute is toggled in `willUpdate()` so CSS can express `:host(:not([has-n])) .ce-step__disk { display: none }`. This is simpler than binding inline `display` style from the render method.

## Visually-hidden "Completed:" pattern

`state="done"` adds `<span class="sr-only">Completed:</span>` before the title slot. This uses the standard clip/overflow pattern (not `display:none`) so screen readers announce it. The check mark in the disk is `aria-hidden="true"` on the disk element — its semantic meaning is conveyed by the sr-only text instead.
