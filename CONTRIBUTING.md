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
  components/  One .ts + one .test.ts per tag (ce-* and lesson-*)
  entries/     One side-effect entry per tag — used as package subpaths
  tokens/      tokens.css + light.css + dark.css (the --ce-* catalog)
  auto.ts      Registers every tag at once
  index.ts     Named exports of every component class
  manifest.ts  Machine-readable catalog (tag, class, subpath, category)
demo/          Playground site — served via `pnpm demo` using demo/vite.config.js
docs/          Architecture, usage, ADRs
dist/          Build output — do not hand-edit; gitignored apart from types
internal/      Scratch; gitignored
```

Depth lives in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Consumer-side patterns live in [`docs/USAGE.md`](docs/USAGE.md). Don't duplicate them here.

## 3. Commands you run daily

**pnpm only. No npm. No yarn.** The lockfile and workspace scripts assume pnpm.

| Command              | What it does                                                      |
| -------------------- | ----------------------------------------------------------------- |
| `pnpm dev`           | Vite dev server against `src/` for hacking on library internals.  |
| `pnpm demo`          | Boots the `demo/` catalog site — the canonical visual sandbox.    |
| `pnpm test`          | Runs vitest (jsdom) once across every `*.test.ts`.                |
| `pnpm typecheck`     | `tsc --noEmit` across the whole project.                          |
| `pnpm build`         | Vite library build + emits `.d.ts` into `dist/`.                  |
| `pnpm check`         | typecheck + test + build. **Must pass before you open a PR.**     |
| `pnpm pack:inspect`  | Packs a tarball into `/tmp/` so you can inspect what would ship.  |

## 4. Adding a new component

Work through this list top to bottom. Every step is required.

1. **Source.** Create `src/components/<name>.ts`. Export a class `Ce<Name>` that extends `CecElement` (from `src/core/base.ts`). Use `ce-<name>` as the registered tag.
2. **Tests.** Create `src/components/<name>.test.ts`. At minimum **6 tests** covering: attribute form of each prop, JS-property form of each prop, default slot rendering, named slot rendering (if any), events fired, one edge/error case.
3. **Side-effect entry.** Create `src/entries/<name>.ts`:
   ```ts
   import { defineOnce } from "../core/index.js";
   import { Ce<Name> } from "../components/<name>.js";
   defineOnce("ce-<name>", Ce<Name>);
   export { Ce<Name> };
   ```
4. **Barrels.** Add the class to `src/auto.ts` (side-effect list) and `src/index.ts` (named export).
5. **Manifest.** Append an entry to `src/manifest.ts` with `name`, `tag`, `className`, `import`, `description`, `category`, and optional `group`.
6. **Package subpath.** In `package.json`, copy an existing `./<name>` block into `exports` so consumers can `import "custom-elements-collection/<name>"`.
7. **Docs row.** Add the component to `demo/docs-data.js` with description, syntax, properties table, and a live example.
8. **Verify.** Run `pnpm check`. Typecheck, tests, and build must all be green.

The canonical reference implementation is [`src/components/card.ts`](src/components/card.ts) — copy its shape.

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
- **Class naming.** `Ce<TagPascal>` — e.g. `ce-feature-card` → `CeFeatureCard`.
- **File naming.** kebab-case, matching the tag minus the `ce-` prefix: `ce-feature-card` → `feature-card.ts`, `feature-card.test.ts`, `entries/feature-card.ts`.
- **Rendering.** Light DOM is the default — it lets markdown, Mermaid, and Chart.js work inside slots (see [ADR-002](docs/adr/adr-002-light-dom.md)). Opt into Shadow DOM only when you need `:host([attr])` selectors or real style isolation; do it by overriding `createRenderRoot()` to return `this.createShadowRootWithStyles()`.
- **Theming.** Never hardcode a hex. Every color, radius, space, shadow, or font size comes from a `--ce-*` token defined in [`src/tokens/tokens.css`](src/tokens/tokens.css). See [ADR-003](docs/adr/adr-003-theming.md).
- **No runtime CDN dependencies.** Components must work offline once imported.
- **Manifest category.** `"ui" | "lesson" | "internal"`. `internal` is reserved for layout primitives consumed only by the demo site itself.

## 7. Testing

- Co-locate: `foo.test.ts` sits next to `foo.ts`.
- Runner: vitest with the jsdom environment (configured in `vitest.config.ts`).
- Register exactly once per test file via `defineOnce("ce-foo", CeFoo)` — re-registration throws.
- After mutating props or DOM, `await el.updateComplete` before asserting against rendered output.
- Minimum **6 tests per component**: attribute-form props, property-form props, default/named slots, events, and at least one edge case (missing data, malformed input, etc.).

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

## 10. Release (maintainers only)

1. Bump `version` in `package.json`.
2. Commit (`chore: release vX.Y.Z`) and tag `vX.Y.Z`.
3. Push the tag. `.github/workflows/publish.yml` publishes to npm with provenance.

Nothing hand-published. Nothing outside the tagged commit.
