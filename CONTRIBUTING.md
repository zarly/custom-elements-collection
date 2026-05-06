# Contributing to `custom-elements-collection`

Thanks for opening a PR. This guide covers everything you need to add a component, fix a bug, or refine a doc. If you only read one other file, read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## 1. Quick start

```bash
pnpm install
pnpm demo
```

`pnpm demo` boots the interactive catalog at [`demo/`](demo/) — every shipped tag rendered live, with editable source. That's your sandbox.

If you want to iterate on library source directly, `pnpm dev` runs the Vite dev server against `src/`.

## 2. Repo layout

```
src/
  core/        CecElement base, jsonProp helper, defineOnce, classNames
  meta/        Zod schema + TS interfaces for the per-component meta files
  components/  One subfolder per tag: <stem>/<stem>.ts + .test.ts + .meta.json
  lesson/      Same shape for lesson-* widgets
  entries/     GENERATED — one side-effect entry per tag (do not hand-edit)
  tokens/      tokens.css + 8 design-school CSS bundles (the --ce-* catalog)
  auto.ts      GENERATED — registers every tag at once
  index.ts     GENERATED — named exports of every component class
  manifest.ts  GENERATED — machine-readable catalog (tag, class, subpath, category)
scripts/       validate-meta.ts, generate-exports.ts, build-publish-manifest.ts
demo/          Playground site — served via `pnpm demo` using demo/vite.config.js
docs/          Architecture, usage, ADRs (incl. ADR-005), COMPONENT_META_PLAN.md
dist/          Build output — do not hand-edit; gitignored apart from types
internal/      Scratch; gitignored
```

Depth lives in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Consumer-side patterns live in [`docs/USAGE.md`](docs/USAGE.md). Don't duplicate them here.

> **Generated files.** `src/index.ts`, `src/auto.ts`, `src/entries/*.ts`, `src/manifest.ts`, and the `exports` map in `package.json` are produced by `scripts/generate-exports.ts` from the per-component `*.meta.json` files. Edit the meta file (and the source `.ts`), not the generated outputs. The generator is idempotent and runs as `prebuild`; run it manually with `pnpm gen-exports`.

## 3. Commands you run daily

**pnpm only. No npm. No yarn.** The lockfile and workspace scripts assume pnpm.

| Command                | What it does                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `pnpm dev`             | Vite dev server against `src/` for hacking on library internals.                                            |
| `pnpm demo`            | Boots the `demo/` catalog site — the canonical visual sandbox.                                              |
| `pnpm test`            | Runs vitest (jsdom) once across every `*.test.ts`.                                                          |
| `pnpm test:e2e`        | Runs Playwright e2e specs in `e2e/` against a real Chromium. Boots `pnpm demo` automatically. First-time setup needs `pnpm test:e2e:install`. |
| `pnpm typecheck`       | `tsc --noEmit` across the whole project.                                                                    |
| `pnpm validate-meta`   | Runs `scripts/validate-meta.ts` — every component must have a sibling `*.meta.json` that passes the schema. |
| `pnpm gen-exports`     | Regenerates `src/index.ts`, `src/auto.ts`, `src/entries/*`, `src/manifest.ts`, and `package.json` exports. Runs automatically as `prebuild`. |
| `pnpm gen-registry`    | Regenerates the LLM-tool-use-shaped registry under `dist/registry*.json`. Runs automatically inside `pnpm build` via the `copyRegistry()` Vite plugin (see [ADR-007](docs/adr/adr-007-component-registry.md)). |
| `pnpm gen-skill`       | Regenerates the catalog block in `skill/SKILL.md` and the full `skill/references/index.md` from the meta files. |
| `pnpm gen-skill:check` | Drift check used by `pnpm check` — fails when the skill is out of sync with the meta files.                 |
| `pnpm build`           | Vite library build + emits `.d.ts` into `dist/`.                                                            |
| `pnpm check`           | typecheck + validate-meta + gen-skill:check + test + build. **Must pass before you open a PR.**             |
| `pnpm pack:inspect`    | Packs a tarball into `/tmp/` so you can inspect what would ship.                                            |
| `pnpm bundle-stats`    | After `pnpm build`, measures gzip size of every `dist/*.js` and appends a record to `internal/bundle-stats.jsonl` (gitignored). Reports per-group + per-tag deltas vs the previous run. No hard budget — used as an observability tool. |
| `pnpm analyze`         | Production build with bundle composition reports — spatial treemap, sunburst, and chunk-graph network HTML files emitted to `internal/bundle-visualizer-{treemap,sunburst,network}.html`, plus a fresh `bundle-stats.jsonl` record. All outputs gitignored. Run after a noticeable size change to see what moved. |

## 4. Adding a new component

Since [ADR-005](docs/adr/adr-005-component-meta.md) the flow is mostly automated. Work through this list top to bottom; every step is required.

