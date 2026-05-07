# `ce-gauge` — design concept and rationale

> Captures the *why* behind decisions in this folder. Not generated, not bundled, not part of the public API. Read before reopening a settled debate. Update when you make a new non-trivial design choice. See [ADR-008](../../../docs/adr/adr-008-component-concept-files.md) for the convention.

**Last substantive update:** 2026-05-07.

---

## What this component is for

A **half-circle dial** that visualises one numeric value relative to a fixed range, with optional target marker. It is the dashboard idiom for *"how close am I to a goal / threshold?"* — single value, single range, at-a-glance read.

Sibling shapes intentionally split off:
- `ce-progress` — linear bar, used when the value is a fraction of an explicit task (download, upload, multi-step form). Visual implies "progressing toward completion."
- `ce-donut` — full ring, used for parts-of-a-whole composition (multi-segment). Different mental model.

Adding ranges, segments, multi-needle, or animated sweeps to `ce-gauge` would push it into a different category. Build a separate component instead.

---

## Decisions

### D1 — Why two visual elements (filled arc + tick mark)?

**Question.** A gauge could show only the value (one arc). Why also a tick?

**Options considered.**
1. Value-only arc. Simplest. Communicates "where I am" but not "where I want to be."
2. Value arc + target tick. Standard dashboard idiom — Tableau, Power BI, ECharts, Stephen Few's bullet charts all do this.
3. Two-arc design (filled value + faded target arc). Visually heavy; the comparison is cluttered.

**Chose 2 — value arc + target tick, target optional.** Adds the *"vs. goal"* dimension at low visual cost. The tick is opt-in via the `target` attribute, so users who only need the single-value view get a clean dial.

**Consequence.** Examples must include at least one *without* `target` so contributors don't think the tick is mandatory. (Authoring lesson learned 2026-05-07.)

---

### D2 — Why is the empty area shown (track always visible)?

**Question.** Is the unfilled portion of the dial drawn at all?

**Options considered.**
1. No track. Only the colored fill arc renders. Looks clean at mid-range values but at 5% the gauge is "a colored dot" and at 95% it's "a near-solid arc with no scale context." Loses the *gauge* affordance.
2. Track always visible, low contrast. Dial outline is always present so the shape reads as a gauge regardless of value.
3. Track only when target is set. Inconsistent — same component, different visual grammar. Confusing.

**Chose 2.** The track is the affordance — it tells the eye *"this is a scale, the colored part is your position on it."* Without it, low and high values lose their meaning at a glance.

**Implementation note.** Track stroke is `var(--ce-surface-3)` not `var(--ce-surface-2)`. The latter has near-zero contrast against `--ce-surface` (card background) — looked correct in code but invisible in practice. **Fixed 2026-05-07** after a contributor pointed out the gauge "didn't look like a gauge" at extreme values.

---

### D3 — How is the target tick disambiguated for users?

**Question.** A first-time viewer sees a colored arc plus a small black mark in *some* gauges and asks "what's that mark?"

**Options considered.**
1. Native SVG `<title>` element. Browser shows OS tooltip on hover. ~5 LOC. Free screen-reader support. No JS, no positioning logic. Limits: ~1s hover delay, OS-controlled styling, no touch.
2. Custom HTML tooltip (positioned popover). Pretty, instant, branded. Costs: portal/positioning logic, mobile interaction story, focus management, ~80 LOC, a11y wiring.
3. Always-visible inline label (e.g. `target 80` next to the value). No interaction needed. Costs: visual clutter, layout complexity in compact sizes (`size=96`).
4. Visible mini-label near the tick itself. Direct annotation. Costs: layout fragility when the tick is near the dial edge.

**Chose 1 — native `<title>`, layered with improved `aria-label`.** The brick-tier component lives inside larger dashboards; it should not own a tooltip-positioning concern. The native `<title>` covers hover, screen-readers, and dev-tools inspection at near-zero cost. Touch users are deliberately under-served — that is acceptable for a brick. Upgrade to option 2 if usage data shows the target is the primary read on touch.

**Layering.**
- `<svg>` carries `<title>` with `"<label>: <value> of <max> (target N)"` — full context.
- The tick `<line>` carries its own `<title>` with `"Target: N"` — direct disambiguation when hovering the mark.
- `aria-label` on the `<svg>` matches the title text — screen readers announce the same string.

---

### D4 — Why semantic colors (`green / amber / red`) are author-chosen, not auto-derived from value?

