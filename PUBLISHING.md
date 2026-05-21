# Publishing

`custom-elements-collection` ships through **two channels**:

| Channel | What ships | Where users see it |
|---|---|---|
| **npm** | The library bundle (`dist/`) | <https://www.npmjs.com/package/custom-elements-collection> |
| **Hosted demo** | The interactive catalog (`demo/dist/`) | <https://generativeui.ru/solutions/custom-elements-collection/> |

This document covers the **npm channel** only — it's what this repo drives directly. The hosted demo is updated out-of-band by the site operator from a separate deploy pipeline; see *Hosted demo* at the bottom.

---

## npm — one-time setup

- An `NPM_TOKEN` with publish rights to the `custom-elements-collection` package.
- `~/.npmrc` populated, or the token wired into your CI.

---

## npm — release flow

```bash
# 1. Pick a new version. Either edit package.json by hand or:
pnpm version <patch|minor|major> --no-git-tag-version

# 2. Pre-flight: typecheck + meta validation + tests + build.
pnpm check

# 3. Dry-run the publish to see exactly what would ship.
pnpm pack:inspect
# → /tmp/custom-elements-collection-<version>.tgz
# Verify it contains dist/, README.md, LICENSE, package.json only.

# 4. Publish.
pnpm publish --access public
```

### What `prepublishOnly` does for you

`pnpm publish` triggers `prepublishOnly`, which runs:

1. `pnpm gen-exports` — regenerates `index.ts`, `auto.ts`, `entries/*`, the
   `package.json` `exports` map, and `manifest.ts` from every component's
   `*.meta.json`.
2. `pnpm build-publish-manifest --apply` — finalizes the publish manifest.

That means hand-edits to generated files are silently overwritten at publish
time. Edit the meta (or the source); let the generators rebuild the rest.

### Sanity checklist before tagging

- `pnpm check` is green (typecheck + validate-meta + gen-skill:check + tests + build).
- `pnpm pack:inspect` tarball contains `dist/`, `README.md`, `LICENSE` only — no
  `internal/`, no `demo/`, no `e2e/`, no `vis/`.
- The `exports` map in `package.json` lists every published subpath
  (regenerated automatically; verify via `git diff package.json`).
- `dist/tokens/*.css` are all present (10 theme files).
- `dist/meta/index.json` and `dist/registry.json` are present and current.
- Run `docs/protocols/pre-release.md` — catches drift that `pnpm check` cannot
  (stale README catalogs, reverse `related[]` refs, etc.).

### Versioning

- We track semver with **additive-by-default** changes (see ADR-008 / CDR-008).
  New components, new themes, new optional props → minor bump. Renames, removed
  props, behaviour changes → major bump. Pure bugfixes → patch.
- `version` lives in `package.json` only. We do not maintain a `CHANGELOG.md`
  in lockstep — git history is the authoritative log.

---

## Hosted demo

The interactive catalog at <https://generativeui.ru/solutions/custom-elements-collection/> is built from this repo's `demo/` directory (`pnpm demo:build`) and deployed by the site operator on their own cadence. This repo doesn't drive the deploy.

If you want to host the demo yourself under a URL sub-path:

```bash
DEMO_BASE=/your-path/ pnpm demo:build
# Output → demo/dist/ — serve it under the matching URL prefix.
```

Without `DEMO_BASE`, vite emits asset URLs like `/assets/...` which 404 under
any non-root mount. See [`demo/vite.config.js`](./demo/vite.config.js).
