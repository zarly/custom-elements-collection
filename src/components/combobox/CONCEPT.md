# `ce-combobox` — design concept and rationale

> Captures the *why* behind decisions in this folder. Not generated, not bundled, not part of the public API. Read before reopening a settled debate. Update when you make a new non-trivial design choice. See [ADR-008](../../../docs/adr/adr-008-component-concept-files.md) for the convention.

**Created:** 2026-05-23.

---

## What this component is for

A **filterable combobox** — the most complex form primitive in the library. It combines a text `<input>` with a popup listbox so users can either pick from a predefined set or (when `allow-custom` is set) type free-form text.

Target use-cases: country pickers, assignee selectors, currency/locale choosers, "send to" recipient fields. These share one characteristic: the option set is too long for a plain `<select>` but still bounded enough that a filter is more helpful than full free-text.

Sibling `ce-select` continues to cover the short-option case (≤10 items, no filtering needed).

---

## Decisions

### D1 — Filter strategy: case-insensitive substring, not fuzzy

**Question.** Should the filter use substring match, fuzzy match (e.g. fuse.js), or prefix match?

**Options considered.**

1. **Prefix match.** Fast, familiar from browser native `<datalist>`. Breaks for queries like "dollar" when the label is "US Dollar" (prefix is "US").
2. **Substring match, case-insensitive.** O(n·m), deterministic, zero config. "eur" matches "Euro", "German", "EUR". The correct default for typed labels.
3. **Fuzzy match.** Best recall. Adds complexity, non-determinism, and a scoring dependency. Hard to explain to users ("why is 'eur' matching 'Brazilian Real'?").

**Chose 2.** Substring match is deterministic and covers the real use-cases (typing the middle of a country name). Fuzzy match is a v2 upgrade when a concrete caller demands it. Noted in limitations in `combobox.meta.json`.

---

### D2 — Dual-form (CDR-005): `data` attribute vs `<ce-option>` slot children

**Question.** Should options come from a JSON attribute, from slotted children, or both?

CDR-005 mandates the dual-form for collection components. The question is what the slot child element should be.

**Options considered.**

1. **Native `<option>` elements (like `ce-select`).** Already familiar, usable in forms. Problem: native `<option>` renders and participates in CSS without a custom element definition, making `display:none` hiding brittle. Also, `<option>` has no `group` attribute (uses `<optgroup>` parents instead), which complicates the slot-read API.
2. **Custom `<ce-option>` element.** Fully controlled. Can carry `value`, `label`, `disabled`, `group` as flat attributes without nested wrappers. Shadow DOM with `display:none` hides it cleanly from layout.
3. **JSON array only (`data` attribute).** Simpler implementation. Breaks CDR-005 and excludes static HTML authoring.

**Chose 2 + 3 (dual form with `<ce-option>`).** `<ce-option>` gives a cleaner API (flat `group` attribute vs nested `<optgroup>`), pure hiding, and no collision with the native form system. The combobox reads `CeOption` instances at `slotchange` time and converts them to the internal `ComboboxOption` model.

**Fallback for unupgraded `<ce-option>`.** The slot reader also handles the case where `<ce-option>` is not yet defined (reads raw attributes on `HTMLElement`). This prevents blank option lists if the definition order is inverted.

---

### D3 — ARIA: combobox pattern vs native `<select>` + `<datalist>`

**Question.** Why not use the native `<input type="text" list="…">` + `<datalist>` pattern?

**Options considered.**

1. **Native `<datalist>`.** Zero ARIA wiring needed. But: OS-controlled UI (inconsistent across platforms), no grouping, no custom rendering, can't intercept positioning, no `allow-custom=false` enforcement (browser always accepts typed values).
2. **ARIA combobox pattern (WAI-ARIA 1.2).** Full control. Requires correct wiring: `role="combobox"` on input, `aria-expanded`, `aria-controls` (id of listbox), `aria-activedescendant` (id of highlighted option), `role="listbox"` on panel, `role="option"` + `aria-selected` + `aria-disabled` on items.

**Chose 2.** The requirements mandate `allow-custom=false` enforcement (reject garbage input) and visual grouping. Only the ARIA pattern gives both. The wiring is mechanical and fully implemented.

**`aria-autocomplete="list"`** (not `"inline"` or `"both"`): the input only shows the dropdown list as autocomplete; it does not inline-complete the typed text. This matches the intended UX where the user types to filter, not to auto-fill.

---