**Question.** Some gauge libraries auto-color: green if `value ≥ target`, amber if close, red if far. Should we?

**Options considered.**
1. Author-chosen color (`color="amber"`). Explicit. Caller knows the domain semantics — `28% free disk` is bad, `28% CPU load` is good. Same number, opposite meaning.
2. Auto-color from `value` vs `target`. Smart-feeling. But couples the visual to a single comparison rule (value ≥ target = good) which is wrong for inverted metrics like `latency` or `error_rate`.
3. Author-supplied threshold ranges (`thresholds='[{value: 50, color: "amber"}, ...]'`). Most flexible. Costs: prop complexity, doc burden, JSON-on-attribute, edge cases when ranges overlap.

**Chose 1.** A brick should not embed domain logic. Direction-of-good is a property of the metric, not the gauge. Option 3 is a fine future extension if a real use-case shows up.

---

### D5 — Why Light DOM is *not* used here (Shadow DOM via `createShadowRootWithStyles`)?

**Question.** Repo default is Light DOM (ADR-002). This component overrides it.

**Why.** The component uses `:host([color="green"]) .fill { stroke: var(--ce-color-green); }` to map the `color` attribute to fill stroke. `:host([attr])` is a Shadow-DOM-only selector. Without Shadow DOM the attribute mapping would have to move to JS or to global CSS keyed off the tag, both worse trade-offs.

**Consequence.** Slot streaming (mdflow) considerations don't apply — this component has no slots, only an attribute API. Fine.

---

## Edge cases (covered by tests)

| Case | Behavior | Test |
|---|---|---|
| `value < min` | Clamped to 0% fill | `clamps value above max…` (mirror) |
| `value > max` | Clamped to 100% fill | `clamps value above max-pct` |
| `value == 0` | No fill arc rendered; track only | `does not render fill arc when value=min` |
| `value == 100%` | Fill covers track; both have rounded caps so endpoints align cleanly | covered visually in `examples.html` |
| `min == max` | `#pct()` returns 0; no fill; track + value text still render | implicit |
| `target` outside `[min, max]` | Clamped to range | implicit (uses same clamp helper) |
| `target == value` | Both render at same angle; tick draws on top of fill | acceptable — visually still readable |
| no `target` | No tick rendered; tooltip omits target context | `omits target from tooltip when no target is set` |
| no `label` | Only the numeric value shown in center; tooltip uses fallback `"Value"` | implicit |
| `size` very small | Stroke clamped at min 6px so it doesn't disappear; tick stays inside SVG bounds | implicit |

---

## Closed bug history

Lessons worth preserving from past mistakes — keep so we don't repeat them.

- **2026-05-07 — SVG arc large-arc-flag bug.** Original code used a `sweep` variable in the *large-arc-flag* slot of the SVG `A` command (`A r r 0 ${sweep} 1 px py`), setting it to `1` whenever `pct > 0.5`. This forced the renderer to draw the long way around (200°+ arc) which clipped against `viewBox` and rendered as floating round line caps. The gauge looked broken for any value > 50%. **Lesson:** in this component the arc is bounded to 180° — large-arc-flag is *always* `0`. The SVG arc syntax is `A rx ry x-axis-rotation large-arc-flag sweep-flag x y` — easy to confuse the two flags; comment + literal `0` is safer than a computed value.

---

## Open questions / deferred

- **Touch tooltips.** Native `<title>` doesn't surface on tap. If usage data shows touch is a primary surface, upgrade to a custom popover (D3 option 2). Don't speculate — wait for the signal.
- **Threshold-based auto-color.** D4 option 3 (`thresholds[]` prop). Not added because no caller has asked. Re-evaluate when a second consumer wants the same ramp logic.
- **Animated sweep.** Currently a hard re-render. Adding `transition` on `stroke-dasharray` would smooth value changes. Not added because the prop API doesn't expose `animated` and the visual cost is marginal.

---

## Related

- [ADR-002](../../../docs/adr/adr-002-light-dom.md) — Light DOM default (this component is an exception, see D5)
- [ADR-003](../../../docs/adr/adr-003-theming.md) — `--ce-*` token vocabulary
- [ADR-005](../../../docs/adr/adr-005-component-meta.md) — meta-as-canonical-spec rule (the meta is authoritative for *what*; this file is authoritative for *why*)
- [ADR-008](../../../docs/adr/adr-008-component-concept-files.md) — the convention this file participates in
- Sibling components: `ce-progress`, `ce-donut`, `ce-spark` (see "What this component is for")
