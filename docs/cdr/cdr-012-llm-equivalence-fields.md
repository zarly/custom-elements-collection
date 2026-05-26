---
id: CDR-012
title: Declare LLM-equivalence in meta — lift library-wide variation tolerance out of per-task corpus YAML
status: accepted
date: 2026-05-25
compliance: SHOULD
tags: [meta, registry, scoring, equivalence, llm-benchmark]
relates_to: [ADR-005, ADR-007, ADR-009, ADR-015, CDR-005, CDR-006, CDR-008, CDR-010]
---

# CDR-012 — Declare LLM-equivalence in meta, not per-task YAML

## Context

`llm-benchmark` scores model output against a corpus of tasks. Each task's YAML
carries `canonical_solution` plus a list of `acceptable_variations` — extra
HTML files that should also score as correct. The list is reviewed and
verdict-stamped by a human operator through `studio-inbox` review jobs.

The most recent review pass (jobs `0020-existing-task-variations-pilot` +
`0021-existing-task-variations-full`) produced **45 accepted variations across
23 tasks**. Reading them as a set reveals a structural problem: the
variations are **not task-specific judgements**, they are **library-wide
equivalences** that happen to surface in 18 different tasks. Examples:

| Equivalence the operator accepted | Tasks affected |
|---|---|
| `<ce-grid columns="N">` ≡ `<ce-grid cols="N">` (attribute drift) | 6 |
| `<ce-grid>…</ce-grid>` ≡ flat siblings (layout wrapper optional) | 6 |
| `ce-callout type="info"` ≡ `ce-verdict type="info"` (semantic siblings) | 3 |
| `ce-callout type="info"` ≡ `lesson-note type="tip"` (cross-family semantic siblings) | 2 |
| `<div slot="left">` ≡ `<ul slot="left">` (slot-content shape) | 3 |
| `<ce-timeline-item>` ≡ `<article data-date>` ≡ `<ol><li>` (semantic fallback for unregistered child tags) | 4 |
| `chat-bubble sender=` ≡ `chat-bubble author=` (attribute drift) | 1 |
| Decision tree `branches='[…]'` JSON ≡ `<ce-decision-option>` slot children | 2 |

That's **27 of 45 accepted variations** (~60%) that are mechanical applications
of one of 7 patterns. The operator was effectively re-stating the same 7
rules across 18 task contexts. The remaining ~18 variations were genuinely
task-specific (paragraph count, ordering decisions, intro-callout addition).

The cost of this is concrete:
- **Operator time.** 36 verdicts in job 0021 took ~25 min — most of it
  re-validating equivalences the operator had already accepted earlier in
  the same job.
- **Scorer fidelity.** Variations only fire when the YAML lists them. A new
  task using `columns=` instead of `cols=` will mis-score until someone
  adds a variation HTML to that task.
- **Library/corpus drift.** The library renames an attribute (e.g.
  `columns → cols`, ADR-005 evolution). Every corpus task that used the
  old name now needs a variation patch. The library and corpus are forced
  into lockstep that the schema doesn't enforce.

The root cause: **library-wide equivalence is encoded as per-task data**,
when it should be encoded **once in the meta** and consumed by anyone
who needs to compare two HTML fragments for "are these the same component
call?"

## Decision (proposed)

Add a small, opt-in set of equivalence-declaring fields to `ComponentMeta`.
They are read by `llm-benchmark`'s selection analyzer (and by future tools:
adoption auditors, lint rules, doc generators) to canonicalize two
fragments before comparison. Per-task `acceptable_variations` continues to
exist, but is reserved for **task-specific** judgement (paragraph count,
intro-callout addition, ordering), not for library-wide patterns.

### The four new fields

All optional. All additive (CDR-008 compliant). All consumed by the
existing registry projection.

#### F1 — `props[].aliases?: string[]` — attribute drift

```jsonc
// ce-grid.meta.json
{
  "name": "cols",
  "type": "\"2\" | \"3\" | \"4\"",
  "default": "\"3\"",
  "aliases": ["columns"],   // ← NEW
  "description": "Fixed column count when auto is unset."
}
```

Declares that historical attribute names are recognized as equivalent for
the same prop. The component itself does **not** read `columns=`; the
field is documentation + scorer-input only. A consumer that needs runtime
acceptance reads the meta and installs a one-line `getAttribute("columns")
?? getAttribute("cols")` fallback (CDR-008 additive-change protocol).

Fixes ~10 of the 45 accepted variations.

#### F2 — `meta.role?: "transparent-wrapper" | "container" | "leaf"` — optional layout wrappers

```jsonc
// ce-grid.meta.json
{
  "tag": "ce-grid",
  "role": "transparent-wrapper",   // ← NEW
  "wrapsChildren": { "minCount": 2, "maxCount": 4 }
}
```

