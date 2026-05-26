---
name: cec-publishing
description: USE WHENEVER cutting an npm release of `custom-elements-collection` — pre-release audit, version bump, tarball inspection, `pnpm publish`, git tag, GitHub Actions provenance, post-release sanity, semver picking, deprecation handling. Trigger phrases: "release v", "publish", `pnpm publish`, `pnpm pack:inspect`, `prepublishOnly`, `npm publish`, "bump version", "patch / minor / major", "additive only" (CDR-008), "deprecate a component" (ADR-010, ADR-008), "provenance", `.github/workflows/publish.yml`, "what would ship", "tarball allow-list", "stale CHANGELOG". SKIP for routine commits, in-progress development, PRs without a release in view, or hosted-demo deploys (that channel is out-of-band — operated by the site owner from a separate pipeline; this skill is npm-only).
---

# Releasing `custom-elements-collection` to npm

Two channels exist:

| Channel | What ships | Where users see it |
|---|---|---|
| **npm** *(this skill)* | The library bundle (`dist/`) | `https://www.npmjs.com/package/custom-elements-collection` |
| Hosted demo | The interactive catalog (`demo/dist/`) | `https://generativeui.ru/solutions/custom-elements-collection/` |

The hosted demo is out-of-band — site operator updates it from a separate deploy pipeline. **This skill covers npm only.**

> Pre-release audit and the release commit are **separate operator steps**. The audit (`docs/protocols/pre-release.md`) **never** touches `package.json#version`, **never** commits, **never** tags, **never** runs `pnpm publish`. Those happen *after* the audit returns green. An agent attempting any of them without explicit confirmation is overstepping its scope.

---

## When to use

- You're about to bump `package.json#version`.
- A wave of ≥ 2 new components has landed and you want to ship them.
- A bug-fix needs to reach `unpkg` / consumers.
- The hosted demo's component count has fallen behind shipped reality and a release would fix it.
- You're deprecating or removing a component.

## When NOT to use

- Routine commits on `main`. No release in view → `cec-component-author`, `cec-core-maintenance`, or `cec-theming`.
- Hosted-demo deploys (`demo:build` + site operator pipeline).
- Investigating a `pnpm check` failure mid-feature — that's lint / typecheck / test work, not release work.

---

## The flow at a glance

```
1. Pre-release protocol → returns green (audit + auto-fix drift)
2. Bump version          → edit package.json, optionally pnpm version <bump> --no-git-tag-version
3. CHANGELOG entry       → move ## [Unreleased] → ## [X.Y.Z] (if maintained)
4. Commit                → "chore: release vX.Y.Z"
5. Tag                   → git tag vX.Y.Z
6. Push tag              → .github/workflows/publish.yml publishes to npm with provenance
7. Verify                → npm view custom-elements-collection version
```

Or, if publishing locally instead of via the tag-triggered workflow:

```bash
pnpm check                        # 1. typecheck + validate-meta + gen-skill:check + lint + tests + build
pnpm pack:inspect                 # 2. dry-run; verify the tarball allow-list
pnpm publish --access public      # 3. fires prepublishOnly, then publishes
```

`pnpm publish` triggers `prepublishOnly`, which runs `pnpm gen-exports` + `pnpm build-publish-manifest --apply`. **Hand-edits to generated files are silently overwritten.** Edit the meta or the source; let the generators rebuild.

---

## Step 1 — Pre-release protocol (audit + auto-fix)

Always run [`../../docs/protocols/pre-release.md`](../../docs/protocols/pre-release.md) first. `pnpm check` is bisect-safe but doesn't notice:

- Stale counts in `README.md`, `docs/ARCHITECTURE.md`, `package.json#description`.
- Catalog group sections in `README.md` that fell behind the actual taxonomy.
- `e2e/catalog-smoke.spec.ts` exact-count assertions that drifted silently.
- Missing reverse `related[]` references between paired tags.
- An empty `CHANGELOG.md [Unreleased]` section after a wave shipped.
- `src/manifest.publish.ts` not regenerated since the last filtered-publish run.
- A new component shipped without `*.examples.html` when its tier+category require one.
- A new component whose meta passes Zod validation but fails a CDR-derived design-review rule.
- The tarball accidentally including files outside the allow-list.

