# `ce-radio-group` — design rationale

## One tag vs. parent + child tags

PLAN_NEXT.md proposed a `ce-radio-group` parent + `ce-radio` child pattern (mirroring native `<input type="radio">` + `<fieldset>`). After looking at it:

| Approach | Pros | Cons | Verdict |
|---|---|---|---|
| Parent + child tags | Mirrors native HTML; declarative composition; per-option markup is explicit | Two tags to maintain, two metas, two test files; option config split between attrs (value/label/disabled on child) and parent state (selected value); slot-handshake complexity | Rejected — splits state across the boundary, doubles surface |
| **Single tag with `options` prop** | One file, one meta; matches the precedent set by `ce-filter-bar`; LLM authors get a single-tag JSON-data shape they can copy | No declarative HTML for individual options (must use JSON) | **Chosen** |

The single-tag pattern matches the existing codebase precedent (`ce-filter-bar`, `ce-toc`, `ce-checklist` all take options arrays), keeps state ownership in one place, and gives LLM code-generators a single-tag-with-JSON shape that's easy to reason about. The string-props rule (CONTRIBUTING §5) means the JSON works as an attribute too.

## Why three variants instead of separate tags

The user explicitly asked: "Check if we can merge ce-radio with some button-like radio, or add style to it like 'classical', 'radio', other?"

Options considered:
1. **Three separate tags** — `ce-radio-group`, `ce-segmented-control`, `ce-radio-cards` — different ergonomics, identical behavior
2. **One tag, `variant` attr** — `<ce-radio-group variant="segmented">` swaps the visual treatment

Picked (2). Reasoning:
- All three variants share the **same data shape** (single-select among N options), the **same a11y semantics** (radiogroup + radio + roving tabindex), and the **same event contract** (`ce-change`).
- The only difference is paint. CSS variants are exactly what `:host([variant="…"])` selectors are for.
- Three tags would force consumers to learn three APIs that are 95% identical.
- One tag with a variant attr means an LLM author who picks the wrong variant for the context (e.g. "card" for a 5-option list with no hints) can flip it with a one-attribute change.

The three variants:

- **classic** — radio circle + label, inline. The default. Closest to native `<input type="radio">`.
- **segmented** — joined-button group, à la iOS / macOS segmented control. Useful when the options are short, mutually exclusive, and worth surfacing as a primary control (view modes, theme switches, time ranges).
- **card** — option-as-card with optional `hint` text below the label. Useful for high-stakes choices where the user benefits from descriptive context (pricing tiers, plan selection, notification preferences).

## Why a single options[] and not slot children

Slot children (e.g. `<ce-radio value="x" label="X">`) would let consumers compose with arbitrary inner markup, but:
- Each variant needs different inner markup (segmented = no circle, card = circle + hint). That means the inner `<ce-radio>` would need its own variant prop, which has to stay in sync with the parent.
- Slot-based pickup is finicky: the parent has to inspect distributed children, listen for changes, and rerender. That's a lot of code for a use case (custom HTML inside an option) that the `hint` prop already covers.
- The string-props JSON path works in plain HTML, no script needed (CONTRIBUTING §5).

If a consumer truly needs custom rendering, they can drop down to `ce-filter-bar` (chip-pill style with multiple-select) or compose buttons by hand.

## Roving tabindex, not full keyboard exposure

Each option button has `tabindex=0` only when it's the current selection (or the first non-disabled option if nothing is selected). The rest are `tabindex=-1`. This matches the WAI-ARIA radiogroup pattern: Tab lands on the group, arrow keys move within it, Tab leaves the group entirely.

Implementation: `#currentIndex()` resolves what "current" means at render time. Selection-change triggers a re-render; we use `updateComplete.then(() => this.#focusOption(next))` to focus the new node after Lit reconciles the DOM. Doing this synchronously during the keydown handler would focus the *previous* DOM tree.

## Skip vs. block disabled options

Arrow keys *skip* per-option-disabled options entirely. Group-level `disabled` blocks all interaction (including arrow keys, since clicks are gated on `this.disabled`). This matches the native fieldset/legend disabled cascade.

## What's NOT in this component

- **Form association via `ElementInternals`.** `ce-rating` does form-association; this one doesn't yet. Open question: do we want the radio to participate in `<form>` and `FormData`? Current consumers use the `ce-change` event + reactive state. v0.5+.
- **Indeterminate state.** Radios are single-select; there's no semantic for "no preference". An empty `value` already represents that.
- **Multi-select.** Use `ce-filter-bar multiple` instead.

## Stability rationale

Marked `experimental` until:
1. We see whether the three variants cover real demand or whether one (likely `segmented`) becomes the canonical pattern and the others are removed.
2. The form-association question lands.
3. We decide whether the `card` variant should accept slotted media (an icon, a small chart) instead of just a text hint.
