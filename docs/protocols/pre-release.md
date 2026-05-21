# Pre-release protocol

Run this end-to-end before any release, after any wave of new components, or whenever a long-running session has touched many surfaces and you want to be sure nothing drifted silently.

> **Scope.** Sync, update, check, validate, and **fix simple drift** in place. Do **not** touch `package.json` `version`, do **not** commit, tag, push, or `pnpm publish`. The version bump + tag + publish are a separate operator step that runs *after* this protocol returns green.

## Why this exists

`pnpm check` is bisect-safe by design: typecheck + validate-meta + gen-skill drift gate + tests + build. It is **not** a release gate — it doesn't notice:

- Stale counts in `README.md`, `docs/`, or `package.json#description`.
- Catalog sections in `README.md` that fell behind the actual group taxonomy.
- `e2e/` exact-count assertions that drifted silently as the catalog grew.
- Missing reverse `related[]` references on existing components when a new pair shipped (e.g. `ce-tool-call` ↔ `ce-tool-result`).
- An empty `CHANGELOG.md [Unreleased]` section after a wave shipped.
- `src/manifest.publish.ts` not regenerated since the last filtered-publish run.
- A new component shipped with no `examples.html` (when its tier + category require one).
- A new component whose meta passes Zod validation but fails a CDR-derived design-review rule.
- The tarball accidentally including files that should not be published.

This protocol catches all of the above before a release ships them.

## When to run

- **Before a release** — always (this is the canonical pre-release).
- **After a wave** of ≥ 2 new components or any cross-cutting refactor that touches metas, generators, or the demo.
- **After a long session** that shipped many separate commits — drift accumulates between commits even when each commit individually was clean.
- **Before the release commit** — never as the release commit itself; this is *audit + auto-fix*, not the release.

## Stop conditions

Stop and surface a clearly-labelled escalation only on a **hard blocker**:

- `pnpm check` fails after one reasonable fix attempt.
- `pnpm test:e2e` fails after one reasonable fix attempt.
- `pnpm pack:inspect` produces a tarball containing anything outside the published surface (see step 5).
- Any `*.meta.json` references a tag that does not exist (`related[]`, `dependencies[]`, `dependents[]`).
- A new component is missing its `examples.html` and the tier+category combination requires one (`tier ∈ {brick, widget}` AND `category ∈ {ui, lesson}`).
- The publish manifest contains an `internal`-category component.
- Bundle gzip size for a single tag jumped more than ~30 % without an explanation in the commit history.

Everything else is **simple drift** and gets fixed in place during the protocol.

## The protocol

### 0 — Establish ground truth

Counts and lists you will reference everywhere downstream. Compute them once, fresh, so all subsequent comparisons are against the current filesystem reality (not against memory).

```bash
# Total component metas on disk
find src -name '*.meta.json' | wc -l

# Per-category counts
find src -name '*.meta.json' -exec jq -r '.category' {} \; | sort | uniq -c

# Per-group catalog (groups come from src/meta/groups.ts)
find src -name '*.meta.json' \
  -exec jq -r '"\(.category)\t\(.tags[0])\t\(.tag)"' {} \; \
  | sort
```

Record:

- **`TOTAL`** — total metas, used in `docs/ARCHITECTURE.md` repo-layout tree.
- **`PUBLISHED = TOTAL − internal`** — used in `README.md` header + `package.json#description`.
- **The per-group lists** — used to rebuild the `README.md` catalog section if drifted.

### 1 — Run the generators (idempotent, safe)

These never destroy hand-written content; they regenerate machine outputs from `*.meta.json`.

```bash
pnpm gen-exports                                   # → src/{index,auto,manifest}.ts, src/entries/*, package.json exports
pnpm gen-skill                                     # → skill/SKILL.md catalog block + skill/references/index.md
pnpm exec tsx scripts/build-publish-manifest.ts    # → src/manifest.publish.ts (no --apply)
```

After these complete, `git status` should show 0 staged files if everything was already in sync — or only the generator outputs that needed catching up. **Generator output is never a hard blocker**; investigate, but don't escalate.

### 2 — Validate the metas

```bash
pnpm sync-meta-dates:check    # date + content-hash registry drift gate (ADR-011, ADR-012)
pnpm validate-meta            # Zod schema + cross-check sibling source
```

`sync-meta-dates:check` exits non-zero if any component's `<stem>.ts` has changed since its hash was last recorded — meaning `updated` is stale and the meta JSON would change on the next commit. If you see drift here, run `pnpm sync-meta-dates` and commit the resulting meta + registry changes *before* tagging the release. The pre-commit hook normally keeps this clean; this gate catches the case where the hook was bypassed (e.g. `SKIP_SIMPLE_GIT_HOOKS=1`).

Failure on `validate-meta` is **always a hard blocker** — meta drift bricks the registry, the skill catalog, and `dist/meta/`. Fix or escalate; never `--force` past it.

