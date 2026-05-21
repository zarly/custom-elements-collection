# ADR-011 — Per-component `created` and `updated` dates in meta JSON

**Status:** Accepted (2026-05-21).
**Relates to:** [ADR-005](adr-005-component-meta.md) (Component meta), [ADR-012](adr-012-content-hash-registry.md) (Content-hash registry), [CDR-008](../cdr/cdr-008-additive-changes-only.md) (Additive changes only).

## Context

The library ships 129 components today, with growth ongoing. The demo's catalog navigation (sidebar) has only one navigation axis (`category → group`) — no time-awareness. Two needs surface together:

1. **Discoverability** — "what was added recently?" and "what changed last week?" are real questions for both human operators tracking releases and LLM agents picking the latest patterns.
2. **Filterable navigation** — the demo-navigation roadmap (`internal/PLAN_DEMO_NAVIGATION_V2.md`) requires runtime filtering by "components created/updated in the last N days". That filter needs a first-class data source — not a derivation from `git log` at runtime (the demo is a static page).

Today, neither piece of information lives in the meta JSON. The closest existing field, `since: "0.3.0"`, is a release-version string and is also optional.

## Decision

Add two required fields to every `*.meta.json`:

```jsonc
{
  "created":  "2026-05-21",   // ISO-8601 date, YYYY-MM-DD
  "updated":  "2026-05-21",   // ISO-8601 date, YYYY-MM-DD, must be >= created
  …
}
```

**Both fields are required.** Validated by the Zod schema in `src/meta/schema.ts` with `regex(/^\d{4}-\d{2}-\d{2}$/)` and a cross-field check `updated >= created` (lexicographic compare is correct for that format).

**Both fields are script-managed.** Humans and agents never edit them. The `sync-meta-dates` script (see [ADR-012](adr-012-content-hash-registry.md)) maintains them automatically on every commit via a `simple-git-hooks` pre-commit hook. Manual invocation: `pnpm sync-meta-dates`.

**Position:** right after the `since` / `deprecatedIn` / `replacedBy` block in the schema, so the version/date region of the meta is contiguous.

## Backfill for existing 129 components

Best-effort accuracy. Operator explicitly relaxed precision for legacy data: what matters is the going-forward automation, not the historical archeology.

- `created` from `git log --follow --diff-filter=A --format=%ad --date=short -- <meta_path> | tail -1`
- `updated` from `git log -1 --format=%ad --date=short -- <stem_folder>` (whole component folder, captures source-only edits, not just meta edits)

Fall back to today's date when git history is unavailable. Don't engineer around git rename quirks — minor errors on legacy data are acceptable.

One commit lands the backfill: `chore(meta): backfill created/updated dates`.

## Consequences

- `dist/meta/*.json` and `dist/registry*.json` automatically include the new fields (additive — [CDR-008](../cdr/cdr-008-additive-changes-only.md) compatible).
- Downstream consumers gain time-aware queries: "show me bricks added since 2026-05-01", "diff registry between two dates".
- `validate-meta` becomes a stronger gate; the first run after this ADR lands fails on existing files until the backfill runs.
- `CONTRIBUTING.md` §4 (authoring a new component) drops any manual date instruction; the script writes them.
- `docs/protocols/pre-release.md` adds a check: `pnpm sync-meta-dates:check` exits 0.

## Alternatives considered

- **Derive at build time from `git log`.** Rejected — demo is a static page; runtime/build-time derivation isn't visible to `dist/registry*.json` consumers and is fragile across folder renames.
- **Misuse `since` as a date.** Rejected — `since` is a release version string and is optional; conflating semantics is worse than adding two new fields.
- **Store dates in a side-file (e.g. `internal/dates.json`).** Rejected — would not flow to `dist/`, defeating point of the field.
- **`contentHash` as a third per-meta field.** Considered but rejected in favor of a global registry — see [ADR-012](adr-012-content-hash-registry.md).
