# CONCEPT — `ce-list`

_Created 2026-05-23._

---

## Why this component exists

`ce-nav-list` and `ce-checklist` both render vertical sequences, but each is bound to a specific domain (`<a>` anchors and checkboxes, respectively). Neither is usable as a generic "just space these items consistently" container. `ce-list` fills that gap: pure presentation, no semantic assumptions, any slot content.

---

## Option A — Shadow DOM (chosen)

Shadow DOM is required because `:host([dividers="…"])` selectors and `::slotted(*)` (with pseudo-class modifiers like `::slotted(*:not(:last-child))`) only work inside a shadow root. Without it, the host-attribute selectors would leak into the page and the `::slotted` pseudo-element is not valid in light DOM.

This is consistent with `ce-card` and `ce-nav-list`, which use `createShadowRootWithStyles()` for the same reason.

## Option B — Light DOM with data attributes

Would have required each item to carry a `data-ce-list-item` marker and rely on `[data-ce-list-item]:not(:last-child)` selectors in a `<style>` injected into the page. This was rejected because: (1) it pollutes consumer markup with internal housekeeping attrs, (2) `:last-child` in light DOM is affected by whitespace nodes in some browsers, and (3) it contradicts ADR-002's guidance that the `::slotted` / `:host` use case is the explicit reason to choose shadow DOM.

---

## No semantic role on the host (deliberate CDR-006 alignment)

`role="list"` was explicitly omitted. The ARIA spec requires that `role="list"` containers contain only `role="listitem"` children. Since `ce-list` accepts unrestricted slot content (cards, key-value rows, anchors, callouts, custom elements), imposing a list role would be incorrect for most real uses and could cause screen reader announcements that misrepresent the content.

Consumers who genuinely have a semantic list should add `role="list"` to the `<ce-list>` element and `role="listitem"` to each child. This is documented in `limitations` in the meta.

---

## Presentation policy per-list, not global (CDR-003 deviation, justified)

CDR-003 recommends that presentation policy live at the theme/document level rather than at each markup invocation. `ce-list` departs from this for `density` and `dividers` because:

- A single page routinely contains multiple lists with different densities (sidebar navigation vs. main content vs. data table preview). A global token cannot distinguish them.
- `density` and `dividers` are data-about-the-list (how many items fit, how strongly they're separated), not cosmetic brand decisions. They belong with the list, not the theme.

This deviation is documented per CDR-override protocol.

---

## v2 deferred: `data="[…JSON…]"` declarative rendering (CDR-005)

CDR-005 says collections should accept both a `data` array and slot children. This is the right long-term design — it lets LLM-generated markup skip the per-item element syntax and pass a JSON array instead. However:

- Without a built-in item template system, `data` rendering requires either (a) a hardcoded item shape, which conflicts with `ce-list`'s "accept any element" philosophy, or (b) a `<template>` + stamping mechanism that adds meaningful complexity.
- v1 is slot-only. This keeps the implementation trivial (`render()` returns a single `<slot>`), fully deterministic (CDR-009), and compositional (CDR-006).

When `data` is added in v2, the resolution order will be:
1. `data` JSON non-empty → stamp items from the array using a configurable template.
2. Slot children present → use them (current v1 behavior, preserved).
3. Neither → render empty state.

---

## `::slotted(*)` direct-child constraint

`::slotted(*)` only matches direct children of the host element. If a consumer wraps each item in an extra container (e.g., `<div slot="…"><ce-card>…</ce-card></div>`), the padding-block and border-bottom rules will apply to the wrapper, not the inner card. This is a CSS limitation, not a component bug. It is documented in the JSDoc and in `meta.limitations`.

---

## Density map

| value | token | approx px (at 4px base) |
|---|---|---|
| `comfortable` | `--ce-space-4` | 16 px |
| `cozy` | `--ce-space-3` | 12 px |
| `compact` | `--ce-space-2` | 8 px |

---

## `interactive` is visual only

The `interactive` attribute adds hover background (`--ce-state-hover`) and focus-visible outline to slotted items. It does NOT add `role`, `tabindex`, or event listeners. Clickability is not implied — the attribute is a signal to the theme that these items are meant to feel tappable. Consumers provide actual interactivity via anchors or buttons inside each item.
