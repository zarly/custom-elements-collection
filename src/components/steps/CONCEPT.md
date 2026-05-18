# ce-steps — Design Concept

## CDR-005 resolution order

`ce-steps` implements the canonical dual-mode collection API (CDR-005):

1. **`data` JSON non-empty** → render ce-step elements inline from the array. This is the "generator output" path: compact, machine-friendly, zero hand-escaping.
2. **Slot children** → pass through; auto-number applied to ce-step children. This is the "handwritten markup" path: diff-friendly (one line per step), supports rich CDR-002 children in each step.
3. **Neither** → render the empty state with `role="status"`.

Both modes are designed to produce visually identical output for equivalent data — the same title, state, and auto-assigned n.

## Why `tier: layout`

`ce-steps` is a slot container with no intrinsic interactive state or fetching — it wraps children, applies layout (flex direction, gap), and manages auto-numbering. Per ADR-006's classification rule, this is a layout tier. Consequently, the `examples.html` file is optional but is included for catalog completeness since consumers often need to see how the container interacts with its children.

## Auto-numbering design

Auto-numbering is implemented by writing the `n` attribute directly onto `<ce-step>` child elements in `updated()`. This is a deliberate DOM side-effect (documented in `sideEffects` in meta.json). Alternatives considered:

- **Passing index via CSS counter** — can't set a text attribute.
- **Passing via `@property` on ce-step** — would require ce-step to know it is inside ce-steps (coupling violation).
- **Rendering a wrapper div with the number** — breaks ce-step's standalone shadow DOM design.

Writing the `n` attribute is the cleanest approach: ce-step reads its own `n`, doesn't care who set it.

The observer watches `childList` only on the direct parent (not subtree) to avoid over-triggering on ce-step internal renders. Attribute changes on `n`, `title`, `state` are observed so re-ordering or state changes cause a re-render.

## Non-ce-step children (CDR-006)

`ce-steps` does not filter slot children by tag. A `<p>` annotation, a `<ce-callout>` note, or a `<hr>` separator can all be dropped inside and will render. Only `<ce-step>` elements receive auto-numbering; everything else is left untouched. This matches the ADR-002 + CDR-006 composition principle.

## Direction enum (CDR-001)

`direction` is a 2-value style enum: `vertical` (default, stacks steps) and `horizontal` (flows in a row with wrapping). This drives only layout — not content. The decision to make it a per-instance attribute rather than a global CSS variable was deliberate: direction is structural (changes which axis the flex container uses), not a presentation aesthetic. CDR-003 (presentation policy is global) does not apply to layout axes.