If the project ships a CDR-derived design-review script (in any environment-local location of your choosing), run it on every component touched since the last release. The script's `FAIL` verdicts are blockers unless explicitly justified in a sibling `CONCEPT.md`.

Common false-positive `FAIL`s already exempted in [CDR-001](../cdr/cdr-001-style-enum-content-slot.md) and [CDR-002](../cdr/cdr-002-typed-values-as-children.md):

- "Vocabulary in enum" triggered by HTML-spec enum values (e.g. `type="date|time|…"` on `ce-date-picker`). Exempt under CDR-001 "When NOT to apply".
- "String value attribute" triggered by `value: string` on form controls. Exempt because form-control `value` is form data, not display content per CDR-002.

If you keep a deviation, document it in a sibling `CONCEPT.md` (ADR-008). Then re-run the review and confirm only warnings remain.

### 3 — Run unit tests + build

```bash
pnpm check
```

This bundles: `typecheck` + `validate-meta` (again — cheap) + `gen-skill:check` (drift gate) + `vitest run` + `vite build` + `tsc -p tsconfig.build.json`.

Record the test count from the vitest summary — it will be quoted in the changelog. **A drop in test count is a hard blocker** (someone accidentally deleted tests).

### 4 — Run e2e

```bash
pnpm test:e2e
```

Vitest covers jsdom-friendly behaviour. Playwright covers the real-browser cases vitest cannot: `ElementInternals` form association, the demo catalog's hydration order, the `auto.ts` upgrade timing.

The catalog-smoke spec asserts the manifest size with a lower bound (currently `≥ 110`), not an exact match — exact-count drifted silently in the past. If the bound is now stale because the catalog *shrank*, that is a hard blocker; if a component genuinely got removed, bump the floor down and document the reason.

### 5 — Inspect the tarball

```bash
pnpm pack:inspect
tar tzf /tmp/custom-elements-collection-<version>.tgz | sort > /tmp/release-files.txt
```

The published surface is exactly what `package.json#files` declares: `dist/`, `README.md`, `LICENSE`. **Anything outside that surface is a hard blocker.** Use an allow-list check, not a deny-list — a deny-list rots silently when new private files appear.

```bash
# 1. Every published path must match the allow-list.
grep -vE '^package/(dist/|package\.json$|README\.md$|LICENSE$)' /tmp/release-files.txt
# ↑ Must be empty. Anything else leaked.

# 2. Every new tag has chunks / components / entries / meta / registry entries.
for tag in <new tags>; do
  echo "=== $tag ==="
  grep -E "(chunks|components|entries|meta|registry)/(${tag#ce-}|${tag})" /tmp/release-files.txt | wc -l
done   # ≥ 5 per tag

# 3. No internal-category component in the published manifest.
tar -xOzf /tmp/custom-elements-collection-*.tgz package/dist/manifest.js \
  | grep -E 'category:\s*"internal"'   # → empty
```

Any non-empty result above is a hard blocker.

### 6 — Drift surfaces (fix in place)

These are the consistency obligations `pnpm check` cannot enforce. Walk the list every release and fix any drift in place — they are mechanical, not judgment calls.

| Surface | Check | Auto-fix |
|---|---|---|
| `README.md` header count | "**N** framework-agnostic Web Components" | Update to `PUBLISHED` |
| `README.md` catalog | Each group section lists the same tags as the per-group output from step 0 | Rewrite the section from the step-0 listing |
| `docs/ARCHITECTURE.md` repo-layout tree | Counts of UI / lesson components and per-tag side-effect wrappers | Update to current `TOTAL` per-subtree |
| `docs/ARCHITECTURE.md` Distribution | "every shipped tag (N at the time of writing)" | Update to `PUBLISHED` |
| `package.json#description` | "A collection of **N** framework-agnostic Web Components" | Update to `PUBLISHED` |
| `e2e/catalog-smoke.spec.ts` | Lower-bound assertion still passes; one `REPRESENTATIVE_TAGS` entry per group | Bump bound down on intentional shrink; add a tag to representatives when a new group lands |
| `CHANGELOG.md` `[Unreleased]` | Each component shipped since the last `## [X.Y.Z]` line is mentioned | Append wave summary with per-group bullets |
| Reverse `related[]` | For each new tag in a natural pair, the *existing* counterpart's meta lists the new tag in `related[]` | Add the missing reference; rerun `pnpm gen-exports` (idempotent — usually 0 updates) |
| `src/manifest.publish.ts` | Regenerated since the last component landed | `pnpm exec tsx scripts/build-publish-manifest.ts` |
| Token discipline | No new `#[0-9a-fA-F]{3,8}` literals in `src/components/**/*.ts` (per ADR-003) | `grep -rE "#[0-9a-fA-F]{3,8}" src/components/*/*.ts` should return empty modulo a documented exception (e.g. `text-inverse` overrides in tokens themselves) |
| Example tags | Every `tier ∈ {brick, widget}` AND `category ∈ {ui, lesson}` has a sibling `*.examples.html` with ≥ 3 `<!-- @example … -->` blocks | If missing, escalate — examples drive LLM adoption |
| Examples script-free | No `<script>` tag inside any `*.examples.html` | Strip and re-author the example as JSON-on-attribute + slot |

