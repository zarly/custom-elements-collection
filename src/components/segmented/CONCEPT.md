# CONCEPT: ce-segmented

_Added 2026-05-23. Covers the dual-tag pattern, CDR-005 slot/data duality, roving-tabindex strategy, and form-association approach._

## Why a separate component instead of ce-radio-group?

`ce-radio-group` already has a `segmented` variant. We create `ce-segmented` as a standalone tag for two reasons:

1. **Semantic narrowing.** The segmented control is always a compact joined-button row — there is no "classic" or "card" variant here. Callers who want just the segmented affordance shouldn't carry the variant-switching overhead of radio-group.
2. **Slot-child CDR-005 compliance.** `ce-radio-group` accepts options only via JSON `options[]`. The spec for `ce-segmented` requires both JSON (`data`) and slot children (`<ce-segment>`) — CDR-005. Adding that to radio-group would widen its API surface and conflict with its existing `options` / `variant` shape.

_Option considered and rejected: extend `ce-radio-group` with a `data` attribute alias and `<ce-segment>` children. Rejected: it conflates two different public APIs in one element and makes the segmented use-case drag in variant logic it doesn't need._

## Dual-tag pattern (CeSegmented + CeSegment)

`CeSegment` is a minimal data-bearing element. It renders nothing visible — its shadow template is empty. The parent reads `value`, `label`, and `disabled` from each child's attributes. This keeps the rendering logic in one place (the parent), avoids double-rendering, and lets the parent own roving tabindex entirely.

Both are defined in one file (`segmented.ts`) and registered with `defineOnce`. Consumers import from the same module entry.

## CDR-005: slot wins over data

When both `data` and slot children are present, slot children win. Rationale: explicit markup is a more intentional declaration than a JSON blob on an attribute. This allows incremental migration: start with a `data` JSON attribute (convenient for dynamic data), then replace with `<ce-segment>` children (richer markup, per-item icons, accessible hidden text) without changing the parent element.

Implementation: `_slotCount` is a `@state` that tracks how many `<ce-segment>` elements the slot has. The `#items()` method checks `_slotCount > 0` first; if yes, it reads from the slot. Otherwise it returns `this.data`.

## Roving tabindex strategy

Standard pattern for radiogroups (per ARIA authoring guide):
- Only **one** button has `tabindex=0` at any time; all others have `tabindex=-1`.
- Tab brings focus into the group to the `tabindex=0` button (selected, or first when none selected).
- ArrowRight / ArrowDown move selection **and** focus to the next; ArrowLeft / ArrowUp to the previous.
- Wrap-around at both ends (last → first, first → last).

Focus is moved programmatically after `updateComplete` so the DOM is guaranteed to reflect the new tabindex before `.focus()` is called.

## CDR-007: zero-value initial state

When `value` is empty, no segment is selected and no segment has `aria-checked="true"`. This is more honest than auto-selecting the first item — the parent form control records nothing, and the consumer knows the user has not made a choice. The first non-disabled segment receives `tabindex=0` so the group is keyboard-reachable.

Deviation from radio-group (which auto-falls-back to the first enabled option): radio-group's fallback is benign there because it only governs roving-tabindex, not the emitted value. Here we explicitly document that empty means "nothing selected".

## Form association

`static formAssociated = true` plus `ElementInternals.setFormValue` on every selection change. `attachInternals()` is called in `connectedCallback` with a try/catch for environments that don't support it (JSDOM in test — graceful fallback, not an error).

## Shadow DOM

The parent uses `createShadowRootWithStyles()` (ADR-002 exception path) so `:host([size="…"])` selectors and the CSS custom-property overrides work without bleed-through. `CeSegment` uses light DOM (inherits from `CecElement` default) since it renders nothing — there's no style isolation need.

## What was not done in v1

- Icon rendering: the `SegmentItem.icon` field is reserved in the type but not rendered. Adding it in v1 would require defining an icon-slot or icon-set convention that doesn't exist yet in CEC.
- `Home` / `End` keys: radio-group supports them; this component omits them to keep the keyboard handler minimal. Can be added additively (CDR-008).
- Vertical orientation: trivial CSS addition (CDR-008 safe).
