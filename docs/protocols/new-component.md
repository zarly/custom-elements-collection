# New-component protocol

Step-by-step authoring flow for a single new component, with an explicit verification gate after every step so you never accumulate drift across steps.

> **Scope.** Author one component end-to-end: source, tests, meta, examples, optional `CONCEPT.md`, and the generator catch-up. Returns when the component passes `pnpm check`. Does **not** bump versions, write changelog entries, commit, push, or run the pre-release audit — those happen later, in batches, when a release is cut. See [`pre-release.md`](pre-release.md) for what runs before a release.

## When to run

- Adding a new `ce-*` UI component.
- Adding a new `lesson-*` educational widget.
- Splitting a wrapper into its child component (the typical CDR-005 / CDR-006 follow-up).

Not for: changing an existing component's API (use the meta + source + tests together; if the change is non-trivial, also touch the component's `CONCEPT.md`), adding a theme (see [`add-theme.md`](add-theme.md)), or adding a new design token (see ADR-003 + token-related sections in `docs/ARCHITECTURE.md`).

## Stop conditions

Stop and escalate only on a **hard blocker**:

- `pnpm validate-meta` fails on the new meta and the failure is not a typo in the meta itself.
- `pnpm check` fails after one reasonable fix attempt.
- The CDR self-review (step 0) surfaces a deviation you cannot justify in a sibling `CONCEPT.md` — escalate the API design before writing the source.
- The tier/category combination forces a shape that contradicts an existing ADR — fix the ADR first.

Everything else is part of the normal authoring loop.

## The protocol

### 0 — CDR pre-flight self-review (mandatory)

Before sketching the public API, walk the [8 Component Design Records](../cdr/) and answer each question for your component. Each `no` is either a design fix or a documented deviation in the upcoming `CONCEPT.md`.

| CDR | Question to answer | Default expectation |
|---|---|---|
| [CDR-001](../cdr/cdr-001-style-enum-content-slot.md) | Does any enum-shaped attribute carry domain vocabulary? | No — finite (≤ 5) style enum + default slot for label text. |
| [CDR-002](../cdr/cdr-002-typed-values-as-children.md) | Does any prop named `value` / `v` / `text` / `body` / `content` hold rich content as a `string`? | No — typed values move to the default slot. Form-control `value` is an explicit exception. |
| [CDR-003](../cdr/cdr-003-presentation-policy-global.md) | Does any boolean prop look like document-wide presentation policy (`auto-*`, `show-*`, `compact`, `animated`)? | Default behaviour + CSS custom property, not per-instance boolean. |
| [CDR-004](../cdr/cdr-004-static-first-stateful-optin.md) | Does the component render meaningfully with zero JavaScript state on first paint? | Yes — interactivity is opt-in via `name`, `persist-key`, `interactive`, …, never default. Form controls and modals are inherent exceptions. |
| [CDR-005](../cdr/cdr-005-collections-json-and-slot.md) | Does the component render a collection of 1..N homogeneous items? If so, does it accept **both** a JSON-on-attribute array AND slotted children? | Yes for both — handwritten and generator-emitted authors get the shape they expect. |
| [CDR-006](../cdr/cdr-006-components-compose.md) | Does the component refuse or silently drop arbitrary HTML children? | No — composition is open unless ARIA mandates otherwise. |
| [CDR-007](../cdr/cdr-007-sensible-defaults.md) | Can a useful rendering be produced from the tag with ≤ 2 attributes? | Yes — first `@example` block must demonstrate that minimal shape. |
| [CDR-008](../cdr/cdr-008-additive-changes-only.md) | Does this component remove or narrow any existing API? | No — additive only. Narrowing needs an ADR override. |

Any `no` that you intentionally keep: jot the reason in a one-line note that becomes the seed for the `CONCEPT.md` at step 8.

**Verification gate:** you have a written answer for every row above, including the justified deviations.

### 1 — Pick the folder and name