Useful one-liners for the table:

```bash
# Catalog drift on README
find src -name '*.meta.json' -exec jq -r '"\(.tags[0])\t\(.tag)"' {} \; \
  | sort | awk -F'\t' '{if($1!=g){g=$1; printf "\n## %s\n", g} printf "%s\n", $2}'

# Missing examples for required tiers
find src -name '*.meta.json' -exec sh -c '
  jq -e ".tier as \$t | .category as \$c
          | (\$t==\"brick\" or \$t==\"widget\")
          and (\$c==\"ui\" or \$c==\"lesson\")" "$1" >/dev/null \
    && [ ! -f "${1%.meta.json}.examples.html" ] \
    && echo "MISSING examples: $1"
' _ {} \;

# <script> in examples (should be empty)
grep -lE "<script" src/**/*.examples.html

# Reverse-related sanity: every related[] entry must resolve to an existing tag.
all_tags=$(find src -name '*.meta.json' -exec jq -r '.tag' {} \; | sort -u)
find src -name '*.meta.json' \
  | while read f; do
      for t in $(jq -r '.related[]?' "$f"); do
        echo "$all_tags" | grep -qx "$t" || echo "DANGLING $t in $f"
      done
    done
```

### 7 — Bundle size sanity

```bash
pnpm bundle-stats
```

The script prints per-tag gzip deltas vs the last recorded run.

Acceptable: small per-tag growth (≤ ~10 %), new components establishing their first baseline, shared-chunk consolidation reducing per-tag size.

Hard blocker: a single tag jumped ≥ 30 % gzip without an obvious reason in `git log` since the last release. Investigate before shipping.

### 8 — Demo smoke-test (visual, fast)

```bash
pnpm demo &
DEMO_PID=$!
sleep 3

# Root loads
curl -fs http://localhost:4600/ > /dev/null && echo "demo OK"

# Each new tag's detail page reachable (manifest-driven nav populates on demand)
for tag in <new tags>; do
  curl -fs "http://localhost:4600/#/$tag" > /dev/null && echo "$tag detail OK"
done

kill $DEMO_PID; wait $DEMO_PID 2>/dev/null
```

Anything that returns non-2xx here is a hard blocker; the catalog page is the most-public surface and breakage there will block adoption.

If port 4600 / 4601 are already in use, pass `--port 4612` (or similar) — Vite's default port-bump can clash with other agents on the same host.

### 9 — Design-review rollup (optional)

If the wave touched ≥ 5 components, run the design-review script (whatever environment-local location you keep it in) on every changed component and capture the rollup. Warnings are fine; failures need a `CONCEPT.md` or a fix.

```bash
# Changed components since the last release tag
git diff --name-only $(git describe --tags --abbrev=0)..HEAD \
  | grep -oE 'src/components/[^/]+' | sort -u
# → feed each into your local design-review script and grep for ✗ / ⚠
```

## Output

A pre-release run ends with a short report — markdown, ~20 lines — covering:

- **Counts confirmed**: total / published / per-group deltas vs the last release.
- **Tests**: vitest count, e2e count, both green.
- **Tarball**: file count, all new tags shipped, allow-list clean.
- **Drift fixed in place**: bullet list of surfaces touched.
- **Open items**: anything left for the operator (the version bump + tag + publish).
- **Escalations**: hard blockers, if any. "None." is acceptable.

The report is a transient audit summary surfaced in the chat session, not a tracked file.

## What this protocol does NOT do

By design, none of the below are part of the protocol — they are separate operator decisions made *after* the protocol returns green:

- Bump `package.json#version`.
- Move the `## [Unreleased]` block to a versioned `## [X.Y.Z]` heading in `CHANGELOG.md`.
- `git add` / `git commit` / `git tag` / `git push`.
- `pnpm publish` / `npm publish`.
- Create or update a GitHub release.

An agent attempting any of these without explicit operator confirmation is overstepping its scope.

## Cross-references

- [`CONTRIBUTING.md`](../../CONTRIBUTING.md) — authoring checklist (§4) and the wider quality bar this protocol relies on.
- [`docs/cdr/`](../cdr/) — component design conventions; the design-review rollup checks these.
- [`docs/adr/`](../adr/) — architectural decisions, including ADR-005 (component meta), ADR-007 (component registry), and ADR-008 (`CONCEPT.md` per-component rationale).
- [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) — repo layout and build pipeline; consistent with the counts this protocol confirms.