### D4 — Focus management

**Question.** Where does focus live: always in the input, or does it move into the listbox?

**Options considered.**

1. **Focus stays in the input.** Arrow keys navigate the highlighted option via `aria-activedescendant`; focus never moves to the listbox DOM. Screen readers announce the active option through the `aria-activedescendant` attribute, not through actual DOM focus.
2. **Focus moves into listbox options.** Each option becomes focusable. More natural for keyboard-only users. Costs: complex focus-return logic, harder blur detection, two different tab stops.

**Chose 1.** The WAI-ARIA 1.2 combobox pattern (without list autocomplete focusing) keeps focus in the input throughout. `aria-activedescendant` carries the screen-reader announcement. This simplifies blur detection (one element to watch) and avoids a complex focus-return path on Escape.

**Mousedown preventDefault on listbox.** The listbox sets `@mousedown=${e => e.preventDefault()}` to prevent the input from losing focus when the user clicks an option. Without this, `blur` fires before `click`, closing the listbox before the click lands.

---

### D5 — Highlighted vs selected distinction

Two separate concepts are tracked:

- **Highlighted** (`_highlightedIndex`): the option visually focused via arrow keys, shown with `option--highlighted` class and referenced by `aria-activedescendant`. Transient — resets on close.
- **Selected** (`value`): the committed form value. Shown with `aria-selected="true"` and a ✓ check mark. Persists after close.

On open, the component sets the highlighted index to the currently selected option (or the first option if none selected). On close, the input text is restored to the selected label — not the filter text.

---

### D6 — `allow-custom` semantics

**Question.** When `allow-custom` is true and the user types text that doesn't match any option, what is committed?

**Options considered.**

1. **value = label = typed text.** Simple. The form receives the typed string.
2. **value = typed text, label = separate field.** More complex; needs a second event detail. But `value` and `label` are the same thing for custom entries.
3. **Reject unless matched.** `allow-custom=false` default behavior.

**Chose 1 for `allow-custom=true`**: the typed text becomes both `value` and `label`. This is documented in `limitations` in the meta. If a caller needs separate value/label for custom entries, they must post-process in their `ce-change` handler.

`allow-custom=false` (default): if the user types text and presses Enter with no highlighted option in the filtered list, the combobox does nothing. The input text reverts to the committed value's label when the listbox closes.

---

### D7 — Native Popover API for the listbox

The listbox uses `popover="manual"` (like `ce-popover`). This places it in the browser's top layer, escaping `overflow:hidden` and `z-index` stacking contexts in the page. The component owns open/close via `showPopover()`/`hidePopover()` calls gated on keyboard and click events.

`"manual"` (not `"auto"`) is used because the component owns the dismiss logic: Escape, blur, click-outside, and Tab all route through the component's handlers. `"auto"` would let the browser dismiss on outside-click, but also on clicks inside the combobox host, which would fight the input's focus handling.

jsdom does not implement the Popover API. Tests mock `showPopover`/`hidePopover` and patch `matches(":popover-open")` to a synthetic attribute. The component already wraps both calls in `try/catch` for safety.

---

### D8 — Positioning math (JS, not CSS anchor-positioning)

Same approach as `ce-popover`: `getBoundingClientRect()` + `position: fixed` on the listbox. CSS anchor-positioning (`anchor-name`, `position-anchor`) is Baseline 2024 and not yet shipped in Firefox stable as of 2026-05-23. Deferred to v2 for the same reason `ce-popover` deferred it.

The combobox adds one refinement over `ce-popover`: **flip-above** logic. If there is not enough room below the field, the listbox opens above it. This is critical for comboboxes near the bottom of the viewport (e.g. in table rows).

---

## Open questions / deferred

- **Fuzzy match.** D1 chose substring. Add as a `filter-mode="fuzzy"` attribute in v2 when a concrete caller needs it.
- **Multi-select.** Single-selection only. A separate `ce-multi-combobox` should be its own component (CDR-001: finite enum, CDR-010: same data, multiple views).
- **Virtualization.** For very long lists (>500 options), virtual rendering would avoid DOM cost. Not implemented in v1 — add a `virtual` boolean attr when the use-case appears.
- **CSS anchor-positioning.** Replace JS positioning in v2 when Firefox ships the spec.
- **Touch tooltips for group labels.** Group headers are visual-only (no ARIA grouprole). Consider `role="group"` + `aria-label` wrapping in v2 if audit shows screen-reader confusion.
