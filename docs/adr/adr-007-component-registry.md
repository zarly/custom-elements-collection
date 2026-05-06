# ADR-007 — Component registry for LLM rendering

**Status:** Accepted (2026-05-06).

## Context

The library ships 72 components with rich `*.meta.json` descriptors covering identity, props, events, slots, CSS variables, side effects, and dependency graph. Three forces converge:

1. **Generative-UI market window.** Vercel `streamUI`, Tambo, Thesys C1, A2UI v0.9, CopilotKit, MCP-ui all expect a *catalog* — none of them produces one for you. The library's meta files are 90% of that catalog already.
2. **LLM tool-use is the lingua franca.** Anthropic and OpenAI both accept a `tools[]` array of `{ name, description, input_schema }` records. Each component projects naturally to one such record: tag = name, description = description, props = input_schema.
3. **Filtered access.** Consumers shipping a lessons-only experience or a forms-only experience want a registry slice rather than the full 72-component catalog. Token budget alone forces this — 72 components × ~300 tokens per descriptor ≈ 22 K tokens, which crowds the model's context window.

Today the catalog is exposed as raw `*.meta.json` files (one per tag, plus a combined `dist/meta/index.json`). That is consumable but is not shaped for LLM tool-use: props are described as TS type strings rather than JSON Schema, and there is no canonical "registry" concept distinct from "raw meta dump".

## Decision

A **component registry** is a derived artifact that projects `*.meta.json` data into an LLM-tool-use-shaped JSON document. It lives alongside `dist/meta/`:

```
dist/
  registry.json                  # full registry, single document
  registry/
    by-tier/{brick,widget,layout}.json
    by-group/<group-slug>.json   # one per closed-enum group
    by-category/{ui,lesson,internal}.json
    <tag>.json                   # per-tag descriptor (cherry-pick)
```

### Registry shape

```jsonc
{
  "schemaVersion": 1,
  "library": "custom-elements-collection",
  "version": "0.2.0",
  "generatedAt": "2026-05-06T12:34:56Z",
  "filter": null,                              // or { "axis": "tier", "value": "brick" }
  "components": [
    {
      "tag": "ce-button",
      "name": "Button",
      "className": "CeButton",
      "import": "custom-elements-collection/button",
      "tier": "brick",
      "group": "Forms",
      "category": "ui",
      "stability": "stable",
      "description": "...",
      "goal": "...",
      "input_schema": {                        // JSON Schema for props
        "type": "object",
        "properties": {
          "variant": { "type": "string", "enum": ["primary","ghost"], "description": "..." },
          "label":   { "type": "string", "description": "..." }
        },
        "required": ["label"]
      },
      "events":   [...],                       // { name, detail, description }
      "slots":    [...],                       // { name, description, required? }
      "cssVariables": [...]                    // { name, kind, description }
    }
  ]
}
```

Filtered files share the same shape; only `filter` and `components[]` differ. The shape mirrors Anthropic's tool-use input schema so a consumer can do `{ name: c.tag, description: c.description, input_schema: c.input_schema }` to assemble the `tools[]` array. The Anthropic / OpenAI projection itself is intentionally **not** shipped from this package — it lives in a separate adapter package so library churn does not force consumers off the registry.

### Source of truth

The registry is **derived**, never hand-edited. The generator at `scripts/generate-registry.ts` walks `src/**/*.meta.json` and writes the JSON outputs. The generator is invoked by:

1. The Vite build via the `copyRegistry()` plugin, which runs after `copyMeta()` and emits all `dist/registry*.json` files in one closeBundle pass.
2. `pnpm gen-registry` for standalone runs (testing, debugging).

### TS-type → JSON-Schema translation

Component props use TS type strings (e.g. `"string"`, `"'sm' | 'md'"`, `"CecColor | null"`). The generator parses common patterns:

| TS type | JSON Schema projection |
|---|---|
| `string` | `{ "type": "string" }` |
| `number` | `{ "type": "number" }` |
| `boolean` | `{ "type": "boolean" }` |
| `'a' \| 'b' \| 'c'` (string literal union) | `{ "type": "string", "enum": ["a","b","c"] }` |
| `T \| null` | `{ "type": ["<T>", "null"] }` |
| `T[]` or `Array<T>` | `{ "type": "array", "items": <T> }` |
| Anything else | `{ "type": "string", "description": "<original TS type>" }` (fallback) |

