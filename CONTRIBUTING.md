# Contributing to `custom-elements-collection`

Thanks for opening a PR. This guide covers everything you need to add a component, fix a bug, or refine a doc. If you only read one other file, read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## 1. Quick start

```bash
pnpm install
pnpm demo
```

`pnpm demo` boots the interactive catalog at [`demo/`](demo/) — every shipped tag rendered live, with editable source. That's your sandbox.

If you want to iterate on library source directly, `pnpm dev` runs the Vite dev server against `src/`.

> **`pnpm install` also installs the git pre-commit hook** (via `simple-git-hooks` + the `prepare` script). The hook runs `pnpm sync-meta-dates` on every commit and auto-stages updated meta files — see [§4.4 Dates and content-hash registry](#44-dates-and-content-hash-registry) for the contract.

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
| `pnpm gen-skill`       | Regenerates `skills/cec-consumer/references/catalog.md` and `skills/cec-consumer/references/index.md` from the meta files. |
| `pnpm gen-skill:check` | Drift check used by `pnpm check` — fails when the skill is out of sync with the meta files.                 |
| `pnpm build`           | Vite library build + emits `.d.ts` into `dist/`.                                                            |
| `pnpm check`           | typecheck + validate-meta + gen-skill:check + test + build. **Must pass before you open a PR.**             |
| `pnpm pack:inspect`    | Packs a tarball into `/tmp/` so you can inspect what would ship.                                            |
| `pnpm bundle-stats`    | After `pnpm build`, measures gzip size of every `dist/*.js` and appends a record to `internal/bundle-stats.jsonl` (gitignored). Reports per-group + per-tag deltas vs the previous run. No hard budget — used as an observability tool. |
| `pnpm analyze`         | Production build with bundle composition reports — spatial treemap, sunburst, and chunk-graph network HTML files emitted to `internal/bundle-visualizer-{treemap,sunburst,network}.html`, plus a fresh `bundle-stats.jsonl` record. All outputs gitignored. Run after a noticeable size change to see what moved. |

## 4. Adding a new component

> **Step-by-step procedure with verification gates lives in [`docs/protocols/new-component.md`](docs/protocols/new-component.md).** This section sets out the *design philosophy* and the *rules* the protocol implements. Read both before opening a PR.

### Design philosophy (read before sketching the API)

The primary author of markup that uses this library is a large language model, not a human. That changes how we think about props, required fields, error states, and "wrong" input. Bias toward optional fields, accept multiple input shapes when ergonomically cheap, infer behaviour from data rather than adding `mode` flags, and never punish the end user for an LLM author's omission. The full philosophy and the rules it produces — including when to refuse this lens — live in [ADR-009](docs/adr/adr-009-llm-tolerant-components.md). The daily-design conventions that implement that philosophy live in [`docs/cdr/`](docs/cdr/) (Component Design Records — recommended, not mandatory). Component-level applications of the lens belong in the component's `CONCEPT.md` ([ADR-008](docs/adr/adr-008-component-concept-files.md)). Reference implementations: [`src/components/gauge/`](src/components/gauge/) and [`src/lesson/lesson-quickfire/`](src/lesson/lesson-quickfire/).

**Pre-flight checklist before designing a new public API.** Walk the [8 CDRs](docs/cdr/) as a self-review (the protocol turns this into a one-question-per-CDR gate). Each CDR captures a recurring API-design mistake — a deviation is allowed when justified by user-facing benefit, but the deviation must be documented in the component's `CONCEPT.md`. See [`docs/cdr/README.md`](docs/cdr/README.md) for the compliance levels (ADR = MUST, CDR = SHOULD, CONCEPT.md = MAY).

### Tier picking rule (ADR-006)

- Has internal mutable state, runs interactive logic, or fetches data → `widget`.
- Wraps multiple semantically structured children with named slots → `layout`.
- Otherwise → `brick`.

### When `<name>.examples.html` is required

Driven by `tier` (ADR-006) and `category` in the meta:

| meta state | examples file | rationale |
|---|---|---|
| `tier: brick` AND `category: ui` or `lesson` | **required**, ≥ 3 examples covering the prop matrix | direct end-user surface — humans browse the catalog and LLM code-generators copy from `dist/registry*` |
| `tier: widget` AND `category: ui` or `lesson` | **required**, ≥ 3 examples — at least one showing the interactive / stateful behaviour the widget owns | same audience, more behaviour surface to demonstrate |
| `tier: layout` (any category) | **skip** | layout primitives are slot containers — meaningful examples need real children from neighbouring components and tend to duplicate those components' own examples |
| `category: internal` (any tier) | **skip** | internal components serve the demo / docs site itself, not external consumers; they are not part of the published catalog narrative |

"≥ 3 examples" means three independent `<!-- @example … -->` blocks in the same file — distinct prop combinations, slot patterns, or states. The bar: a reader who has never seen this tag can copy any one block, paste it, and see something representative. If you can only think of one example, the meta description is probably hiding two more.

**`*.examples.html` is markup-only — no `<script>` tags.** Mandatory, not stylistic. Examples become reference material both for the catalog *and* for LLM code-generators that consume `dist/registry*.json`. Script in an example trains LLMs to emit script alongside your component, breaks the "drop a tag in plain HTML" promise from §5, and creates a CSP / untrusted-input footgun. If your example needs structural data, put it on an attribute as JSON (the property must already use `jsonProp()` per §5). Prefer separate properties (`x-label`, `y-label`, `height`, `type`, `color`) over a single JSON blob — keep each example readable. If a feature truly cannot be demonstrated without script, that is a missing-attribute API and the right fix is to extend the component.

### Canonical references

- Source / test / meta / examples shape: [`src/components/card/`](src/components/card/).
- Optional `CONCEPT.md` shape: [`src/components/gauge/CONCEPT.md`](src/components/gauge/CONCEPT.md).

The step-by-step procedure — folder, source skeleton, test skeleton, meta scaffolding, generator catch-up, examples, `pnpm check`, optional `CONCEPT.md`, reverse `related[]` — lives in [`docs/protocols/new-component.md`](docs/protocols/new-component.md). Don't redo it from memory.

### 4.4 Dates and content-hash registry

Every component's `meta.json` carries two **script-managed** ISO-8601 dates:

```jsonc
{
  "created": "2026-05-21",
  "updated": "2026-05-21",
  …
}
```

**Do not edit these by hand.** They are maintained by `scripts/sync-meta-dates.ts`, which fires from the `simple-git-hooks` pre-commit hook on every commit:

- `created` — set once, the first time the meta lands.
- `updated` — bumped automatically when the SHA-256 of the component's `<stem>.ts` changes. Test refactors, example tweaks, doc edits, and meta-prose changes do NOT bump `updated` — only edits to the `<stem>.ts` source itself.

The companion file `src/meta/content-hashes.json` is the global tag → SHA-256 registry. Validated by the same Zod gate. See [ADR-011](docs/adr/adr-011-component-dates.md) and [ADR-012](docs/adr/adr-012-content-hash-registry.md) for the rationale.

If you ever need to invoke manually: `pnpm sync-meta-dates`. To preview without writing: `pnpm sync-meta-dates:dry`. CI-style gate: `pnpm sync-meta-dates:check` (exits non-zero on drift).

Bypass the hook only when debugging: `SKIP_SIMPLE_GIT_HOOKS=1 git commit …`.

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
- [ADR-006 — Component tier](docs/adr/adr-006-component-tier.md): every component is `brick`, `widget`, or `layout` — the tier shapes how much API surface is appropriate.
- [ADR-007 — Component registry](docs/adr/adr-007-component-registry.md): per-component `dist/registry/<tag>.json` plus filtered views, the LLM-tool-use-shaped projection of the meta.
- [ADR-008 — Per-component CONCEPT.md](docs/adr/adr-008-component-concept-files.md): optional sibling file capturing the *why* behind each component's design decisions.
- [ADR-009 — Tolerant components for LLM-driven authoring](docs/adr/adr-009-llm-tolerant-components.md): how we design APIs when the primary author of the markup is a non-deterministic LLM — flexibility, optional fields, data-shape inference, minimum surface. Read before adding props, modes, or required fields.

### Component Design Records (CDR)

CDRs are the **system-wide design conventions** that implement ADR-009 at the daily-design level. They are **RECOMMENDED (SHOULD)**, not **REQUIRED (MUST)** like ADRs — a user-focused exception is allowed, but must be documented in the component's `CONCEPT.md`. The folder index lives at [`docs/cdr/README.md`](docs/cdr/README.md).

- [CDR-001 — Style enum is finite; content text is unbounded → use slots](docs/cdr/cdr-001-style-enum-content-slot.md)
- [CDR-002 — Typed values belong in children, not in string attributes](docs/cdr/cdr-002-typed-values-as-children.md)
- [CDR-003 — Presentation policy is global; markup is data-first](docs/cdr/cdr-003-presentation-policy-global.md)
- [CDR-004 — Static-first; stateful behavior is opt-in](docs/cdr/cdr-004-static-first-stateful-optin.md)
- [CDR-005 — Collections accept both data-array and slot-children](docs/cdr/cdr-005-collections-json-and-slot.md)
- [CDR-006 — Components compose; no hard wrappers](docs/cdr/cdr-006-components-compose.md)
- [CDR-007 — Sensible defaults; zero-attribute usage works for the common case](docs/cdr/cdr-007-sensible-defaults.md)
- [CDR-008 — Additive changes only; deprecate via stability + ADR](docs/cdr/cdr-008-additive-changes-only.md)

## 10. Keeping the AI skills up to date

The repo ships five audience-specific skills under [`skills/`](skills/) — `cec-consumer`, `cec-component-author`, `cec-core-maintenance`, `cec-theming`, `cec-publishing` — plus auto-generated catalog data the skills read from.

**Auto-generated — never hand-edit:**

| File | Source of truth |
| --- | --- |
| `skills/cec-consumer/references/catalog.md` | every `*.meta.json` — written by `pnpm gen-skill` |
| `skills/cec-consumer/references/index.md` | every `*.meta.json` — written by `pnpm gen-skill` |

The `pnpm gen-skill:check` gate in `pnpm check` fails if either file drifted. Run `pnpm gen-skill` after any meta edit; commit the regenerated outputs alongside the meta + source change.

**Hand-authored — edit when the relevant surface changes:**

| File | Update when… |
| --- | --- |
| `skills/cec-consumer/SKILL.md` | install / theming / picking guidance changes; new common pitfall surfaces |
| `skills/cec-consumer/references/picking.md` | a new "which tag for X?" decision case appears |
| `skills/cec-consumer/references/recipes.md` | adding a canonical composition pattern |
| `skills/cec-consumer/references/setup.md` | bundler / framework integration changes; SSR caveat appears |
| `skills/cec-theming/SKILL.md` | theming workflow changes |
| `skills/cec-theming/references/tokens.md` | adding / removing / renaming a `--ce-*` token or shipping a new theme bundle |
| `skills/cec-component-author/SKILL.md` | CDR pre-flight or authoring philosophy changes |
| `skills/cec-core-maintenance/SKILL.md` | schema / generator / build-pipeline conventions change |
| `skills/cec-publishing/SKILL.md` | semver discipline or release flow changes |

Per-component API (props, events, slots, CSS variables) lives in the `*.meta.json` next to each source file. That is the canonical surface; the skills point at it, never duplicate it. Include the hand-authored skill update in the same commit as the change that motivates it; a PR that adds a new theme bundle without updating `skills/cec-theming/references/tokens.md` will be flagged.

---

## 11. Release (maintainers only)

**Before the version bump, run the [pre-release protocol](docs/protocols/pre-release.md).** It is the audit-and-fix-drift step `pnpm check` doesn't do on its own — README catalog drift, stale doc counts, missing reverse `related[]` refs, tarball allow-list, etc. The protocol does not touch git or npm; it returns green or escalates.

Once green:

1. Bump `version` in `package.json`.
2. Commit (`chore: release vX.Y.Z`) and tag `vX.Y.Z`.
3. Push the tag. `.github/workflows/publish.yml` publishes to npm with provenance.

Nothing hand-published. Nothing outside the tagged commit.
