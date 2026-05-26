# ce-frame — CONCEPT

Created: 2026-05-23

## Why Shadow DOM?

`ce-frame` uses Shadow DOM (same pattern as `ce-card`) because it requires:

1. `:host([ratio="…"])` attribute selectors to switch `aspect-ratio`.
2. `::slotted(img)`, `::slotted(video)`, etc. to style direct children from inside the component.

Both selectors are only meaningful inside a shadow root. Light DOM would expose these styles to the host page, creating specificity collisions.

## CDR-001 deviation — 6-value ratio enum

CDR-001 says "style enum is finite (≤5 values)". `ratio` has 6 values: `1:1 | 4:3 | 16:9 | 21:9 | 3:4 | golden`.

**This is acceptable because `ratio` is a size/dimension enum, not a vocabulary enum.**

CDR-001 targets enums that sneak content vocabulary into style attributes (e.g., `type="warning|error|success|info|neutral"` — 5 synonyms for semantic emphasis). The rule guards against vocabulary creep where new synonyms accumulate without bound.

Aspect ratios are a **closed finite set with standard industry names** — the same family as font-size tokens (`xs|sm|md|lg|xl`) or t-shirt sizes. There is no plausible vocabulary creep path: we are not going to add `wide` or `tall` as aliases. The six values map 1:1 to CSS `aspect-ratio` fractions. `golden` is not a vocabulary alias for a concept — it is the conventional shorthand for the mathematical constant 1.618:1.

If a 7th ratio were ever needed (e.g., `9:16` for vertical video), it would be added additively per CDR-008 — not by renaming an existing value.

## CDR-009 — deterministic DOM

`ce-frame` renders a single `<slot></slot>`. The DOM is 100% deterministic: same attributes → same shadow content. No conditional rendering, no JS-driven layout changes.

## CDR-004 — static-first

`ce-frame` has no stateful behavior. All rendering is pure CSS driven by reflected attributes. No `connectedCallback` side effects, no timers, no observers.

## Background token: transparent fallback

The frame background is `var(--ce-bg, transparent)`. Transparent is the correct default: the frame should not impose a background on content that fills it completely (cover mode). When `fit="contain"` letterbox bars appear, the bars will show whatever the parent background is, which is usually the right behavior. Theme authors who want explicit letterbox bars set `--ce-bg` at the theme level (CDR-003: presentation policy is global).

## object-fit on iframe limitation

`object-fit` is not honored by `<iframe>` elements (it is defined only for replaced content that has an intrinsic size). `ce-frame` applies `width:100%; height:100%` to slotted iframes regardless of the `fit` attribute, effectively always stretching the iframe to fill the frame. This is documented in `limitations` in the meta and in the source JSDoc.

## ::slotted depth limitation

`::slotted(img)` only matches **direct** slot children — a CSS spec constraint, not a Lit limitation. If a user writes:

```html
<ce-frame>
  <div><img src="…"></div>
</ce-frame>
```

…the `object-fit` rule will not reach the `img`. This is documented in `limitations`. The fix is always to slot the media element directly.
