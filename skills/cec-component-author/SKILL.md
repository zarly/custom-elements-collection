---
name: cec-component-author
description: USE WHENEVER adding, modifying, deprecating, or reviewing a `ce-*` UI component or `lesson-*` educational widget in `custom-elements-collection` — anything that touches `src/components/<name>/` or `src/lesson/<name>/`, the per-component meta JSON, `<name>.examples.html`, the component's tests, or a sibling `CONCEPT.md`. Trigger phrases: "add a component", "new ce-", "new lesson-", `*.meta.json`, `*.examples.html`, `jsonProp`, "tier brick/widget/layout", "CDR pre-flight", "category ui/lesson/internal", `CONCEPT.md`, "Light DOM default", `CecElement`, `defineOnce`, "≥6 vitest cases", "reverse `related[]`", `pnpm validate-meta`, `pnpm gen-skill`, "split a wrapper into a child" (CDR-005/006). SKIP for consumer markup (`cec-consumer`), changes to core plumbing / generators / schema / `src/core/` / `src/meta/` (`cec-core-maintenance`), new `src/tokens/<slug>.css` theme bundles (`cec-theming`), or release/publish work (`cec-publishing`).
---

# Authoring a `ce-*` or `lesson-*` component

The primary author of markup that uses this library is a non-deterministic LLM, not a human. **That changes every API-design call you make.** Bias toward optional fields, accept multiple input shapes when ergonomically cheap, infer behaviour from data rather than `mode` flags, never punish the end user for an LLM author's omission. The philosophy lives in [`../../docs/adr/adr-009-llm-tolerant-components.md`](../../docs/adr/adr-009-llm-tolerant-components.md); the daily-design rules that implement it live in [`../../docs/cdr/`](../../docs/cdr/).

> **Canonical step-by-step lives in [`../../docs/protocols/new-component.md`](../../docs/protocols/new-component.md).** This skill is the orientation layer + the pre-flight checklist. The protocol is authoritative on every step; do not re-derive it from memory.

---

## When to use

- Adding a new `ce-*` or `lesson-*` tag.
- Changing an existing component's public API (props, events, slots, CSS vars).
- Splitting a wrapper into its child component (the typical CDR-005 / CDR-006 follow-up).
- Drafting or updating a sibling `CONCEPT.md` (ADR-008).
- Authoring or rewriting an `*.examples.html`.

## When NOT to use

- Editing `src/core/` (the `CecElement` base, `jsonProp`, `defineOnce`) → `cec-core-maintenance`.
- Touching `src/meta/schema.ts`, `src/meta/groups.ts`, `src/meta/tiers.ts`, or the generators in `scripts/` → `cec-core-maintenance`.
- Adding a new `src/tokens/<slug>.css` bundle → `cec-theming`.
- Bumping `package.json#version` or running `pnpm publish` → `cec-publishing`.

---

## Pre-flight — walk the 11 CDRs before sketching the public API

This is the **mandatory step 0** from [`new-component.md`](../../docs/protocols/new-component.md). Every `no` is either a design fix or a deviation documented in the upcoming sibling `CONCEPT.md` (`Deviation: CDR-NNN — <one-line reason>` in the PR description).