The protocol's hard blockers (any of which **must stop** the release):

- `pnpm check` fails after one reasonable fix.
- `pnpm test:e2e` fails after one reasonable fix.
- Tarball contains anything outside `dist/`, `README.md`, `LICENSE`.
- `meta.related[]` (or `dependencies[]` / `dependents[]`) references a tag that doesn't exist.
- A required `*.examples.html` is missing.
- `manifest.publish.ts` contains an `internal`-category component.
- A single tag's gzip size jumped ≥ 30 % without explanation in `git log`.

Everything else is **simple drift** the protocol fixes in place.

---

## Step 2 — Pick the semver bump

Defaults that match this library's discipline (ADR-008 additive-only / CDR-008):

| Change | Bump |
|---|---|
| New component, new theme, new optional prop, new optional CSS var | **minor** |
| Bug fix (no API surface change) | **patch** |
| Removed prop, removed component, renamed event, narrowed type | **major** |
| Renamed theme bundle, renamed CSS variable | **major** |
| Behaviour change of an existing stable component | **major** unless explicitly documented as bug-fix in the prior intent |

> **Deprecation, not deletion.** Per CDR-008 / ADR-010 (the `ce-stat-group` precedent): mark stability as `deprecated` in the meta and ship a migration note in the catalog narrative; remove only in a later major release. The deprecation flag is additive; the removal is breaking.

Edit `package.json#version` directly or:

```bash
pnpm version patch --no-git-tag-version
pnpm version minor --no-git-tag-version
pnpm version major --no-git-tag-version
```

`--no-git-tag-version` keeps git out of it; you'll tag explicitly in step 5.

---

## Step 3 — CHANGELOG (if maintained)

This repo treats git history as authoritative; the `CHANGELOG.md [Unreleased]` block is **optional but encouraged** for releases that ship a wave. If maintained:

- Move every component / theme entry from `[Unreleased]` to `[X.Y.Z] — YYYY-MM-DD`.
- Group by `Added` / `Changed` / `Deprecated` / `Removed` / `Fixed`.
- Reference the canonical meta for each new component — one bullet per tag, not one per commit.

If the `[Unreleased]` section is empty after a wave shipped, that's drift — the pre-release protocol step 6 catches it.

---

## Step 4 — Commit

```bash
git add package.json CHANGELOG.md
git commit -m "chore: release vX.Y.Z"
```

One commit. Not amended onto any earlier commit. Co-author footer per repo convention:

```
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

---

## Step 5 — Tag

```bash
git tag vX.Y.Z
```

Tag the release commit, not the prior commit. Annotated tags are fine but not required — the workflow keys off the tag name pattern `v*`.

---

## Step 6 — Push the tag (or publish locally)

### Option A — GitHub Actions provenance (preferred)

```bash
git push origin main
git push origin vX.Y.Z
```

`.github/workflows/publish.yml` fires on `v*` tag push and runs:

```
pnpm install
pnpm check                                    # the same gate as local
pnpm publish --access public --provenance      # npm provenance attestation
```

Provenance gives consumers cryptographic proof the package was built from this repo at this commit. Don't bypass the workflow unless it's broken; if it is, fix the workflow before reaching for local publish.

### Option B — Local publish (fallback)

```bash
pnpm check                                # gate (already green from step 1)
pnpm pack:inspect                         # inspect /tmp/custom-elements-collection-X.Y.Z.tgz
pnpm publish --access public
```

`pnpm publish` triggers `prepublishOnly`. **No `--no-git-checks`** unless you know exactly why.

---

## Step 7 — Post-release verify

```bash
npm view custom-elements-collection version             # → X.Y.Z
npm view custom-elements-collection dist.tarball        # download the published tarball
npm view custom-elements-collection exports             # → expected subpaths

