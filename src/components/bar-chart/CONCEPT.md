# `<ce-bar-chart>` — design rationale

Per [ADR-008](../../../docs/adr/adr-008-component-concept-files.md).

## 2026-05-18 — Adding slot mode alongside JSON mode (CDR-005 + CDR-008)

### Context

`ce-bar-chart` shipped with `data: BarRow[]` JSON-on-attribute as its only collection interface. CDR-005 audit found low handwritten adoption because a JSON array string is hostile to humans: long one-liner, escaping, no per-item diff blame.

The component has ~6 existing consumers relying on the JSON API. CDR-008 prohibits breaking them.

### Options weighed

| Option | Shape | Pros | Cons |
|---|---|---|---|
| A — replace JSON with slot-only | Remove `data`, require `<ce-bar-row>` | Cleanest API surface | Breaks every existing JSON consumer; violates CDR-008 |
| B — slot-only, JSON kept but deprecated | Both present, JSON emits a console.warn | Additive short-term, migration path clear | Noisy for existing users; premature deprecation before slot adoption is confirmed |
| C — both modes, data takes priority (**chosen**) | Resolution order: data non-empty → use it; else iterate slot children; else empty state | Zero breakage; both authoring styles served; CDR-005 compliant | Two code paths to test; resolution rule must be documented clearly |

### Decision

**Option C.** Resolution order is explicit and documented in JSDoc, meta.json description, and CDR-005 `examples.html`. Both modes verified identical by snapshot tests.

### Reading slot children

Considered two observation strategies:

| Strategy | Timing | Supports streaming? |
|---|---|---|
| `connectedCallback` only | Once on connect | No — children added after upgrade are missed |
| MutationObserver on `childList + attributes` | Live | Yes — mdflow streams tokens into slots post-upgrade |

Chose **MutationObserver** per CLAUDE.md "Light components must keep slot streaming working". Observer watches `childList` and attribute changes on `["value", "color"]` so live updates to `ce-bar-row` children trigger re-render.

### Non-ce-bar-row children

Gracefully ignored — `rowsFromSlotChildren` filters by `tagName === "ce-bar-row"`. Other children pass through to light DOM unchanged (CDR-006). This allows narrative `<p>` or decorative elements as siblings without breaking the chart.

### Shadow DOM status

`ce-bar-chart` uses `createShadowRootWithStyles()` (Shadow DOM) because it relies on `:host([attr])` selectors (`compact`, `sparkline`, `gridlines`, `animated`). This predates this change and is preserved. The slot-children are read via `this.children` (light DOM parent element), not via a Shadow DOM slot assignment, so the Shadow DOM boundary does not interfere.
