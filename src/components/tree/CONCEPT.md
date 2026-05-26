# CONCEPT — `ce-tree` / `ce-tree-node`

**Created:** 2026-05-23
**Stability:** experimental

---

## Why two elements?

`ce-tree` (root) and `ce-tree-node` (item) are separate custom elements rather
than one. The split maps directly to the ARIA tree pattern, which distinguishes
the `tree` role (the container that owns keyboard navigation) from the
`treeitem` role (each focusable item). It also enables recursive nesting in
plain HTML without any JavaScript — a consumer writes:

```html
<ce-tree>
  <ce-tree-node label="parent">
    <ce-tree-node label="child"></ce-tree-node>
  </ce-tree-node>
</ce-tree>
```

The alternative — a single `ce-tree` that recursively renders its own children
— would have required either a data-only API (no slot composability) or
fragile `querySelectorAll` on light-DOM children without clear ownership.

---

## Slot mode vs data mode (CDR-005)

**Option A — data only:** simpler keyboard-nav code; ARIA positions computed in
one pass over a plain array; easier to serialize.

**Option B — slot only:** streaming-friendly (tokens stream into slot nodes
live); composable label content (you can put a `<ce-badge>` inside a label).

**Decision:** both, per CDR-005. The `data` attribute wins when non-empty; slot
children are used otherwise. The rule is evaluated once: when `data.length > 0`
the tree renders virtual nodes into shadow DOM; when `data` is empty (the
default) the tree renders a bare `<slot>` and relies on slotted `ce-tree-node`
children.

The cost of duality is one branch in `#allNodesInDom()` and `#directNodeChildren()`.
This is acceptable given the large ergonomic benefit — both LLM code-gen (data)
and streaming text (slot) scenarios are first-class.

---

## `default-expanded` enum (CDR-001 pre-flight)

The spec defines 6 values: `all | root | none | depth-1 | depth-2 | depth-3`.

CDR-001 says "style enum is finite (≤5 values); content vocabulary lives in
slots." Six values exceeds the soft cap by one. Justification: these are not
content aliases (vocabulary) — they are depth-scale operands on the same axis
(how far to expand on startup). The same reasoning that exempts `ce-stack`'s
`space` enum from CDR-001 applies here: a linear scale with named breakpoints
is a size/depth dimension, not a vocabulary.

If more granularity is needed in the future the `depth-N` pattern extends
naturally; this is an additive change per CDR-008.

---

## Expand state lives on the node (CDR-004: static-first)

The `expanded` attribute on `ce-tree-node` is the source of truth. `ce-tree`
never maintains a parallel expand-state map. The tree's `default-expanded`
attribute is a **startup directive** — it fires once in `firstUpdated` and sets
`expanded` on the appropriate nodes. After that the user's interactions
(clicks, keyboard) directly mutate `node.expanded`. This keeps the state graph
simple and serializable: a snapshot of `aria-expanded` values on the DOM fully
describes the open/closed state.

---

## Roving tabindex vs `aria-activedescendant`

**Option A — roving tabindex:** each node has `tabindex="-1"` by default; the
focused node has `tabindex="0"`. ArrowDown/Up shift the `tabindex="0"` token.
This works in all browsers, including those where `aria-activedescendant` has
patchy screen-reader support on shadow-DOM elements.

**Option B — `aria-activedescendant`:** the tree root holds focus permanently;
`aria-activedescendant` on the root points at the "focused" node by ID. This
requires all nodes to have globally unique IDs and works poorly across
shadow-DOM boundaries in some browser/AT combos.

**Decision:** roving tabindex (Option A). It is the ARIA authoring practices
recommendation for trees, and it does not depend on globally unique IDs.

---

## Keyboard semantics

Follows the [ARIA Tree View Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/):

| Key | Behavior |
|---|---|
| ArrowDown | Next visible node (skip hidden subtrees) |
| ArrowUp | Previous visible node |
| ArrowRight | Expand collapsed node; or move to first child when already expanded |
| ArrowLeft | Collapse expanded node; or move to parent node when collapsed/leaf |
| Home | First visible node |
| End | Last visible node |
| Enter / Space | Toggle expand on the focused node (handled by `ce-tree-node`) |

"Visible" is computed fresh on each keypress by walking the DOM in tree order
and skipping subtrees whose parent is collapsed. This is O(n) but trees are
short in practice; caching would add complexity for little gain.

---

## ARIA `aria-setsize` / `aria-posinset`

Both are computed by `ce-tree` on every toggle and on first render. The
computation walks the tree, calling `node.setAriaPosition(level, setsize,
posinset, hasChildren)` on each node. The node stores these as internal state
and reflects them to attributes in `updated()`.

Leaf nodes (`!hasChildren`) have `aria-expanded` removed (per ARIA spec: only
expand/collapse nodes carry this attribute).

---

## Connector lines (`:host-context`)

The `lines` boolean adds the class `ce-tree--lines` to the `ce-tree` host.
`ce-tree-node`'s shadow stylesheet uses `:host-context(.ce-tree--lines)` to
conditionally draw a left border on the children container. This is a standard
CSS context query and avoids passing a prop deep into each node.

`:host-context()` is now Baseline 2024 (shipped in all major browsers).

---

## No animation in v1

Expand/collapse is instant. CDR-009 (deterministic DOM) encourages CSS-only
animation where needed, and the natural approach would be a
`max-height: 0 → auto` transition or a View Transitions API call. Both are
deferred to a v2 pass to keep the initial implementation reviewable.

---

## Shadow DOM for both elements

Both `ce-tree` and `ce-tree-node` use shadow DOM (`createShadowRootWithStyles()`).
This is justified by:

1. `ce-tree-node` needs `:host([expanded])`, `:host([disabled])`,
   `:host(:focus-visible)` selectors — impossible in light DOM.
2. `ce-tree` needs `:host([lines])` and `:host([dense])` attribute selectors.
3. The children group (`role="group"`) is rendered inside the node's shadow DOM
   to keep the expand/collapse `[hidden]` attribute scoped.

Light DOM is still the composition channel: slotted `ce-tree-node` children
flow through the node's default `<slot>`.
