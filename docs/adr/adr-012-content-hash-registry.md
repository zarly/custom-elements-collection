# ADR-012 — Global content-hash registry at `src/meta/content-hashes.json`

**Status:** Accepted (2026-05-21).
**Relates to:** [ADR-005](adr-005-component-meta.md) (Component meta), [ADR-007](adr-007-component-registry.md) (Component registry for LLM rendering), [ADR-011](adr-011-component-dates.md) (Component dates), [CDR-008](../cdr/cdr-008-additive-changes-only.md) (Additive changes only).

## Context

[ADR-011](adr-011-component-dates.md) introduces `created` + `updated` ISO dates per component meta. To keep `updated` honest we need a mechanical "did the source actually change?" signal — otherwise every commit that touches anything in a component folder (a test refactor, an examples tweak, a typo in a comment) would bump the field, and the value loses meaning.

The mechanical signal is a content hash of the component's source. Two storage options were considered:

| Option | Pros | Cons |
|---|---|---|
| **A** · `contentHash` as a third field on every `meta.json` | Co-located with the meta, idempotent across fresh clones, visible in `dist/registry*.json` for free | Adds noise to every `meta.json` diff; the hash is metadata about meta, not about the component itself; downstream registry consumers see a field they have no use for |
| **B** · Single global file `src/meta/content-hashes.json` with its own Zod schema | Hashes stay out of `meta.json` diffs; one file to inspect / git-blame for hash history; cleaner separation between "what the component is" (per-meta) and "what its source bytes hash to" (registry); operator-preferred | One extra file to keep in sync; not present in `dist/registry*.json` (which is the right answer — downstream consumers don't need it) |

Operator (2026-05-21) chose option B explicitly: *"some global components list as json (add ADR and zod schema)"*.

## Decision

A single global file `src/meta/content-hashes.json` holds the tag → SHA-256 map for every component. Schema lives at `src/meta/content-hashes.schema.ts`.

### File shape

```jsonc
{
  "schemaVersion": 1,
  "components": {
    "ce-card":  "a1b2c3…64-hex-chars-total…",
    "ce-chip":  "d4e5f6…",
    …
  }
}
```

Keys are sorted alphabetically by tag for stable diffs. The Zod schema validates the tag pattern (matching the existing meta `tag` regex) and the hash pattern (`/^[a-f0-9]{64}$/`).

### Hash scope (ratified M-1)

The hash covers **only `<stem>.ts`** — the component source file. Specifically excluded:

- `<stem>.examples.html` — docs-only example tweaks must not bump `updated`
- `<stem>.test.ts` — test refactors aren't a user-facing change
- `meta.json` — would create an infinite update loop (meta change → hash change → meta change → …)
- `CONCEPT.md` — prose rationale, doesn't change the component's API or behaviour

This narrow scope is the operator's intent: `updated` tracks the *code surface* of the component, not its surrounding docs.

### Automation contract (ratified M-3)

The `sync-meta-dates` script (`scripts/sync-meta-dates.ts`) is idempotent and fires from exactly one place:

- **Pre-commit hook** via `simple-git-hooks` (installed by `pnpm install` via the `prepare` script). On every commit that touches any `<stem>.ts`, the hook runs `pnpm sync-meta-dates && git add src/**/*.meta.json src/meta/content-hashes.json`, so the new `updated` + hash land in the same commit as the source change.
- **Manual invocation** (`pnpm sync-meta-dates`) for the rare case a developer wants to inspect the diff before committing. Also: `pnpm sync-meta-dates:check` exits non-zero if anything would change — used by the pre-release protocol gate.

**Deliberately NOT wired into `pnpm check`.** The operator's mental model is "git is the source of truth; the script runs when you commit". Wiring into `pnpm check` would mean the script also runs on dev-only `pnpm check` cycles that don't lead to a commit, creating churn in the working tree. The pre-commit hook is the single firing point.

### Script logic

```
for every src/**/*.meta.json:
  sourcePath = sibling <stem>.ts
  newHash = sha256(read(sourcePath))
  storedHash = registry.components[meta.tag]

  if storedHash !== newHash:
    meta.updated = today (YYYY-MM-DD)
    if !meta.created:
      meta.created = today
    registry.components[meta.tag] = newHash
    write meta + registry

write nothing when every hash matches (idempotent no-op)
```

CLI flags: `--dry-run` (print only), `--check` (exit non-zero on drift).

## Consequences

- One extra file (`src/meta/content-hashes.json`) committed to git, validated by `validate-meta`.
- `pnpm install` installs the pre-commit hook automatically via the `prepare` script — no extra developer setup.
- The registry is NOT projected to `dist/` — it's a build-time/dev-time artifact only. Downstream consumers don't need it; `created` + `updated` carry the signal.
- A commit that only touches `<stem>.examples.html` or `<stem>.test.ts` will NOT bump `updated`. This is correct: the public surface of the component (its `.ts`) hasn't changed.
- A commit that ONLY touches the meta itself (e.g. fixing a typo in a description) will not bump `updated` either — `meta.json` is excluded from the hash scope. This is also correct.

## Alternatives considered

- **`contentHash` as a third per-meta field.** Rejected by operator preference (option A above).
- **Hash sibling source + examples + tests.** Rejected by M-1 — narrowing scope to `<stem>.ts` keeps `updated` semantic ("the code changed"), not noisy ("anything in the folder changed").
- **Pre-commit hook OR `pnpm check` first step (both fire the script).** Rejected by M-3 — single firing point is cleaner; pre-commit is the one that catches every commit, including agent commits.
