# ce-score — Design Rationale

## Why auto-tier from value/max (CDR-001 / CDR-003 alignment)

The corpus pattern `<span class="score s5">9.4</span>` encodes tier information
in CSS class names (`s5`, `s-high`, `s2`). This is a classic CDR-001 violation:
vocabulary in a selector instead of data in an attribute. The fix is to put the
numeric score in `value`, derive the visual tier from ratio math, and expose the
tier as a reflected attribute so CSS `:host([tier="high"])` selectors work cleanly.

Hardcoding tier thresholds per-instance (a `threshold-high="0.8"` boolean) would
be a CDR-003 violation — presentation policy should be document-wide. So the
thresholds are set once on `:root` via `--ce-score-breakpoints`, not per tag.

Default thresholds (>= 0.66 high, >= 0.33 med) were chosen to match the 0–10
scale where ≥7 = good, ≥4 = acceptable, <4 = poor — the most common subjective
rubric seen across the 61-file corpus sample.

## Why default max=10

335-file corpus analysis: the dominant scoring scales are 0–10 (evaluation
rubrics, NPS proxies, rating tables) and 0–5 (star ratings). 0–10 appeared
approximately 3× more frequently, making it the right default. Authors using
0–5 scales should set `max="5"`; authors using 0–100 should set `max="100"`.

## Why default inline=true

61 files used this pattern, with 1168 occurrences. Visual inspection: ~92% of
those occurrences are inside `<td>` cells or inline `<span>` contexts. A block
pill is the unusual case. Defaulting to inline avoids requiring `inline` on every
table-cell usage, while `inline="false"` is the explicit opt-out for standalone
block usage.

## Slot vs value-only attribute (CDR-002 carve-out)

`value` is a number driving layout math (tier computation) and ARIA
(`aria-valuenow`). Per CDR-002 §"When NOT to apply", numeric/boolean primitives
that drive layout or math stay as attributes. The default slot is additive — it
allows rich label overrides (e.g. `9.4<sup>*</sup>`) without polluting the
numeric `value` attribute with markup.

## Shadow DOM choice

`ce-score` uses Shadow DOM (via `createShadowRootWithStyles()`) because the
`:host([tier="..."])` CSS selectors require style isolation from host-page rules.
Light DOM would expose the pill styling to host-page CSS specificity collisions.
This matches the `ce-verdict`, `ce-card`, and `ce-kpi` pattern — all pill/chip
primitives in this library use Shadow DOM for the same reason.

## willUpdate for ARIA + tier sync

ARIA attributes (`role`, `aria-valuenow`, etc.) and the auto-computed `tier`
attribute are set in `willUpdate()` rather than `render()` because they must live
on the host element, not inside the shadow DOM. `willUpdate` runs before the Lit
render cycle writes to the shadow root, so the attributes are always in sync with
the current property values before the browser paints.

The auto-tier path reads `getComputedStyle` for `--ce-score-breakpoints` inside
`#resolvedTier`. This is called from `willUpdate`, which means it reads the live
CSS environment at update time — correct for both the initial render and any
subsequent updates triggered by `value`, `max`, or external CSS var changes (the
latter won't auto-update without a property change, which is acceptable).