| CDR | Question | Default expectation |
|---|---|---|
| [001](../../docs/cdr/cdr-001-style-enum-content-slot.md) | Does any enum-shaped attribute carry domain vocabulary? | No — finite (≤ 5) style enum + default slot for label text. |
| [002](../../docs/cdr/cdr-002-typed-values-as-children.md) | Does any prop named `value`/`text`/`body`/`content` hold rich content as a `string`? | No — typed values move to the default slot. Form-control `value` is an explicit exception. |
| [003](../../docs/cdr/cdr-003-presentation-policy-global.md) | Does any boolean look like document-wide policy (`auto-*`, `show-*`, `compact`, `animated`)? | Default behaviour + CSS custom property, not per-instance boolean. |
| [004](../../docs/cdr/cdr-004-static-first-stateful-optin.md) | Does the component render meaningfully with zero JS state on first paint? | Yes — interactivity opt-in via `name`, `persist-key`, `interactive`. Form controls and modals are inherent exceptions. |
| [005](../../docs/cdr/cdr-005-collections-json-and-slot.md) | Does it render a collection? If so, does it accept BOTH a JSON-on-attribute array AND slotted children? | Yes for both — handwritten and generator-emitted authors get the shape they expect. |
| [006](../../docs/cdr/cdr-006-components-compose.md) | Does it refuse or silently drop arbitrary HTML children? | No — composition is open unless ARIA mandates otherwise. |
| [007](../../docs/cdr/cdr-007-sensible-defaults.md) | Can a useful rendering be produced with ≤ 2 attributes? | Yes — first `@example` block must demonstrate that minimal shape. |
| [008](../../docs/cdr/cdr-008-additive-changes-only.md) | Does this remove or narrow an existing API? | No — additive only. Narrowing needs an ADR override. |
| [009](../../docs/cdr/cdr-009-deterministic-dom.md) | For static-tier components — does rendered DOM contain `Math.random`, `Date.now`, `crypto.randomUUID`, resize-derived values? | No — exceptions need `// cec-allow-nondeterministic: <reason>`. |
| [010](../../docs/cdr/cdr-010-same-data-multiple-views.md) | Does any attribute switch the renderer (`view=`/`as=`/`kind=`/`variant=`) to something a sibling tag does or could? Sort/filter/group attribute? | No — ship sibling tags for renderer swaps; sort/filter/group is the consumer's job. |
| [011](../../docs/cdr/cdr-011-llm-failure-mode-tolerance.md) | Does it handle the six LLM failure modes (FM-1..FM-6) with documented degrade paths and per-mode tests? | Yes — `meta.failureModes[]` declares which apply; per-mode test under `tests/llm-failure-modes/`. |

For each `no` you intentionally keep, jot a one-line note — it becomes the seed for the sibling `CONCEPT.md`.

---

## Decision points before file creation

| Decision | Rule |
|---|---|
| **Folder** | UI → `src/components/<name>/`. Lesson → `src/lesson/<name>/`. |
| **Tag** | `ce-<name>` or `lesson-<name>` — two prefixes only. A new prefix needs an ADR. |
| **File stem** | kebab-case, matches the folder. `ce-feature-card` → folder `feature-card/`, files `feature-card.{ts,test.ts,meta.json,examples.html}`. |
| **Class** | `Ce<TagPascal>` for UI, `Lesson<TagPascal>` for lesson. |
| **Tier** (ADR-006) | Mutable state / interactive logic / fetches data → `widget`. Wraps multiple semantically structured children with named slots → `layout`. Otherwise → `brick`. |
| **Category** | `ui` \| `lesson` \| `internal`. `internal` is consumed only by the demo / docs site. |
| **Group** (first entry in `tags[]`) | Must be one of [`../../src/meta/groups.ts`](../../src/meta/groups.ts). |

---

## Source skeleton (the rules baked into it)

```ts
import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

export class Ce<Name> extends CecElement {
  static override styles = css`
    :host { display: block; background: var(--ce-surface); }
    /* All visual values via --ce-* tokens. No hex literals. */
  `;

  // Opt into Shadow DOM only when you need :host([attr]) or style isolation.
  // Default (light DOM) preserves slot compat with markdown, Mermaid, Chart.js.
  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) foo = "";
  @property(jsonProp<Row[]>([])) rows: Row[] = [];   // arrays/objects → jsonProp

  override render() { return html`<slot></slot>`; }
}
```

Hard rules:

