---
id: CDR-014
title: contentModel declaration (block / inline / void)
status: accepted
date: 2026-05-25
compliance: MUST
tags: [meta, rendering, generative-dom, schema]
relates_to: [ADR-005, ADR-007, ADR-014, ADR-015, CDR-008]
---

# CDR-014 — `contentModel` declaration

## Context

`@generative-dom/plugin-companion` decides whether to allow block-level markdown (lists, headings, paragraphs) inside a custom element based on a hand-curated `COMPANION_DEFAULT_BLOCK_TAGS` array — currently ~70 entries that have to be kept in sync with the CEC component set manually.

This is a manual-curation burden, asymmetric: when CEC adds a new block-level component, generative-dom must release a sibling update. When the lists drift, the symptom is silent — markdown blocks inside the new tag don't parse as expected.

Studio also benefits from knowing whether a tag is block, inline, or void:
- void → submit-time check that the tag has no children
- inline → block-level markdown inside is invalid
- block → block-level markdown inside is fine

## Decision

Each component meta declares `contentModel ∈ { "block" | "inline" | "void" }`.

- **`block`** — content slot accepts block-level markdown (paragraphs, lists, headings, fenced code). Most components: `ce-callout`, `ce-card`, `ce-section`, `ce-feature-card`, `ce-hero`, `ce-quote`.
- **`inline`** — content slot accepts inline markdown only (bold/italic/code/links). Compact tags: `ce-badge`, `ce-chip`, `ce-button`, `ce-kbd`, `ce-tag`, `ce-pill`.
- **`void`** — accepts no children. Pure attribute-driven: `ce-clock`, `ce-counter`, `ce-divider`, `ce-sparkline`, `ce-icon`, `ce-qr`.

Compliance: MUST. The field is required in v2 and replaces generative-dom's hardcoded list as soon as the companion plugin reads it from the registry.

## Rationale

**Why MUST and not SHOULD:** generative-dom's allowlist plugin needs an answer for every tag; "unknown" defaults to silent-drop (per memory of FR-GD-001 contract). Forcing the declaration prevents new components from silently misrendering.

**Why three values, not more:** matches HTML's content-model categories (block / inline / void). Adding "phrasing" or "flow" subdivisions over-engineers — generative-dom doesn't need them.

**Why declared per component, not derived:** the current `tier` enum (brick/widget/layout) doesn't map 1:1 to content-model. `ce-badge` (brick) is inline; `ce-card` (brick) is block; `ce-divider` (brick) is void.

## Migration

The codemod fills `contentModel` for every existing component:
- `tier: layout` → `block`
- `slots: []` AND no body-rendering examples → `void` (manual review)
- otherwise → `block` (manual override for known-inline: `ce-badge`, `ce-chip`, `ce-button`, `ce-kbd`)

Generative-dom adoption is a follow-up PR (per ADR-015 §Risks): the companion plugin keeps its hardcoded list for one cycle, then switches to `registry.contentModel === "block"` derivation. During the overlap, a CEC pre-publish check warns on divergence.

## Consequences

- One new MUST field per component.
- Generative-dom decouples from CEC release cadence for the companion-allowlist concern.
- Studio gains a void-vs-block check at submit time.
- The block-vs-inline-vs-void taxonomy is now part of CEC's public API contract — bumping a component from one to another is a breaking change (CDR-008).

## References

- ADR-014 (streaming lifecycle).
- ADR-015 §"Migration tooling".
- Studio job `0022.09` (content-model declaration).