The original TS type string is always preserved in `x-tsType` for round-tripping. Every property carries its `description` from the meta. Required props are listed in `required[]`.

### Schema versioning (I10)

Every `*.meta.json` carries `schemaVersion: 1` (added in this PR). The registry document also carries `schemaVersion: 1`. A future non-additive change bumps both. Consumers can refuse a registry whose `schemaVersion` exceeds the version they were written against.

### Filtered views (I5)

Filtered views are derived in the same generator pass:

- `dist/registry/by-tier/brick.json` etc. — filtered by `tier`
- `dist/registry/by-group/<slug>.json` — one per group from `src/meta/groups.ts`
- `dist/registry/by-category/{ui,lesson,internal}.json`
- `dist/registry/<tag>.json` — single-tag descriptor for cherry-picking

Filenames use a `slugify(group)` helper for groups containing spaces / `&` (e.g. `"Metrics & charts"` → `metrics-and-charts`).

The runtime filter pattern (consumer iterates the full registry) is also supported and trivial — no API surface needed; filter views are conveniences for token-budget-sensitive consumers.

### Package exports

`package.json`'s `exports` map gains:

```json
{
  "./registry": "./dist/registry.json",
  "./registry/*.json": "./dist/registry/*.json"
}
```

Consumers consume via:

```js
import registry from "custom-elements-collection/registry" with { type: "json" };
import bricks   from "custom-elements-collection/registry/by-tier/brick.json" with { type: "json" };
```

## Consequences

### Positive

- **Single derivation, single source of truth.** Editing a meta file flows through to the registry on the next build. No drift possible.
- **LLM-ready.** The `input_schema` field is JSON Schema; the registry can be passed to a tool-use API with at most a one-line projection per record.
- **Token-budget controls.** Filtered views let a consumer ship only the slice the LLM needs. 27-component widget slice ≈ 8 K tokens vs the full 72-component ≈ 22 K.
- **Zero runtime cost** for consumers who don't use it. Registry is opt-in, not in the default bundle.
- **No new prefix, no new dependency.** Pure derivation. Aligns with CLAUDE.md "no CDN or peer-dep at runtime".

### Negative

- **TS → JSON Schema is heuristic.** Complex types fall through to `{ "type": "string", "x-tsType": "..." }`. Consumers that need strict type checking on every prop must read `x-tsType` and parse it themselves. The fallback is documented and predictable.
- **Generator runs every build.** Adds <100 ms to `pnpm build`. Acceptable.
- **Two schemaVersions to keep aligned** (meta vs registry). They drift independently by design — meta v1 may project to registry v1 or v2.

### Neutral

- The registry file is a build artifact, not committed. Operators inspecting the JSON should run `pnpm build` first.

## Alternatives considered

- **Hand-author the registry.** Rejected — drift is the failure mode that ADR-005 was created to prevent.
- **Project meta directly without a registry layer.** Rejected — meta is the *internal* shape (TS types, dependency graph, side effects) and includes fields that don't matter to an LLM (e.g. `cssVariables[].source`). The registry is a curated projection.
- **Ship Anthropic / OpenAI tool-use adapters in this package.** Rejected — `internal/VISION.md` §I11 is now scoped to a separate adapter package. Keeps the library free of vendor-specific surface.
- **Embed the registry inside `dist/meta/index.json`.** Rejected — different shape, different consumers, different versioning cadence.

## Verification

- `pnpm validate-meta` enforces `schemaVersion: 1` on every meta.
- `pnpm build` emits all registry files under `dist/`.
- `tests/registry.test.ts` covers: registry parses against its declared schema, filtered views are subsets, `input_schema` projection of common TS types is correct, slugify correctness for groups containing punctuation.
- Manual: `cat dist/registry.json | jq '.components[0]'` yields a valid Anthropic tool-use record once `name`, `description`, `input_schema` are extracted.

## Related

- ADR-005 (Component Meta JSON files) — the source data.
- ADR-006 (Component tier closed enum) — projects into `tier`.
- Out-of-scope: the Anthropic / OpenAI projection adapter (separate package, future work).