- Extend `CecElement` — gives Light DOM by default + `createShadowRootWithStyles()`. Never `attachShadow` directly (Lit's static styles get stripped).
- Every visual value comes from a `--ce-*` token. **Hex literals are banned in component source** (ADR-003); Stylelint enforces it.
- `string | number | boolean` props use `@property({ type })`. Everything else uses `jsonProp()` so attributes still work in plain HTML — see [CONTRIBUTING.md §5](../../CONTRIBUTING.md#5-the-string-props-rule-important).
- Reflect `boolean` and finite-enum attrs that drive `:host([attr])` selectors.
- **Streaming-aware:** consumers stream slot children in *after* upgrade. Listen to `slotchange`; never read `this.children` only inside `connectedCallback()`.

---

## Tests — minimum 6 cases per component

`vitest` + jsdom. Co-locate `<name>.test.ts` next to `<name>.ts`.

1. Attribute form of each prop.
2. JS-property form of each prop.
3. Default slot rendering.
4. Each named slot.
5. Each emitted event with the expected `detail` shape.
6. ≥ 1 edge / error case (missing data, malformed input, wrong-type attribute).

Use `defineOnce("ce-<name>", Ce<Name>)` once per test file. `await el.updateComplete` between every mutation and assertion. If a behaviour needs a real browser (`ElementInternals`, focus traps, real `Storage` events, paint timing), add a Playwright spec under `e2e/*.spec.ts` instead — `pnpm test:e2e:install` once, then `pnpm test:e2e`.

---

## Meta JSON — the canonical API surface

Validated by Zod ([`../../src/meta/schema.ts`](../../src/meta/schema.ts)). Drift from sibling source is a hard blocker. Required fields:

| Field | Notes |
|---|---|
| `schemaVersion` | Literal `1`. |
| `tag` | `ce-<name>` or `lesson-<name>`. |
| `name`, `className` | Human + PascalCase. |
| `goal`, `description` | ≥ 20 chars each. `goal` is one-sentence single-responsibility. |
| `stability` | `stable` \| `beta` \| `experimental` \| `deprecated`. New components ship `beta`. |
| `props[]` | name / type / required / optional default / optional attribute / optional reflect / description. |
| `events[]` | name / detail (TS-style string) / bubbles / composed / description. |
| `slots[]` | `""` for default; description required. |
| `cssVariables[]` | Every `var(--ce-*)` actually referenced. name / kind (`color`/`size`/`font`/`radius`/`shadow`/`other`) / source (`token`/`local`) / description. |
| `globalDependencies[]` | `window.*`, `navigator.*`, `localStorage` — anything read/written outside its own DOM. |
| `sideEffects[]` | kind (`log`/`storage`/`network`/`dom`/`timer`/`state`/`other`) + description + reason. |
| `dependents`, `dependencies`, `related` | Tag strings. **Reverse `related[]` is mandatory** — if you pair with an existing tag, edit *its* meta too. |
| `category`, `tier` | See decision points above. |
| `tags[]` | First entry is the manifest group (must be in `src/meta/groups.ts`). Rest are free-form. |
| `a11y` (optional) | Set `role` and `notes` when behaviour isn't obvious. |

`created` / `updated` are **script-managed** via `scripts/sync-meta-dates.ts` (pre-commit hook). Don't hand-edit them (ADR-011, ADR-012). The companion `src/meta/content-hashes.json` is the SHA-256 registry — also auto-managed.

Reference: [`../../src/components/card/card.meta.json`](../../src/components/card/card.meta.json) is the canonical shape.

---

## `*.examples.html` — required for tier ∈ {brick, widget} AND category ∈ {ui, lesson}

≥ 3 independent `<!-- @example … -->` blocks. First block must satisfy CDR-007 (≤ 2 attributes beyond required data, demonstrating the zero-state default).

```html
<!-- @example Default -->
<ce-<name>>Body</ce-<name>>

<!-- @example With accent -->
<ce-<name> accent="green">Tinted</ce-<name>>

<!-- @example Stateful -->
<ce-<name> name="my-field" persist-key="demo">…</ce-<name>>
```

**No `<script>` tags. Ever.** These examples become LLM training material via `dist/registry/*` — script in an example trains the LLM to emit script alongside your tag and breaks the "plain HTML, no script" contract from [CONTRIBUTING.md §5](../../CONTRIBUTING.md#5-the-string-props-rule-important). For structural data: JSON-on-attribute (the prop must already use `jsonProp()`). Prefer separate properties (`x-label`, `y-label`, `height`, `color`) over one big JSON blob — readability matters.

Skip examples only when `tier: layout` OR `category: internal`.

---

## Generator catch-up

```bash
pnpm gen-exports   # → src/index.ts, src/auto.ts, src/entries/<name>.ts, src/manifest.ts, package.json#exports
pnpm gen-skill     # → ../cec-consumer/references/catalog.md + ../cec-consumer/references/index.md
```

These run as `prebuild`; you can also invoke them directly. **Never hand-edit the generator outputs.** If output looks wrong, fix the meta or the generator — not the output. The generated set: `src/index.ts`, `src/auto.ts`, `src/entries/*`, `src/manifest.ts`, `src/manifest.publish.ts`, `package.json#exports`, the auto-generated `../cec-consumer/references/catalog.md` and `../cec-consumer/references/index.md`, and everything under `dist/registry*`.

---

## `CONCEPT.md` — optional sibling for "why" (ADR-008)

Drop `src/components/<name>/CONCEPT.md` next to the source when:

- You weighed ≥ 2 options before picking the API shape.
- The component carries a justified CDR deviation from the pre-flight.
- A future contributor (human or agent) would be tempted to re-litigate a settled decision.

Prose, not validated, tracked in git, **never published** (npm `files` only ships `dist/`). Append-only — when a later change overrides a previous decision, add a dated entry; don't delete the old reasoning. Canonical shape: [`../../src/components/gauge/CONCEPT.md`](../../src/components/gauge/CONCEPT.md). Skip entirely for mechanically obvious components.

---

## Verify before opening a PR

```bash
pnpm check          # typecheck + validate-meta + gen-skill:check + lint + tests + build
pnpm demo           # eyeball each @example block at http://localhost:4600/#/<tag>
```

If `gen-skill:check` fails, you skipped `pnpm gen-skill` after editing the meta. If `validate-meta` fails, the error names the exact field. Test count must not drop — a drop is "someone deleted tests" and is a blocker.

---

## Anti-patterns (specific to this library)

- **Hex literal in the source.** Stylelint catches most; the `text-inverse` overrides are the only documented exception.
- **`<script>` inside `*.examples.html`.** Strip and re-author as JSON-on-attribute + slot. If a feature genuinely cannot be demonstrated without script, that's a missing-attribute API — extend the component.
- **`@property({ type: Array })` for structural data.** Breaks plain-HTML usage. Use `jsonProp()`.
- **Hand-editing a generated file.** Drift surfaces as a `gen-skill:check` blocker on the next `pnpm check`. Fix the source-of-truth (meta or generator).
- **Adding a vocabulary enum** (`type="success|failure|risk-flag"`) — fails CDR-001. Style enum stays finite; vocabulary belongs in the slot.
- **Forgetting reverse `related[]`.** If your new tag pairs with `ce-tool-call`, edit `ce-tool-call`'s meta too. The pre-release protocol catches dangling refs, but it's easier to fix now.
- **Single-author bias.** "It's easier for me" is not a CDR justification — "the end user sees X clearer / faster / more accessibly" is.
- **Bypassing the pre-commit hook** (`SKIP_SIMPLE_GIT_HOOKS=1`) for convenience. Then `pnpm sync-meta-dates:check` fails on the next release. Don't bypass unless debugging.

---

## Where to look

- [`../../docs/protocols/new-component.md`](../../docs/protocols/new-component.md) — the canonical step-by-step with verification gates.
- [`../../docs/cdr/`](../../docs/cdr/) — the 11 Component Design Records.
- [`../../docs/adr/`](../../docs/adr/) — architectural decisions (ADR-001..014). Especially ADR-002 (Light DOM), ADR-003 (theming), ADR-005 (meta), ADR-006 (tier), ADR-008 (CONCEPT.md), ADR-009 (LLM-tolerant components).
- [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md) — §4 (authoring philosophy) and §5 (string-props rule).
- [`../../src/components/card/`](../../src/components/card/) — canonical reference component (source / test / meta / examples).
- [`../../src/components/gauge/CONCEPT.md`](../../src/components/gauge/CONCEPT.md) — canonical `CONCEPT.md` shape.
- [`../../src/lesson/lesson-quickfire/`](../../src/lesson/lesson-quickfire/) — reference for a stateful lesson widget.
- [`../../src/meta/schema.ts`](../../src/meta/schema.ts) — Zod schema (the only authority on what `validate-meta` accepts).
- [`../../src/meta/groups.ts`](../../src/meta/groups.ts) — allow-list for `tags[0]`.
