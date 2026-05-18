# `ce-quote` — design rationale

## Why author and source have both attribute AND slot forms

### The tension: CDR-002 vs CDR-007

**CDR-002** says typed/rich values belong in slots, not string attributes. A quote author can be a link (`mailto:`, a profile page), a composed span with a job title, or include a verification chip. Locking it to a plain `author="…"` string forfeits that composability.

**CDR-007** says the simplest valid invocation must work — zero friction for the common case. In 35 corpus files the overwhelming usage was `<div class="quote-author">— Анна, PM</div>` — a plain string. Requiring a `<span slot="author">` wrapper for every simple attribution would be verbose and would train LLMs to emit boilerplate.

### Decision: dual-form (attribute fallback + slot override)

Both forms coexist:

- `author="…"` / `source="…"` — plain-string fast path. Enough for 90% of corpus patterns. CDR-007 satisfied: first example uses only `author`.
- `slot="author"` / `slot="source"` — rich override. When the slot has content it wins; the attribute value is ignored (it becomes invisible inside the slot fallback content, which Lit renders only when the slot is empty). CDR-002 satisfied: links, `<time>`, chips all compose naturally.

This is the same pattern used by `ce-callout` (`title` attribute + `slot="title"`), which the CDR examples explicitly endorse.

### Why not slot-only?

If author were slot-only, the minimal example would require:

```html
<ce-quote>
  Text
  <span slot="author">Anna, PM</span>
</ce-quote>
```

instead of:

```html
<ce-quote author="Anna, PM">Text</ce-quote>
```

The slot-only form trains LLMs to always emit the wrapper span, even when the plain string is all that's needed. That contradicts CDR-007.

### Why not attribute-only?

If author were attribute-only, there is no path to rich content (linked author, `mailto:`, composed chip). That contradicts CDR-002.

## Three variants, not a `type` enum

`variant` is a CDR-001-compliant style enum: `card | pull | inline`. All three map directly to visual treatments, not vocabulary. The slot carries the quote text; the variant drives only CSS.

`card` is the corpus default (purple left-border block, matches the raw `.quote-card` pattern). `pull` and `inline` extend the same semantic element with distinct visual policies. No enum value encodes domain vocabulary.

## ARIA: `<blockquote>` + `<footer><cite>`

The shadow DOM renders:

```html
<blockquote>
  <slot></slot>          <!-- quote text -->
  <footer>
    <cite>
      <slot name="author">…</slot> · <slot name="source">…</slot>
    </cite>
  </footer>
</blockquote>
```

`<blockquote>` carries the implicit `blockquote` role. `<cite>` semantically labels the attribution. Screen readers announce "blockquote … [text] … citation: [author] · [source]". The separator dot is `aria-hidden`.

Note: the HTML spec allows `<footer>` inside `<blockquote>` as of HTML5; this is the recommended pattern for quote attribution.

## What was considered and rejected

- **Light DOM only**: rejected because `:host([variant=…])` CSS selectors require Shadow DOM for reliable encapsulation (ADR-002 exception rule).
- **`cite` attribute on `<blockquote>`**: kept in spec as an optional URL; not surfaced as a prop because the corpus does not contain URL-only sources — sources are always human-readable citations.
- **`icon` slot**: rejected — quotes have no corpus precedent for decorative icons; composition with `<ce-chip>` inside the source slot covers the enrichment use case.
