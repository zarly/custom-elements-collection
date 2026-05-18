# `<ce-flow-step>` — design rationale

Per [ADR-008](../../../docs/adr/adr-008-component-concept-files.md). Captures non-trivial decisions where ≥ 2 options were weighed.

## 2026-05-18 — Render in parent vs render in child

### Context

`ce-flow-step` is a child element of `ce-flow`. The parent renders the connecting
arrows between steps and controls the layout direction (horizontal/vertical). A key
design question was: where does each step's box get rendered?

### Options weighed

| Option | Shape | Pros | Cons |
|---|---|---|---|
| A — Render in child | `ce-flow-step` renders its own `.ce-flow-step` card; parent adds arrows between them via CSS gap/pseudo-elements | Child is independently testable; simpler parent | Arrow placement between arbitrary children is fragile in Shadow DOM; parent can't easily inspect child internals for layout decisions; mixing Shadow-DOM scopes makes CSS coordination hard |
| B — Render in parent, child is data-only (**chosen**) | `ce-flow-step` renders `display:contents` (invisible) when nested; parent reads attrs + slot HTML via `querySelectorAll` and renders all step boxes itself | Identical code path for JSON and slot mode; parent controls full layout; matches the `ce-bar-chart` + `ce-bar-row` pattern already established in A.1/A.4 | Child needs a `connectedCallback` proximity check; slot HTML must be read as textContent for caption parity in the JSON snapshot |

### Decision

**Option B.** The parent-renders pattern (`ce-bar-chart` / `ce-bar-row`) was proven in
A.1 and A.4. It guarantees identical output for JSON and slot mode — the snapshot parity
test verifies this directly. `ce-flow-step` sets `display:contents` when nested and
renders a sensible standalone card when used outside `ce-flow`.

### Consequence

The snapshot parity test reads `.ce-flow-title` text and `.c-*` color classes from both
modes and expects them to match exactly. If the parent rendering pipeline drifts between
the two code paths, this test catches it.