1. **Pick a folder.** UI tag → `src/components/<name>/`. Lesson tag → `src/lesson/<name>/`. The folder name matches the file stem (e.g. `feedback-bar/`).
2. **Source.** Create `src/components/<name>/<name>.ts`. Export a class `Ce<Name>` that extends `CecElement` (from `src/core/base.ts`). Use `ce-<name>` as the registered tag (or `lesson-<name>` for the lesson pack).
3. **Tests.** Create `src/components/<name>/<name>.test.ts`. At minimum **6 tests** covering: attribute form of each prop, JS-property form of each prop, default slot rendering, named slot rendering (if any), events fired, one edge/error case. Mirror the shape of `src/components/card/card.test.ts`.
4. **Meta file.** Create `src/components/<name>/<name>.meta.json`. The schema (`src/meta/schema.ts`) is enforced by `pnpm validate-meta` — required fields are `schemaVersion: 1`, `tag`, `name`, `className`, `goal` (≥20 chars SRP statement), `description` (≥20 chars), `stability` (`stable` | `beta` | `experimental` | `deprecated`), `props[]`, `events[]`, `slots[]`, `cssVariables[]`, `globalDependencies[]`, `sideEffects[]`, `dependents[]`, `dependencies[]`, `related[]`, `category` (`ui` | `lesson` | `internal`), `tier` (`brick` | `widget` | `layout`, see [ADR-006](docs/adr/adr-006-component-tier.md)), and `tags[]` (the first tag becomes the manifest `group` — must be one of `src/meta/groups.ts`). Mirror an existing meta file — `src/components/card/card.meta.json` is a good reference.

   **Tier picking rule** (ADR-006 §"Classification rule"): has internal mutable state, runs interactive logic, or fetches data → `widget`. Wraps multiple semantically structured children with named slots → `layout`. Otherwise → `brick`.
5. **Generate exports.** Run `pnpm gen-exports`. The script regenerates `src/index.ts`, `src/auto.ts`, `src/entries/<name>.ts`, `src/manifest.ts`, and adds the `./<name>` entry to `package.json` `exports`. Do not edit those generated files by hand.
6. **Regenerate the skill catalog.** Run `pnpm gen-skill`. The script refreshes the catalog block in `skill/SKILL.md` and `skill/references/index.md` from the meta files. `pnpm check` will fail if you skip this.
7. **Demo example (optional).** If you want a live snippet on the catalog page, drop a `<name>.examples.html` next to your source. Each example begins with an HTML comment delimiter — multiple examples per file are fine:
   ```html
   <!-- @example Default -->
   <ce-foo>Body</ce-foo>

   <!-- @example With accent -->
   <ce-foo accent="green">Tinted</ce-foo>
   ```
   The catalog renders props/events/slots/CSS-vars straight from the meta file; `*.examples.html` only carries rendered HTML snippets, parsed by [`demo/parse-examples.js`](demo/parse-examples.js). The demo discovers files via `import.meta.glob`, so renames travel with the folder.
8. **Verify.** Run `pnpm check`. Typecheck, validate-meta, gen-skill:check, tests, and build must all be green.

The canonical reference implementation is [`src/components/card/`](src/components/card/) — copy its shape.

## 5. The string-props rule (important)

Custom-element attributes are always strings. That means any property whose type is NOT `string | number | boolean` — arrays, objects, tuples, anything structural — **must accept a JSON-stringified attribute**. Consumers should be able to drop your tag into a plain HTML page with no `<script>`.

Use the `jsonProp()` helper from [`src/core/json-prop.ts`](src/core/json-prop.ts). It wraps `@property()` with a `fromAttribute`/`toAttribute` converter that parses with try/catch and falls back (plus a `console.warn`) on malformed JSON.

**Before — broken in static HTML:**

```ts
@property({ type: Array })
rows: BarRow[] = [];
```

**After — works everywhere:**

```ts
import { jsonProp } from "../core/index.js";

@property(jsonProp<BarRow[]>([]))
rows: BarRow[] = [];
```

JS assignment (`el.rows = [...]`) keeps working. Attribute form also works:

```html
<ce-bar-chart rows='[{"label":"A","value":1}]'></ce-bar-chart>
```

## 6. Conventions

- **Tag prefix.** `ce-*` (UI building blocks) or `lesson-*` (educational widgets) only. A new prefix needs an ADR.
- **Class naming.** `Ce<TagPascal>` — e.g. `ce-feature-card` → `CeFeatureCard`. Lesson uses `Lesson<TagPascal>` — e.g. `lesson-quiz` → `LessonQuiz`.
- **File naming.** kebab-case, matching the tag minus the `ce-` prefix: `ce-feature-card` → folder `feature-card/`, source `feature-card.ts`, test `feature-card.test.ts`, meta `feature-card.meta.json`.
- **Rendering.** Light DOM is the default — it lets markdown, Mermaid, and Chart.js work inside slots (see [ADR-002](docs/adr/adr-002-light-dom.md)). Opt into Shadow DOM only when you need `:host([attr])` selectors or real style isolation; do it by overriding `createRenderRoot()` to return `this.createShadowRootWithStyles()`.
- **Theming.** Never hardcode a hex. Every color, radius, space, shadow, or font size comes from a `--ce-*` token defined in [`src/tokens/tokens.css`](src/tokens/tokens.css). See [ADR-003](docs/adr/adr-003-theming.md).
- **No runtime CDN dependencies.** Components must work offline once imported.
- **Manifest category.** `"ui" | "lesson" | "internal"`. `internal` is reserved for layout primitives consumed only by the demo site itself.

