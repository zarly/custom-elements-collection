# `ce-tabs` — design rationale

## The "head integration" decision

The user's directive: *"For tabs we already have head, please integrate."*

Inventory of existing head-like patterns in the codebase:

| Component | Pattern | Reusable? |
|---|---|---|
| `ce-filter-bar` | Chip-pill row with `aria-pressed` toggles | ✅ Visual style is exactly the tab strip we want |
| `ce-toc` | Flat / numbered link list | ❌ Different mental model (anchored navigation) |
| `ce-nav-list` | Internal docs nav | ❌ Internal-only |
| `ce-feature-card` etc. (`head` slot in their meta) | Header *region* of a single component | ❌ Region, not strip |

`ce-filter-bar` is the right family. Three integration paths considered:

1. **Composition** — `ce-tabs` includes a `<ce-filter-bar>` instance inside, listens for `ce-filter-change`, drives the active panel.
2. **Subclass** — `CeTabs extends CeFilterBar`, override the event semantics.
3. **Shared visual treatment** — copy the chip-pill CSS into ce-tabs's shadow root; the two components are visual siblings.

Picked (3). Reasoning:

- (1) creates a runtime dependency between two tags. If a consumer ships `ce-tabs` they pull `ce-filter-bar` too — a small win for them, but also means a regression in `ce-filter-bar` ripples into `ce-tabs`. Brittle.
- (2) is unidiomatic for Lit and locks API surface. `ce-filter-bar` uses `aria-pressed` (toggle button); `ce-tabs` uses `aria-selected` (tab). Different semantic role on the same DOM element doesn't subclass cleanly.
- (3) gives the user the "same family" look without the coupling. A theme-level update to the chip-pill style means touching two files (or extracting to a shared CSS partial later — out of scope for this PR).

The CSS values that match between the two are: `border-radius: var(--ce-radius-pill)`, the `--ce-surface-2` idle / `--ce-color-blue` active background swap, and the `var(--ce-text-sm)` font size. If we extract them to a single mixin later, both components benefit; until then the duplication is minor (one rule block).

## Two input shapes (LLM-tolerance)

Per ADR-009, components designed for LLM authoring should accept multiple input shapes when ergonomically cheap. Tabs is exactly the case:

- **Prop-based:** `tabs='["A","B","C"]'` + N panel slots. The LLM-friendly path — drop in a JSON array of labels and the panels.
- **Slot-based:** `<button slot="tab">…</button>` × N + N panel slots. The richer-markup path — when a tab needs an icon, a `<span>` with custom inner formatting, or anything beyond text.

The component flips modes automatically: if `tabs.length === 0`, it queries `slot=tab` children and uses those instead. There's no explicit `mode` flag — the data shape decides.

Edge case: what if both are provided? The prop wins (prop-based mode renders chips; the `slot=tab` content is ignored). Reasoning: the prop is more explicit, and a consumer who provides both probably meant the prop and forgot to remove the slot fallback.

## TabItem.badge — small affordance, big payoff

The prop accepts either strings or `{ label, badge?, disabled? }`. The badge slot covers the most common rich-tab use case (Inbox count, "new" markers) without making the consumer drop down to slot-based mode just for one number.

The badge style — pill background + tabular-nums — matches the `ce-stat-group` and `ce-counter` patterns in the codebase. When the tab is active the badge inverts to a translucent overlay so it stays readable on the blue background.

## A11y: reapplying roles to slotted children (slot-based mode)

When the consumer provides slot=tab buttons, we set `role=tab`, `aria-selected`, `tabindex`, and event handlers on each one — but we have to do this from the parent's JS, since the slotted children live in light DOM. The `_ceTabsBound` flag prevents double-binding when the slot re-flattens (slotchange fires more than once during initial connection in some browsers).

The same applies to panels: every `[slot=panel]` child gets `role=tabpanel`, `id`, `aria-labelledby`, and `hidden` (when not active). Panels are styled via `::slotted([slot=panel][hidden])` to enforce `display: none !important` even if a consumer's CSS tries to override it.

## Vertical mode

`vertical` swaps two things:
1. `aria-orientation="vertical"` on the tablist (assistive tech announces the change).
2. Arrow-key axis: ArrowUp/Down replace ArrowLeft/Right.

The visual layout becomes a 2-column grid (head | body) instead of stacked. We don't switch to a different chip shape — same pills, just stacked vertically.

## What's NOT in this component (deferred)

- **Lazy panel loading.** Some consumers want to avoid rendering inactive panel content until first activation. Today, panels are just `hidden` — they're still in the DOM. If this becomes a real concern, we add a `lazy` attr that skips rendering inactive children. For now, hidden + display:none is enough.
- **Closeable / addable tabs.** Out of scope for v1. Would need different events (`ce-tab-close`, `ce-tab-add`), a close button affordance, and a model for state. Kick to v0.6.
- **Animated indicator.** A bottom-border indicator that slides between active tabs is nice but ~50 lines of position math + ResizeObserver for what is essentially decorative motion. The chip background-flip already shows active state clearly. Pass.
- **Routing integration.** Some libraries auto-sync tab state with URL hash. We emit `ce-tab-change`; the consumer can wire that to history.pushState if they want. Routing is not a component-library concern.

## Stability rationale

`experimental` until:
1. We see whether the dual input shape (prop vs slot) confuses consumers in practice or is the right call.
2. We get feedback on whether `vertical` mode needs a width-hint prop or whether grid auto-sizing is enough.
3. We decide whether the badge should be a slot instead of a string (richer formatting) once we see real use.
