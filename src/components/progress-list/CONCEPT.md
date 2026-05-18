# `<ce-progress-list>` — design rationale

Per [ADR-008](../../../docs/adr/adr-008-component-concept-files.md). Captures decisions where ≥ 2 options were weighed.

## 2026-05-18 — Single tag vs dual-tag wrapper (CDR-006)

### Context

Plan v3 proposed a dual-tag design: `<ce-progress-list>` as the container with a mandatory `<ce-progress-item>` child wrapper around each `<ce-progress>`. This mirrors the `<ul>/<li>` HTML pattern.

Plan v4 dropped `<ce-progress-item>` in favour of direct `<ce-progress>` composition.

### Options weighed

| Option | API shape | Pros | Cons |
|---|---|---|---|
| A — dual-tag (v3 proposal) | `<ce-progress-list><ce-progress-item><ce-progress …/></ce-progress-item></ce-progress-list>` | Explicit semantics; easy to attach per-row metadata to the item wrapper | Extra tag authors must type; `ce-progress-item` adds no styling or semantics; hard-wraps the children (CDR-006 anti-pattern); blocks future `<p>`, `<ce-callout>` interleaving |
| B — single container, direct children (**chosen**) | `<ce-progress-list><ce-progress …/></ce-progress-list>` | CDR-006 compliant; arbitrary children compose in naturally; zero boilerplate; `<p>` and `<ce-callout>` interleave without a wrapper | Less "structured" — authors must know to use ce-progress directly; catalogued examples provide the canonical pattern |

### Decision

**Option B.** `ce-progress-list` is a pure flex-column container with a default slot that accepts any children. `<ce-progress>` rows are the canonical children, but `<p>`, `<ce-callout>`, `<a>`, and future typed renderers all render correctly. CDR-006: "components compose; no hard wrappers."

---

## 2026-05-18 — Grid vs flex layout (option a vs option b)

### Context

The brief proposed two layout strategies for aligning label and bar columns across multiple `<ce-progress>` rows:

- **(a) `display: grid` on the list + `display: contents` on each `<ce-progress>`** — would propagate the progress's label span and track div directly into the parent two-column grid, giving perfect cross-row label alignment.
- **(b) `display: flex; flex-direction: column` on the list** — each `<ce-progress>` is a full-width row; its internal label/bar alignment is handled by `<ce-progress>`'s own flex layout.

### Constraint

`ce-progress` renders with Shadow DOM (`createShadowRootWithStyles()`). Its internal `.ce-progress__label` and `.ce-progress__track` elements live inside the shadow tree. `display: contents` on a shadow host does not propagate shadow children into the parent's grid context in any current browser. Option (a) is therefore unviable without rearchitecting `<ce-progress>` as a light-DOM component — a CDR-008 additive-change risk outside this component's scope.

### Decision

**Option (b) — flex column.** The label-to-bar alignment is per-row (each `ce-progress` aligns its own label and bar). Cross-row label column alignment is not guaranteed by the container, but `ce-progress` uses `flex: 0 0 auto` on its label span, so rows that share the same natural label width will visually align. This is a conscious trade-off: clean composition wins over pixel-perfect cross-row alignment.

If cross-row alignment is needed in a future version, the path is: (1) make `ce-progress` light-DOM and emit explicit `label` + `track` elements, then (2) revisit option (a) here.