## 7. Testing

### Unit (vitest, jsdom)

- Co-locate: `foo.test.ts` sits next to `foo.ts`.
- Runner: vitest with the jsdom environment (configured in `vitest.config.ts`).
- Register exactly once per test file via `defineOnce("ce-foo", CeFoo)` — re-registration throws.
- After mutating props or DOM, `await el.updateComplete` before asserting against rendered output.
- Minimum **6 tests per component**: attribute-form props, property-form props, default/named slots, events, and at least one edge case (missing data, malformed input, etc.).

### End-to-end (Playwright, real Chromium)

Specs live in `e2e/*.spec.ts`. Use Playwright when jsdom misses real-browser semantics:

- `ElementInternals` form association (e.g. `<ce-rating name="…">` participating in `FormData`).
- Storage hydration on full page reload (`<ce-feedback-sink>` rebuilding state from `localStorage`).
- Custom-element upgrade ordering inside the demo's `auto.ts` import.
- Anything that depends on real layout, focus, or paint.

Workflow:

```bash
pnpm test:e2e:install    # one-time: download Chromium for Playwright
pnpm test:e2e            # boots `pnpm demo`, runs every spec headless
pnpm test:e2e:ui         # interactive UI for debugging a single spec
```

The Playwright config (`playwright.config.ts`) starts the demo dev server on port 4600, retries flaky tests twice in CI, and writes traces + screenshots into `playwright-report/` on failure (gitignored).

Add an e2e spec when:

- A jsdom unit test would have to stub the platform behaviour you actually care about.
- A regression would only surface in real browsers (focus traps, IME composition, paint timing, paint-driven animation, real Storage events, etc.).

Otherwise prefer the cheaper unit test.

## 8. Commit and PR

- One commit per logical change. Small, reviewable, revertable.
- Prefix the subject with a scope: `<scope>: <summary>` — e.g. `ui: add ce-foo`, `core: extract json helper`, `docs: fix adr-003 link`.
- Do not skip hooks. Do not amend commits that are already on `main`.
- Before opening the PR, run `pnpm check` locally. CI (`.github/workflows/ci.yml`) runs the same gate — both must be green.
- Describe **what** changed and **why**. Link the issue or ADR if one exists.

## 9. Design decisions (ADRs)

When in doubt, read the ADR first.

- [ADR-001 — Framework choice](docs/adr/adr-001-framework-choice.md): we use Lit 3, not vanilla CE, Preact, or Stencil.
- [ADR-002 — Light DOM by default](docs/adr/adr-002-light-dom.md): Shadow DOM is opt-in per component when isolation matters.
- [ADR-003 — Theming via CSS custom properties](docs/adr/adr-003-theming.md): consumers override any `--ce-*` token.
- [ADR-004 — Distribution modes](docs/adr/adr-004-distribution-modes.md): inline, linked-local, linked-cdn — and why all three matter.
- [ADR-005 — Component meta JSON files](docs/adr/adr-005-component-meta.md): every component carries a `*.meta.json` validated by Zod; `index.ts`, `auto.ts`, `entries/`, and `manifest.ts` are generated from it.

## 10. Keeping the AI skill up to date

The file [`skill/SKILL.md`](skill/SKILL.md) is a machine-readable reference used by AI coding assistants. It contains the full component API surface: props, slots, events, CSS tokens, and composition examples. It **must stay in sync with the source**.

**When to update it:**

| Change | Required update |
| --- | --- |
| Add a new component | Add a new `#### <ce-tag>` section with all props, slots, events, and a usage example |
| Delete a component | Remove its section entirely |
| Add / remove / rename a prop | Update the prop table in the component's section |
| Add / remove a slot | Update the Slots table |
| Add / remove an event | Update the Events table |
| Change a prop's type or default | Update the table row |
| Add a new design token (`--ce-*`) | Add it to the relevant token table |
| Remove or rename a token | Remove / rename in the token tables |

**How to update:**

Edit `skill/SKILL.md` directly. The format is plain Markdown — no build step needed. Keep the structure consistent with existing sections:

```
#### `<ce-tag-name>`

One-line description.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `name` | `type` | `default` | … |

**Slots:** …

**Events:** …

Usage example (code block)
```

Include the `skill/SKILL.md` change in the **same commit** as your component change. A PR that adds/modifies a component but does not update the skill will be flagged in review.

---

## 11. Release (maintainers only)

1. Bump `version` in `package.json`.
2. Commit (`chore: release vX.Y.Z`) and tag `vX.Y.Z`.
3. Push the tag. `.github/workflows/publish.yml` publishes to npm with provenance.

Nothing hand-published. Nothing outside the tagged commit.