| Decision | Rule |
|---|---|
| Folder | UI → `src/components/<name>/`. Lesson → `src/lesson/<name>/`. |
| Tag | `ce-<name>` or `lesson-<name>`. Two prefixes only — see [ADR](../adr/). |
| File stem | matches folder (e.g. `ce-feature-card` → folder `feature-card/`, files `feature-card.{ts,test.ts,meta.json,examples.html}`). |
| Class | `Ce<TagPascal>` for UI, `Lesson<TagPascal>` for lesson. |
| Tier (ADR-006) | mutable state / interactive logic / fetches data → `widget`. Wraps multiple semantically structured children with named slots → `layout`. Otherwise → `brick`. |
| Category | `ui`, `lesson`, or `internal` (last reserved for components consumed only by the demo / docs site). |
| Group (the first entry in `tags[]`) | one of [`src/meta/groups.ts`](../../src/meta/groups.ts). |

**Verification gate:** the folder doesn't exist yet, and `pnpm validate-meta` would accept your chosen tag (kebab-case, ≥ 2 hyphen-joined segments) and class name (PascalCase).

### 2 — Source

Create `src/components/<name>/<name>.ts`.

```ts
import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-<name>>` — one-sentence purpose statement.
 *
 * Attributes:
 *   …
 *
 * Slots:
 *   …
 *
 * Events:
 *   …
 */
export class Ce<Name> extends CecElement {
  static override styles = css`
    :host { display: block; background: var(--ce-surface); }
    /* All visual values via --ce-* tokens. No hex literals. */
  `;

  // Opt into Shadow DOM only if you need :host([attr]) selectors or style
  // isolation. Default (light DOM) preserves slot compatibility with markdown,
  // Mermaid, Chart.js, and arbitrary user HTML.
  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) foo = "";

  override render() {
    return html`<slot></slot>`;
  }
}
```

Rules baked into the skeleton:

- Extend `CecElement` (not bare `LitElement`) — gives you Light DOM by default + the `createShadowRootWithStyles()` helper.
- All visual values via `--ce-*` tokens. **No hex literals** (ADR-003).
- For props whose type is `string | number | boolean` use `@property({ type })`. For everything else (arrays, objects, structural data) use `jsonProp()` from `../../core/index.js` — see [CONTRIBUTING.md §5](../../CONTRIBUTING.md#5-the-string-props-rule-important).
- Reflect `boolean` and finite-enum attributes that drive `:host([attr])` selectors.
- Streaming-markdown consumers append slot children **after** upgrade. Never read `this.children` only inside `connectedCallback()` — listen to `slotchange` for late children.

**Verification gate:** `pnpm typecheck` runs clean against just this file (other compiler errors elsewhere are fine; this file is clean).

### 3 — Test

Create `src/components/<name>/<name>.test.ts`. Minimum **6 cases**:

1. Attribute form of each prop.
2. JS-property form of each prop.
3. Default slot rendering.
4. Each named slot (when applicable).
5. Each emitted event with the expected `detail` shape.
6. At least one edge / error case (missing data, malformed input, wrong-type attribute).

Skeleton:

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { Ce<Name> } from "./<name>.js";

beforeAll(() => {
  defineOnce("ce-<name>", Ce<Name>);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as Ce<Name>).updateComplete;
}

describe("<ce-<name>>", () => {
  it("upgrades and renders", async () => {
    const host = mount(`<ce-<name>></ce-<name>>`);
    const el = host.querySelector("ce-<name>") as Ce<Name>;
    await ready(el);
    expect(el.shadowRoot).not.toBeNull();
    host.remove();
  });
  // …5 more, see the rule above.
});
```

Rules:

- `defineOnce` once per test file; re-registration throws.
- `await el.updateComplete` between every mutation and assertion.
- Don't stub `customElements` or `HTMLElement` — vitest uses jsdom which provides both.
- If your test reaches for `DataTransfer` or `DragEvent` (jsdom lacks them), construct a synthetic event with `Object.defineProperty(evt, "dataTransfer", { value: { files: […] } })`.

**Verification gate:** `pnpm test <name>` is green.

### 4 — Meta

Create `src/components/<name>/<name>.meta.json`. The schema lives in [`src/meta/schema.ts`](../../src/meta/schema.ts) — Zod-validated, so the error messages tell you exactly what's missing.