Declares that the component is a layout-only wrapper around its children.
A scorer comparing `<ce-grid><ce-kpi/><ce-kpi/></ce-grid>` against
`<ce-kpi/><ce-kpi/>` may treat them as equivalent (when the only
difference is the wrapper's presence or absence).

This formalizes what CDR-010 implies: layout policy doesn't carry data
identity, so it should not change selection score. Only `ce-grid`,
`ce-center`, `ce-card` (when used as a layout container), and a few
others would carry `role: "transparent-wrapper"`. **Default is `"leaf"`**
— no behavior change for the ~70 brick/widget components.

Fixes ~12 of the 45 accepted variations.

#### F3 — `meta.interchangeableWith?: Array<{ tag, scope?, when? }>` — semantic siblings

```jsonc
// ce-callout.meta.json
{
  "tag": "ce-callout",
  "interchangeableWith": [   // ← NEW
    {
      "tag": "ce-verdict",
      "scope": "summary-tone",
      "when": "type ∈ {info, success, warn, danger}"
    },
    {
      "tag": "lesson-note",
      "scope": "admonition-tone",
      "when": "ce-callout.type ↔ lesson-note.type via mapping"
    }
  ]
}
```

Stronger than `related[]` (which is a "see also" link). Declares that the
named tag occupies the same semantic slot — the LLM author may pick
either, and a scorer comparing selection should accept either. The `scope`
field names the equivalence (so we can audit: "show me all
`summary-tone` components"). The `when` field is a human-readable
predicate; mechanical equivalence rules are in code, this field documents
intent.

Bidirectional declaration is encouraged (ce-verdict declares the same back
to ce-callout); a meta-lint can warn on asymmetry.

Fixes ~5 of the 45 accepted variations.

#### F4 — `slots[].acceptShapes?: string[]` — slot content tolerance

```jsonc
// ce-compare.meta.json
{
  "slots": [
    {
      "name": "left",
      "description": "Left-column comparison content.",
      "acceptShapes": [                     // ← NEW
        "child-tag:ce-compare-row",
        "semantic-html:ul,li",
        "semantic-html:div,p,strong,br"
      ]
    }
  ]
}
```

Declares which slot-content shapes the component renders meaningfully.
`child-tag:<tag>` means "intended children are this custom tag";
`semantic-html:<allowlist>` means "plain HTML matching this allowlist is
also rendered with reasonable defaults". The scorer normalizes any of
these to a canonical form (e.g. flatten to text content + element count)
before comparing.

Fixes ~6 of the 45 accepted variations, **and** documents the
"upstream-blocked fallback" pattern (timeline-item, compare-row,
decision-option) so future authors know which shapes are first-class
versus fallback.

### What this is NOT

- **Not a relaxation of the bright-line rules.** ADR invariants (tag
  prefixes, design tokens, light DOM default, no peer-deps, slot-only-no-
  script) are unchanged. F1-F4 are application-level equivalence
  declarations, not framework knobs.
- **Not a license to over-merge components.** A new `interchangeableWith`
  entry needs to pass "would an LLM author plausibly substitute one for
  the other?" If the answer is no, leave `related[]` only.
- **Not a permission to skip per-task `acceptable_variations`.** Task-
  specific variations (paragraph counts, brief-interpretation choices,
  intro-callout additions) still belong in the corpus YAML. F1-F4
  eliminate the *library-wide* equivalences; *task-specific* judgement
  stays where it is.
- **Not a runtime feature.** None of these fields cause the component to
  behave differently at runtime. They are documentation consumed by
  tooling. (CDR-008 compliance: pure addition.)

## Goal / Definition of success

- After F1-F4 land, the next "existing-task-variations" review job
  contains roughly **half the items** of job 0021 — only the task-
  specific judgements remain.
- A new corpus task that uses `<ce-grid columns="2">` or substitutes
  `ce-callout` for `ce-verdict` scores correctly **without anyone
  authoring a variation HTML**.
- An attribute rename (e.g. future `gap → spacing`) adds one `aliases`
  entry to the meta. Old corpus tasks keep scoring. No per-task patches.
- The `dist/registry.json` projection includes the new fields so any
  external scorer (not just llm-benchmark) can use them.

## When to apply

Author-side checklist for any meta:

1. Does the prop have a historical name that's still in use? → `aliases`.
2. Is the component a layout-only wrapper that adds no data identity? →
   `role: "transparent-wrapper"`.
3. Is there a sibling component that an LLM author could plausibly
   substitute for this one in some scenarios? → `interchangeableWith`
   (bidirectional).
4. Does the slot accept richer shapes than its primary child-tag (e.g.
   semantic HTML fallback)? → `slots[].acceptShapes`.

## When NOT to apply

- **Don't use `interchangeableWith` to paper over a design overlap.** If
  two components genuinely do the same job, the right answer is to
  deprecate one (CDR-008 + ADR-010 pattern), not to declare them
  interchangeable forever.
- **Don't use `aliases` for typos or speculative renames.** Only the
  historical names that **actually appear** in shipped corpus / docs /
  examples warrant an alias. The field is not a planning tool.
- **Don't use `role: "transparent-wrapper"` on data-carrying components.**
  A wrapper is transparent only if removing it from the DOM doesn't
  change the rendered information.
- **`acceptShapes` is not a generic "anything goes" license.** Each entry
  should name a shape the team is willing to maintain — semantic-html
  shapes need a definite allowlist of tags, not just `"semantic-html"`.

## Good examples

```jsonc
// ce-grid.meta.json — layout wrapper + drift
{
  "tag": "ce-grid",
  "role": "transparent-wrapper",
  "wrapsChildren": { "minCount": 2, "maxCount": 12 },
  "props": [
    {
      "name": "cols",
      "aliases": ["columns"],
      // ...
    }
  ]
}

// ce-verdict.meta.json — semantic sibling
{
  "tag": "ce-verdict",
  "interchangeableWith": [
    { "tag": "ce-callout", "scope": "summary-tone",
      "when": "type ∈ {info, success, warn, danger}" }
  ]
}

// ce-callout.meta.json — bidirectional
{
  "tag": "ce-callout",
  "interchangeableWith": [
    { "tag": "ce-verdict", "scope": "summary-tone",
      "when": "type ∈ {info, success, warn, danger}" },
    { "tag": "lesson-note", "scope": "admonition-tone",
      "when": "type maps via { info → info, success → tip, warn → warning, danger → warning }" }
  ]
}

// ce-compare.meta.json — slot-shape tolerance
{
  "tag": "ce-compare",
  "slots": [
    { "name": "left", "description": "Left column.",
      "acceptShapes": ["child-tag:ce-compare-row",
                       "semantic-html:ul,li,strong",
                       "semantic-html:div,p,strong,br"] }
  ]
}
```

## Bad examples (anti-patterns)

```jsonc
// ❌ interchangeableWith abused as a synonym for related[]
{
  "tag": "ce-card",
  "interchangeableWith": [
    { "tag": "ce-panel" }  // Different identity; just because both contain content doesn't mean substitutable
  ]
}

// ❌ aliases used for typos / speculative names
{
  "name": "value",
  "aliases": ["val", "v", "values"]  // Only "val" if val actually appears in real corpus. The rest is speculation.
}

// ❌ role: transparent-wrapper on a data carrier
{
  "tag": "ce-bar-chart",
  "role": "transparent-wrapper"  // Wrong — removing it changes what the user sees.
}

// ❌ acceptShapes too broad
{
  "name": "default",
  "acceptShapes": ["semantic-html"]   // Needs an allowlist of tags, not just the family.
}
```

## Consequences

- ✅ **Operator review burden drops ~50%.** The next variation-review
  pass focuses on real task judgement (ordering, interpretation,
  composition), not on mechanical equivalences.
- ✅ **Library/corpus drift is bounded.** An attribute rename costs one
  meta edit, not N corpus patches.
- ✅ **New corpus tasks score correctly out of the box** when they use
  the library-wide equivalences.
- ✅ **External tooling benefits.** Adoption audits, doc generators, and
  the LLM-facing skill catalog all get richer signals from the same
  registry projection.
- ✅ **Self-documenting.** The "ce-callout ↔ ce-verdict" semantic
  equivalence is now a fact in the registry, not a tribal-knowledge item
  from the 2026-05-25 review session.
- ⚠️ **Authoring overhead.** Each meta carries up to four new optional
  fields. The pre-flight checklist in `CONTRIBUTING.md` §4 grows by one
  bullet. Mitigation: all fields are opt-in; `pnpm validate-meta` doesn't
  require any of them.
- ⚠️ **Risk of over-declaring `interchangeableWith`.** If every component
  has a list of "kinda similar" siblings, the equivalence relation gets
  noisy. Mitigation: the `scope` field is required when present, and the
  validator can flag cycles or transitivity violations.
- ⚠️ **Scorer must implement the canonicalization.** ~150 lines of code
  in `llm-benchmark/src/analyzers/selection-rules.ts`. Tradeoff: one-time
  cost, infinite-time benefit.

## Validation

- **Schema (`src/meta/schema.ts`):** add four optional fields with Zod
  validation. Property aliases are non-empty strings, distinct from the
  prop's own `name`. `role` is a closed enum. `interchangeableWith[].tag`
  must be a valid custom-element tag (regex check). `acceptShapes[]`
  follows a `kind:value[,value]` grammar.
- **Cross-check (`pnpm validate-meta`):** Every tag named in
  `interchangeableWith[].tag` or `slots[].acceptShapes` of kind
  `child-tag:<tag>` must resolve to a real meta in the repo (or a
  documented external tag — `lesson-*` is in-repo too).
- **Bidirectionality lint:** If A declares `interchangeableWith` of B,
  warn (don't error) if B doesn't declare the reverse.
- **Snapshot test:** `tests/equivalence/canonicalize.test.ts` — given a
  set of (left, right, expected-equivalent) HTML pairs, run them through
  the canonicalization derived from meta and assert the expected result.
- **Bench coupling:** `llm-benchmark/src/analyzers/selection-rules.ts`
  reads `dist/registry.json`, builds a canonicalization function once
  per run, applies it to model output + (canonical, variations) before
  set/F1 comparison.

## Migration plan

1. **Schema additions** (this PR after acceptance): TS types + Zod +
   validator + sample meta updates for `ce-grid`, `ce-callout`,
   `ce-verdict`, `ce-compare`, `ce-chat-bubble`. About 10 file edits.
2. **Registry regen**: `pnpm gen-registry` projects the new fields. No
   consumer breakage; registry is additive.
3. **Scorer**: `llm-benchmark` adds a canonicalization step in front of
   the existing tag-F1 / structural / abstraction signals. Replicate
   existing tests; add canonicalization tests. Estimated ~1 day.
4. **Corpus cleanup**: identify the ~27 of 45 variations that become
   redundant once F1-F4 are live. Remove them from per-task
   `acceptable_variations` blocks. Keep the variation HTMLs in
   `solutions/` as historical reference (or move to
   `solutions/_archived/`).
5. **Operator gate**: re-run job 0021 with the new scorer. Expect
   ~half the items now classify as "trivially equivalent — skip review";
   only the task-specific judgement remains.

## Open questions

- **Should `role` be a single string or a list of strings?** A
  component could plausibly be `["transparent-wrapper", "container"]`
  in two different parental shapes. Conservative answer: single string
  for v1; revisit if a real case shows up.
- **Should `interchangeableWith` carry a `direction: "→" | "↔"` field?**
  Some substitutions are one-way (use `ce-verdict` instead of plain
  `ce-callout`, but not vice versa). v1 assumes `↔` (symmetric);
  asymmetric cases can be added later as a property.
- **Should attribute aliases also flow into a runtime
  `getAttribute()` fallback?** Current proposal: no, the meta is
  documentation + scorer input only. If a real consumer needs runtime
  support, CDR-008 handles it as an additive change. Marking aliases
  as runtime-effective is a separate decision per component.

## History

- **2026-05-25** — Drafted. Triggered by the variation-review session
  for `llm-benchmark` corpus v1: 45 accepted variations across 23
  tasks, ~60% of which were mechanical applications of 7 library-wide
  patterns. Operator framing: "we can act better by defining
  variations on the level of custom-elements-collection components
  library." This document formalizes the proposal.

## Related

- [ADR-005](../../adr/adr-005-component-meta.md) — Meta files are the
  canonical API spec. This proposal extends that spec additively.
- [ADR-007](../../adr/adr-007-component-registry.md) — The registry is
  the LLM-facing projection. New fields surface there automatically.
- [ADR-009](../../adr/adr-009-llm-tolerant-components.md) — Components
  are tools, not products. This proposal extends tolerance into
  scoring: the *scorer* should be tolerant of the same equivalences
  the *components* already tolerate at runtime.
- [CDR-005](../cdr-005-collections-json-and-slot.md) — Collections
  accept both JSON-on-attribute and slot children. This proposal
  formalizes "either form scores the same".
- [CDR-006](../cdr-006-components-compose.md) — Components compose; no
  hard wrappers. F2 (transparent-wrapper role) makes that contract
  machine-readable.
- [CDR-008](../cdr-008-additive-changes-only.md) — All four new
  fields are optional. Existing metas remain valid.
- [CDR-010](../cdr-010-same-data-multiple-views.md) — Same data,
  multiple views — siblings over variants. F3 (`interchangeableWith`)
  is the meta-side declaration of the substitution relation CDR-010
  describes at the markup level.
- `llm-benchmark/src/analyzers/selection-rules.ts` — current scorer;
  the consumer that benefits most from this proposal.
- `studio-inbox/jobs/0021-existing-task-variations-full/` — the review
  job whose pattern recurrence prompted this document.
