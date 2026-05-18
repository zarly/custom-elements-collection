# CONCEPT — `ce-pricing-tier`

_Created 2026-05-18._

---

## 1. Why no `ce-pricing` parent container

Two options were considered:

**Option A — dedicated `<ce-pricing>` wrapper** that owns layout and accepts `<ce-pricing-tier>` children. This mirrors how `<ce-stat-group>` was originally conceived to wrap `<ce-kpi>` tiles.

**Option B — standalone `<ce-pricing-tier>` composed via `<ce-grid>`** (CDR-006).

Option B was chosen for the same reason `ce-stat-group` was deprecated in favour of `ce-grid + ce-kpi` (28 corpus adoptions vs 0 for the specialized wrapper). A dedicated pricing wrapper would:
- Silently drop narrative siblings (`<ce-callout>`, `<p>`, custom footnotes).
- Block future typed children without a library change.
- Add a component with zero net capability over `ce-grid`.

The canonical composition is:
```html
<ce-grid columns="3">
  <ce-pricing-tier name="Free" .../>
  <ce-pricing-tier name="Pro" highlighted .../>
  <ce-pricing-tier name="Enterprise" .../>
</ce-grid>
```

---

## 2. Why `name` is the only required prop (CDR-007)

Every tier must be identifiable — a tier without a name is not a tier, it is a layout artefact. All other props have sensible defaults or are truly optional:

- `price` — "по запросу" / "Contact us" are valid; omitting shows nothing, which is valid for a slot-only price.
- `period`, `sub`, `badge`, `cta` — purely additive details.
- `highlighted` — false by default; only one tier per group is typically highlighted.
- `features` — empty array by default; slot children cover the handwritten case.

Marking `name` as `required: true` in the meta makes the lint rule fire when it is absent, surfacing an authoring error rather than silently rendering an anonymous card.

---

## 3. CDR-005: features JSON + slot resolution order

`features` (JSON prop via `jsonProp()`) and the default slot are two shapes for the same data:

1. **`features.length > 0`** → render JSON feature rows. Slot children are present in the light DOM but the shadow template renders `#renderJsonFeatures()` instead of `<slot>`.
2. **`features` empty (default `[]`)** → render `<slot>` and let light-DOM children flow through.

This mirrors the `ce-tabs` / `ce-bar-chart` CDR-005 pattern. The resolution order is explicit and documented so LLMs that emit both shapes simultaneously get predictable behaviour (JSON wins).

The `note` field on `PricingFeature` is rendered as a parenthetical `<span class="ce-pricing__feature-note">` — keeping label and note as separate rendered elements instead of concatenating them into a string, so consumers can target `.ce-pricing__feature-note` in CSS.

---

## 4. How `included` / `not-included` attribute selectors avoid hard-wrapping (CDR-006)

The default slot accepts **any element** — `<span>`, `<li>`, `<p>`, future `<ce-feature>`, whatever. The checkmark / × prefix and muted color are applied with CSS attribute selectors on `::slotted(*)`:

```css
/* Every slotted child gets checkmark via ::before */
::slotted(*::before) { content: "✓"; color: var(--ce-color-green); }
/* Children with [not-included] get muted color; the icon swaps via data */
::slotted([not-included]) { color: var(--ce-dim); }
```

Note: `::slotted(*::before)` has limited cross-browser support. The `×` / `✓` icons for slot children rely on CSS `::before` pseudo-elements with `content`. In environments where `::slotted(*)::before` pseudo-content is not supported, the checkmark is absent but text remains accessible. JSON features mode (`#renderJsonFeatures`) avoids this limitation entirely by rendering the icon as a real DOM `<i>` element — which is why JSON mode is preferred for maximum cross-browser fidelity.

This design means:
- No tag-name filter — CDR-006 compliant.
- `not-included` and `included` are loose attributes, not an enforced schema. Any element can carry them.
- A future `<ce-feature included>Rich label with <a></a></ce-feature>` composes in without changes.