Required fields:

| Field | Notes |
|---|---|
| `schemaVersion` | Literal `1`. |
| `tag` | `ce-<name>` or `lesson-<name>` — kebab-case, ≥ 2 hyphen-joined segments. |
| `name` | Human-readable name (used in catalog headings). |
| `className` | `Ce<TagPascal>` or `Lesson<TagPascal>`. |
| `goal` | ≥ 20 chars. One-sentence single-responsibility statement. |
| `description` | ≥ 20 chars. What the component does, when to reach for it, what's deliberately out of scope. |
| `stability` | `stable` \| `beta` \| `experimental` \| `deprecated`. New components ship `beta` unless you have a specific reason. |
| `props[]` | One entry per `@property`. `name`, `type`, `required`, optional `default`, optional `attribute`, optional `reflect`, `description`. |
| `events[]` | One entry per `dispatchEvent`. `name`, `detail` (TS-style string), `bubbles`, `composed`, `description`. |
| `slots[]` | One entry per slot. `""` for default; `description` required. |
| `cssVariables[]` | Every `var(--ce-*)` actually referenced inside the source. `name`, `kind` (`color` / `size` / `font` / `radius` / `shadow` / `other`), `source` (`token` / `local`), `description`. |
| `globalDependencies[]` | `window.*`, `navigator.*`, `localStorage`, etc. — anything the component reads or writes that is not its own DOM. |
| `sideEffects[]` | `kind` (`log` / `storage` / `network` / `dom` / `timer` / `state` / `other`), `description`, `reason`. |
| `dependents`, `dependencies`, `related` | Tag-name string arrays. Bi-directional `related[]` references are the convention. |
| `category` | `ui` / `lesson` / `internal`. |
| `tier` | `brick` / `widget` / `layout`. |
| `tags[]` | The **first** entry is the manifest group — must be one of [`src/meta/groups.ts`](../../src/meta/groups.ts). Subsequent entries are free-form. |
| `a11y` (optional) | `role` (when explicit) and `notes` (when behaviour is non-obvious). |

Reference: [`src/components/card/card.meta.json`](../../src/components/card/card.meta.json) is the canonical shape.

**Verification gate:** `pnpm validate-meta` passes. If it doesn't, the error message points at the exact field; fix and re-run until clean.

### 5 — Run the generators

```bash
pnpm gen-exports   # → src/index.ts, src/auto.ts, src/entries/<name>.ts, src/manifest.ts, package.json#exports
pnpm gen-skill     # → skill/SKILL.md catalog block + skill/references/index.md
```

Never hand-edit the generator outputs. If a generator output looks wrong, fix the meta or the generator — not the output.

**Verification gate:**

```bash
git status --short | grep -E "^\?\? src/entries/<name>\.ts"   # → new entry exists
grep -c '"./<name>"' package.json                              # → 1
grep -c '"ce-<name>"' src/auto.ts                              # → ≥1
grep -c "<ce-<name>>" skill/SKILL.md                           # → ≥1
```

### 6 — Examples

Required when `tier ∈ {brick, widget}` AND `category ∈ {ui, lesson}`. **Skip** when `tier: layout` OR `category: internal`.

Create `src/components/<name>/<name>.examples.html`. Minimum **3 independent** `<!-- @example … -->` blocks. The first block must satisfy CDR-007 — ≤ 2 attributes beyond the required data and demonstrate the static / default case.

```html
<!-- @example Default -->
<ce-<name>>Body</ce-<name>>

<!-- @example With accent -->
<ce-<name> accent="green">Tinted</ce-<name>>

<!-- @example Stateful / interactive (when applicable) -->
<ce-<name> name="my-field" persist-key="demo">…</ce-<name>>
```

Rules:

- **No `<script>` tags.** Mandatory, not stylistic. Examples become LLM training material via `dist/registry/*` — script in an example trains the LLM to emit script alongside your component, which breaks the "drop a tag in plain HTML" promise.
- For structural data, put it on an attribute as JSON (the property must already use `jsonProp()` per step 2). Prefer separate properties (`x-label`, `height`, `color`) over stuffing everything into one JSON blob — keep each example readable.
- Three blocks means three *distinct* prop combinations / slot patterns / states. The bar: a reader who has never seen this tag can copy any one block, paste it, and see something representative.

