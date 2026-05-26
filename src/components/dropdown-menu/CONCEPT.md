# `ce-dropdown-menu` — design concept and rationale

> Captures the *why* behind decisions in this folder. Not generated, not bundled, not part of the public API. Read before reopening a settled debate. Update when you make a new non-trivial design choice. See [ADR-008](../../../docs/adr/adr-008-component-concept-files.md) for the convention.

**Last substantive update:** 2026-05-23.

---

## What this component is for

`ce-dropdown-menu` is an **action menu triggered by a button**. The canonical use cases are row-action menus (edit/duplicate/delete), toolbar overflow menus, profile menus, and sort-by menus. The mental model is: *click a trigger → a list of discrete actions appears → pick one → list closes*.

This is distinct from:
- `ce-popover` — generic floating panel, no menu semantics, no keyboard nav pattern.
- `ce-select` — form input for choosing a value, not triggering an action.
- `ce-combobox` — filterable list, different ARIA pattern.

---

## Multi-element pattern rationale

The component ships as four custom elements in one file:

| Element | Role |
|---|---|
| `ce-dropdown-menu` | Parent: owns open/close lifecycle, positioning, keyboard nav, event emission. |
| `ce-menu-item` | Leaf: one actionable row. Carries `value`, `icon`, `tone`, `shortcut`. |
| `ce-menu-separator` | Visual divider. `role=separator`. |
| `ce-menu-group` | Labeled section. `role=group` + `aria-labelledby`. |

**Why not one element?** The ARIA APG menu pattern requires `role=menu` on the container, `role=menuitem` on each item, and `role=group`/`role=separator` for structure. These semantics are best expressed directly in the element's `connectedCallback` so consumers get correct a11y with zero configuration. A single-element design (all items via JSON attribute or slotted `<li>`) loses the explicit semantic per item and makes custom per-item properties (tone, shortcut) awkward.

**Why one file?** The four elements are always deployed together; splitting into four files would require four separate `defineOnce` calls in every consumer entry point and add friction with no benefit. A single import registers all four.

---

## Decisions

### D1 — Native Popover API (same as ce-popover)

See `ce-popover/CONCEPT.md §D1` for the full rationale. Short version: `popover="auto"` gives top-layer stacking, outside-click light-dismiss, and Escape handling for free. Custom overlays are fragile. `<dialog showModal()>` creates a focus trap which is wrong for a non-modal action menu.

`ce-dropdown-menu` deliberately does **not** depend on `ce-popover` as a component — consumers may not have loaded `ce-popover`, and the two components have divergent panel semantics (`role=dialog` vs `role=menu`). The Popover API calls and positioning algorithm are copied from `ce-popover` verbatim (same repo, same author — acceptable duplication).

---

### D2 — placement enum: 6 values (CDR-001 deviation)

CDR-001 says style enums SHOULD have ≤5 values and warns against vocabulary aliases.

The `placement` enum is a **coordinate space description** for the 2D anchor grid:

```
     top-start    top    top-end
     ┌────────────────────────┐
     │      trigger           │
     └────────────────────────┘
  bottom-start  bottom  bottom-end
```

Six values: two axes × three alignment variants (start/center/end). This is a subset of the 8-value enum used by `ce-popover` (which additionally supports `left` and `right`). Menu panels are almost always positioned on the vertical axis relative to their trigger, so `left`/`right` are omitted for a simpler surface.

The values encode geometry, not vocabulary — there is no semantic overlap between `top-start` and `bottom-end`. This is the same justification as `ce-popover §D3`.

**Deviation: CDR-001 — 6 values encode a closed 2D coordinate space, not a vocabulary alias set.**

---

### D3 — Keyboard navigation: roving tabindex

**Options considered.**

1. **`aria-activedescendant`** — one focused container, ARIA attribute points to the virtual current item. Avoids moving DOM focus. Common in `listbox` patterns.
2. **Roving tabindex** — the focused item has `tabindex=0`; all others have `tabindex=-1`. DOM focus moves with Arrow keys.

**Chose roving tabindex** for the following reasons:

