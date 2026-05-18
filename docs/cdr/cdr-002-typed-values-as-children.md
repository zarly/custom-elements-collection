---
id: CDR-002
title: Typed values belong in children, not in string attributes
status: accepted
date: 2026-05-18
compliance: SHOULD
tags: [api-design, composition, types]
relates_to: [ADR-009, CDR-001, CDR-006, src/components/key-value, src/components/persona, src/components/bar-chart]
---

# CDR-002 — Typed values belong in children, not in string attributes

## Context

A "value" field on a component is frequently more than a plain string. In real corpus usage we see:

- Phone numbers — want `tel:` links and click-to-call affordance.
- Email — want `mailto:` and link semantics.
- Currency — want locale formatting, sign, decimal precision.
- Dates and timestamps — want `<time datetime="...">` for SEO and relative-time formatting.
- Inline code — want `<code>` styling, copy button, language hint.
- Links — want `<a href>` with all its accessibility semantics.
- Composed mini-renderers — a trend value that's `<strong>$12,480</strong> <ce-chip type="green">+18%</ce-chip>`.

A string attribute (`v="..."`) flattens all of this richness. The value can't be a link, can't carry semantics, can't be rendered specially in the future when a typed renderer ships.

The mistake we want to prevent: `<ce-kv k="Phone" v="+7 999 123-45-67">` — looks innocuous, but locks the design out of every typed renderer.

## Decision

For any component carrying a "value" or "content" field:

- **Keys / identifiers / fixed labels stay as attributes** — they are always short strings.
- **Values move to the default slot** so the slot can carry any element, including specialized typed renderers, `<a>`, `<time>`, `<code>`, or composed children.
- **Children-shaped attributes (text, content, body, value-when-string)** SHOULD NOT exist on the public API. Prefer the slot.

## Goal / Definition of success

- No component exposes a `value` / `v` / `text` / `body` attribute that is intended to carry rich content.
- Default slot consistently carries the "payload" of single-value or key-value components.
- Typed renderers (`<a>`, `<time>`, `<code>`, future `<ce-currency>`, `<ce-date>`) compose naturally inside.

## When to apply

- Component represents `key: value` pairs (`ce-key-value`, `ce-kv`, persona meta rows).
- Component has a "primary content" field that can plausibly be more than a plain string.
- The library is likely to ship typed renderers for the value later.
- Component label is shown to users and might want decoration (chips, badges, icons).

## When NOT to apply

- **Numeric/boolean primitives that drive layout or math.** `value="42"` on a progress bar is a number for `aria-valuenow` arithmetic, not display content.
- **Fixed-shape configuration strings.** `min`, `max`, `step`, `width`, `height`, `gap`, `radius`.
- **ARIA labels.** Must be plain strings per ARIA spec.
- **Identity attributes.** `id`, `name`, `tag`.

## Good examples

```html
<!-- Key stays as attr; value is composable children -->
<ce-key-value>
  <ce-kv key="Model">chat-deep</ce-kv>
  <ce-kv key="Phone"><a href="tel:+79991234567">+7 999 123-45-67</a></ce-kv>
  <ce-kv key="MRR"><strong>$12 480</strong> <ce-chip type="green">+18%</ce-chip></ce-kv>
  <ce-kv key="Updated"><time datetime="2026-05-17">May 17, 2026</time></ce-kv>
  <ce-kv key="Status"><ce-chip type="green" dot>Live</ce-chip></ce-kv>
</ce-key-value>

<!-- Persona — identity attrs + rich content slots -->
<ce-persona name="Ada" rank="#1" score="8/10" color="green">
  <p slot="detail">2-15 person agencies… <a href="#research-1">[research]</a></p>
  <ce-chip slot="tags" type="green">High Pain</ce-chip>
</ce-persona>

<!-- Bar-row — short label as attr OR rich label as slot -->
<ce-bar-row value="42" color="blue">
  <span slot="label">Hero <ce-chip type="amber">new</ce-chip></span>
  <span slot="meta">+12%</span>
</ce-bar-row>
```

## Bad examples (anti-patterns)

```html
<!-- ❌ Value as string attribute -->
<ce-kv k="Phone" v="+7 999 123-45-67"></ce-kv>
<!-- Can't be a tel: link. Can't have hover state. Can't compose. -->

<!-- ❌ Rich content forced into label attribute -->
<ce-bar-row label="Hero new" value="42"></ce-bar-row>
<!-- The "new" badge wants to be a chip; locked inside the label string. -->

<!-- ❌ Pre-formatted markup smuggled into attribute -->
<ce-kv key="Updated" v="&lt;time datetime='...'&gt;May 17&lt;/time&gt;"></ce-kv>
<!-- HTML inside attribute = entity-encoded markup = brittle. -->
```

## Consequences

- ✅ Maximum composability — any future renderer slots in without API changes.
- ✅ Native HTML semantics survive: `<a>`, `<time>`, `<code>`, `<strong>` all work.
- ✅ Future-proof — adding `<ce-currency value="12480" locale="en-US">` later just works inside `ce-kv` children.
- ✅ Co-author with CDR-001: the same shift (vocabulary out of enum, into slot) applies here at the level of values.
- ⚠️ Slightly more verbose for the trivial "plain string" case.
- ⚠️ Authors must understand the slot mental model — handled by examples + cheat-sheet (CDR-007).

## Validation

- **Lint candidate:** `rule_no_string_value_attr` — flags `meta.json props[*]` named `v | value | text | body | content` whose type is `string` (not `number | boolean | enum`).
- **Lint candidate:** any `*.examples.html` containing `v="..."` with markup characters (`<`, `&`, `:`) — these are smuggling HTML into an attribute.
- **Manual review checklist:** *"Could this value benefit from being a link, a date element, a chip, or a future typed renderer?"* If yes → slot. If it's strictly a layout primitive or fixed config → attr.

## History

- 2026-05-18 — Accepted. Triggered by operator critique of plan-v2 `<ce-kv k="..." v="..."/>` proposal. Quote: *"key is almost all the time string, but value not all the time is string... maybe we will need to make some additional renderer... if we move it to children, we can run children in some inline wrapper."*