**Verification gate:**

```bash
grep -c "<!-- @example" src/components/<name>/<name>.examples.html   # → ≥3
grep -c "<script" src/components/<name>/<name>.examples.html         # → 0
```

### 7 — Verify

```bash
pnpm check
```

Bundles: `typecheck` + `validate-meta` + `gen-skill:check` + `vitest run` + `vite build` + `tsc -p tsconfig.build.json`.

All must be green. If `gen-skill:check` fails, you skipped step 5's `pnpm gen-skill`.

Then a real-browser smoke pass:

```bash
pnpm demo                              # boots http://localhost:4600 (or the next free port)
# visit /#/<tag>, eyeball each example block
```

**Verification gate:** `pnpm check` exits 0; the demo detail page renders without console errors.

### 8 — Optional — `CONCEPT.md`

Drop `src/components/<name>/CONCEPT.md` next to the source when:

- You weighed ≥ 2 options before picking the API shape.
- The component carries a justified CDR deviation (from step 0).
- A future contributor (human or agent) would be tempted to re-litigate a settled decision.

`CONCEPT.md` is prose, not schema-validated, tracked in git, and never published (npm `files` only ships `dist/`). Reference shape: [`src/components/gauge/CONCEPT.md`](../../src/components/gauge/CONCEPT.md). Skip entirely for mechanically obvious components.

Append a new dated entry when a later change overrides a previous decision — don't delete the old reasoning. The file is append-only inside each component's history.

**Verification gate:** for each `no` from the CDR pre-flight that you kept, the reason is documented here.

### 9 — Reverse `related[]` references

If your new component pairs with an existing one (e.g. `ce-tool-result` pairs with `ce-tool-call`), add the new tag to the **existing** component's `related[]` array — the dependency graph reads in both directions.

Useful one-liner to audit reverse refs:

```bash
all_tags=$(find src -name '*.meta.json' -exec jq -r '.tag' {} \; | sort -u)
find src -name '*.meta.json' \
  | while read f; do
      for t in $(jq -r '.related[]?' "$f"); do
        echo "$all_tags" | grep -qx "$t" || echo "DANGLING $t in $f"
      done
    done
```

Rerun `pnpm gen-exports` after editing existing metas (idempotent — usually 0 outputs change).

**Verification gate:** no `DANGLING …` lines from the audit above.

## Output

A new-component run ends with a one-line confirmation in the chat: *"`ce-<name>` (tier=<…>, group=<…>): N tests passing, examples render, demo OK."*

The version bump + CHANGELOG entry + commit happen later, when a release is cut. See [`pre-release.md`](pre-release.md) for the audit that closes the gap between "component lands on `main`" and "release is cut".

## Cross-references

- [CONTRIBUTING.md §4](../../CONTRIBUTING.md) — the policy / philosophy this protocol implements at the mechanical level.
- [CONTRIBUTING.md §5](../../CONTRIBUTING.md) — the string-props rule (`jsonProp()`); referenced from step 2.
- [`docs/cdr/`](../cdr/) — Component Design Records; the pre-flight self-review at step 0 walks all 8.
- [`docs/adr/adr-005-component-meta.md`](../adr/adr-005-component-meta.md) — meta-file schema and the generator pipeline that consumes it.
- [`docs/adr/adr-006-component-tier.md`](../adr/adr-006-component-tier.md) — the brick / widget / layout classification rule referenced at step 1.
- [`docs/adr/adr-008-component-concept-files.md`](../adr/adr-008-component-concept-files.md) — `CONCEPT.md` lifecycle, referenced at step 8.
- [`docs/adr/adr-009-llm-tolerant-components.md`](../adr/adr-009-llm-tolerant-components.md) — the philosophy the CDR pre-flight implements.
- [`pre-release.md`](pre-release.md) — the protocol that runs before a release, after one or more new components have landed.