# Smoke-import in a scratch project
mkdir /tmp/cec-smoke && cd /tmp/cec-smoke
pnpm init && pnpm add custom-elements-collection@X.Y.Z
node -e 'import("custom-elements-collection/manifest").then(m => console.log(m.MANIFEST.length))'
```

If the smoke-import fails, the tarball is malformed or the exports map is broken — unpublish-within-72h is possible but harsh on consumers; prefer a follow-up `X.Y.Z+1` with the fix.

---

## Tarball allow-list — the only published surface

```bash
pnpm pack:inspect
tar tzf /tmp/custom-elements-collection-*.tgz | sort > /tmp/release-files.txt

# Allow-list. Output must be empty.
grep -vE '^package/(dist/|package\.json$|README\.md$|LICENSE$)' /tmp/release-files.txt
```

Anything outside `dist/`, `README.md`, `LICENSE`, `package.json` is a **hard blocker**. Common offenders that leak in:

- `internal/`, `demo/`, `e2e/`, `vis/`, `skill/`, `skills/`, `tmp/`, `test-results/`, `node_modules/`, `playwright-report/`.
- Files matching a pattern not yet excluded by `package.json#files`. Fix by tightening the `files` field (allow-list) — never by adding to `.npmignore` (deny-list rots).

Sanity per-tag check inside the tarball:

```bash
# Every shipped tag has its chunk, component, entry, meta, and registry artefacts.
for tag in <new-tags>; do
  grep -E "(chunks|components|entries|meta|registry)/(${tag#ce-}|${tag})" /tmp/release-files.txt | wc -l
done   # ≥ 5 per tag

# No internal-category component published.
tar -xOzf /tmp/custom-elements-collection-*.tgz package/dist/manifest.js | grep -E 'category:\s*"internal"'
# → empty
```

---

## Anti-patterns

- **Tagging before `pnpm check` is green.** The workflow's check is identical; the local one is a no-op preflight.
- **`pnpm publish` from a dirty tree.** `prepublishOnly` regenerates outputs — your dirty tree captures unintended diffs.
- **Hand-editing a generated file just before release.** Drift surfaces on `prepublishOnly`. Find the source-of-truth and edit there.
- **`--force` past `validate-meta`.** Meta drift bricks the registry, the catalog, and `dist/meta/`. Fix the meta, not the gate.
- **Bypassing the simple-git-hooks pre-commit hook** for the release commit. The hook syncs meta-dates; bypass leaves `content-hashes.json` stale and the next release fails `sync-meta-dates:check`.
- **Force-push to `main`.** Tags are immutable on npm; once `vX.Y.Z` is published, the source commit is reproducibility ground-truth. Don't rewrite it.
- **Unpublishing without a follow-up.** Use the 72-hour unpublish window only when the tarball is truly broken; otherwise publish `X.Y.Z+1` with the fix.
- **Mixing a deprecation and its removal in the same release.** Deprecate in `X.Y.Z`; remove in `(X+1).0.0`. CDR-008.
- **Bumping `version` and `description` (component count) in different commits.** They go together — the description's "N components" line is reviewed during the pre-release audit.

---

## Where to look

- [`../../PUBLISHING.md`](../../PUBLISHING.md) — the consumer-facing release doc.
- [`../../docs/protocols/pre-release.md`](../../docs/protocols/pre-release.md) — the audit step 1 invokes.
- [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md) §11 — maintainer-only release section.
- [`../../docs/adr/adr-008-component-concept-files.md`](../../docs/adr/adr-008-component-concept-files.md), [`../../docs/cdr/cdr-008-additive-changes-only.md`](../../docs/cdr/cdr-008-additive-changes-only.md) — additive-only discipline.
- [`../../docs/adr/adr-010-deprecate-stat-group.md`](../../docs/adr/adr-010-deprecate-stat-group.md) — the precedent for deprecation lifecycle.
- `.github/workflows/publish.yml` — the tag-triggered workflow (provenance flow).
- `package.json` — `files`, `exports`, `sideEffects`, `prepublishOnly`, `publishConfig`.