- The ARIA APG [Menu Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) specifies roving tabindex for menus.
- Screen readers announce the currently focused item directly, without needing to interpret `aria-activedescendant`.
- Works correctly across shadow DOM boundaries: each `ce-menu-item` is a separate custom element; `aria-activedescendant` would require cross-shadow ID references, which is fragile.
- Disabled items are excluded from the roving tabindex pool (`_getItems()` filters `disabled` items before building the navigation ring).

---

### D4 — Event model: bubble up to parent vs. item emits own event

**Options considered.**

1. Each `ce-menu-item` emits its own `ce-menu-item-select` event, and `ce-dropdown-menu` listens for it.
2. `ce-dropdown-menu` listens for native `click` events that bubble up from `ce-menu-item`, reads the `value` attribute from the target, and emits `ce-menu-select`.

**Chose option 2** — parent listens to bubbled clicks. This avoids a custom event contract between sibling custom elements (which would require both to be loaded before the listener wires up). The native `click` event bubbles reliably across shadow boundaries via `composed: true` propagation. The parent's panel has a single `@click` handler that calls `closest("ce-menu-item")` to find the activated item and reads its `value`.

The emitted `ce-menu-select` event on the parent is the single stable API surface that consumers wire to.

---

### D5 — tone="danger": CSS tokens for red, not hardcoded hex

`tone="danger"` uses `var(--ce-color-red)` for text and `var(--ce-color-red-bg)` for hover background. No hex values in source — fully themeable. The parent's CDR-003 compliance (presentation policy global) means the red color is defined at the theme level, not per-instance.

---

### D6 — icon as string attribute (text fallback)

The `icon` attribute on `ce-menu-item` renders the string value as text inside a `.ce-menu-item__icon` span. This is intentionally a stub — it produces readable output in examples and tests without coupling the component to a specific icon library.

To integrate with an icon set (e.g. `ce-icon`, Phosphor, Lucide SVG sprites), replace the icon slot's content in the consumer or extend via CSS content. The string-to-icon mapping belongs at the consumer layer, not in this primitive.

---

### D7 — shortcut as visual hint only

The `shortcut` attribute renders a `<kbd>`-styled span on the right side of the menu item. It is **visual only** — the actual key binding must be wired by the consumer via `document.addEventListener("keydown", ...)` or equivalent. This component does not register keyboard shortcuts globally; doing so would create unpredictable global side effects from a UI primitive.

The `aria-label` on the shortcut span reads `"shortcut: E"` so screen reader users hear both the item label and its shortcut hint in sequence.

---

### D8 — Static-first (CDR-004)

Zero-attribute `<ce-dropdown-menu>` renders a closed, non-interactive placeholder. No listeners are attached until the user either sets `open` or a trigger is discovered. The menu opens only on explicit user action.

---

## CDR pre-flight summary

| CDR | Result |
|---|---|
| CDR-001 (style enum ≤5) | Deviation documented — 6 values for 2D coordinate space. |
| CDR-002 (typed values as children) | Compliant — `value` is a string id scalar on `ce-menu-item`. |
| CDR-003 (presentation policy global) | Compliant — `tone="danger"` reads `--ce-color-red` from the token layer. |
| CDR-004 (static-first) | Compliant — closed by default, stateful open is opt-in. |
| CDR-005 (collections: JSON + slot) | N/A — menu items are always slot children. |
| CDR-006 (composition) | Compliant — trigger slot accepts any clickable element. |
| CDR-007 (sensible defaults) | Compliant — `placement="bottom-start"`, `tone="default"`. |
| CDR-008 (additive only) | N/A — new component. |

---

## v2 deferred items

1. **Viewport overflow flip** — detect when the panel would clip the viewport and flip to the opposite placement.
2. **Icon slot** — add a named `icon` slot to `ce-menu-item` so a `<ce-icon>` or SVG can be slotted in instead of the text fallback.
3. **Checked / selected items** — `role=menuitemcheckbox` or `role=menuitemradio` for toggle-state menus. Not needed for the current action-menu scope.
4. **Submenu (nested)** — standard chevron-triggered nested panel. Deferred until a concrete consumer use-case justifies the complexity.
5. **CSS anchor-positioning** — once Baseline, replace JS positioning.
