# ADR-016 — Per-Component Conformance File

**Status:** Accepted (2026-05-25).
**Companion:** ADR-015.

## Context

The library publishes a growing set of architecture decisions: 16 ADRs and 15 CDRs. Each criterion has a per-component truth value:

- `ce-card` passes ADR-001 (ce-* prefix), ADR-002 (Light DOM), CDR-001 (style enum / content slot), CDR-008 (additive changes only), Q-11 (≤ 8KB gz)…
- `ce-clock` passes some of these but fails CDR-009 (deterministic) and Q-16 (deterministic test) — wall-clock reads make it non-deterministic by design.

There is no machine-readable per-component summary of "which criteria does this component pass?" today. Operator and reviewer have to grep, infer, or trust intuition. The `cec-component-validator` skill produces an audit report at runtime but writes to stdout, not to disk.

Studio job `0023-cec-meta-v2-batch-2` item 10 ("Quality receipts") arrived with skeleton + frameworks + bundleSize + CDR conformance bundled together. Operator narrowed to conformance only, and specified the storage shape:

> "Could you please add it as separate json file. Here should be record with keys of all our adr, cdr and other quality criteria, value is true, false or string with comment (which means not true, not false, but something in the middle)."

## Decision

Each component carries a sibling file `<name>.conformance.json` (next to `<name>.meta.json`, `<name>.ts`, `<name>.test.ts`, `<name>.examples.html`).

### Shape

```jsonc
{
  "<criterion-id>": true | false | "<comment-string>"
}
```

A flat object. Each key MUST resolve to an existing criterion in one of two universes:

| Prefix | Source |
|---|---|
| `ADR-NNN` | `docs/adr/adr-NNN-*.md` filename |
| `CDR-NNN` | `docs/cdr/cdr-NNN-*.md` filename |

Values:

- `true` — the component passes the criterion as written.
- `false` — the component does NOT pass the criterion (typically because it's not applicable, or a deliberate trade-off).
- `string` — partial pass, with the string as the operator/author's explanation. Treated as "passes with caveat" by consumers; treated as failure when the consumer needs a hard true.

Aggregated into `dist/conformance.json` by `scripts/gen-conformance.ts` at build time.

### Validation

- Build-time lint (`scripts/lint-meta-conformance-keys.ts`) refuses any key that doesn't resolve to a known ADR or CDR.
- Zod does NOT close-enumerate the keys (would force a schema bump per new ADR/CDR — see AD-2 in the implementation plan).
- Missing file is acceptable for the v0.7 release; required from v0.8.

### Lifecycle

- `cec-component-validator` skill writes conformance values for the criteria it can mechanically check.
- Human authors fill in subjective or skill-uncheckable criteria (`Q-11` requires bundle measurement, `A-N` requires manual audit, etc.).
- The conformance file is committed; PRs touching the component should review/update it.
- Aggregated `dist/conformance.json` is regenerated on every build; CI fails on drift.

## Rationale

**Why a sibling file, not a section of `meta.json`:**

- Different update cadence — conformance receipts churn more than API contracts.
- Different authorship — `cec-component-validator` writes here without touching meta version.
- Different consumers — registry consumers (studio, benchmark) typically don't need conformance; conformance consumers (operator audit, npm-page badges) typically don't need the full meta.
- Operator's explicit request — "add it as separate json file."

**Why open-world keys (lint-validated, not Zod-validated):**

- New ADRs/CDRs land more often than schema changes; Zod-closing the key set would force a meta-version bump per new architecture decision.
- The universe is small (< 200 IDs total) so a lint pass over filename + grep is cheap.

**Why allow string values for "partial":**

- Some criteria are not binary. CDR-004 ("static-first") is partially satisfied by `ce-bar-chart` (it does first-render statically but reads slot children for max calculation). A bool flattens this nuance; a comment preserves it for the next reviewer.

## Consequences

- One new file per component (133 files) seeded by the codemod with minimal known-true entries (`ADR-001`, `ADR-002`, `ADR-005`, etc.) and `cec-component-validator`'s output.
- `pnpm check` extended with `lint-meta-conformance-keys.ts`.
- `dist/conformance.json` becomes the canonical answer to "which components pass criterion X?"
- A new agent role (operator + cec-component-validator skill) becomes responsible for keeping conformance current.

## References

- Implementation plan §3.5 (consumer-side updates), §4.5 (conformance file shape).
- Studio feedback `0023-cec-meta-v2-batch-2.json` item `10-quality-receipts` (rework verdict).
