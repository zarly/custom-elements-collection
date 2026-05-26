# Setup

Three install paths. Pick the one that matches your environment.

---

## Path A — CDN (zero install)

Drop into any HTML page. Lit is bundled inside the library — no peers to resolve.

```html
<!doctype html>
<html data-ce-theme="dark">
  <head>
    <link rel="stylesheet"
          href="https://unpkg.com/custom-elements-collection/dist/tokens/tokens.css">
    <script type="module"
            src="https://unpkg.com/custom-elements-collection/dist/auto.js"></script>
  </head>
  <body>
    <!-- every ce-* and lesson-* tag is registered -->
  </body>
</html>
```

Swap to a different CDN (jsDelivr, esm.sh) if unpkg latency hurts. The shape is the same.

---

## Path B — npm + bundler

```bash
pnpm add custom-elements-collection
```

Then choose one of three registration modes — pick the smallest one that works for your page.

```ts
// (1) Register everything (simplest)
import "custom-elements-collection/auto";

// (2) Tree-shake to one tag at a time (smallest bundle)
import "custom-elements-collection/hero";
import "custom-elements-collection/kpi";
import "custom-elements-collection/feedback-sink";
import "custom-elements-collection/lesson-quiz";

// (3) Register at runtime, on demand
import { loadOnDemand } from "custom-elements-collection";
await loadOnDemand(["ce-hero", "ce-kpi", "lesson-rule"]);
```

Mode (2) is what ADR-005 calls a "tree-shakable entry point". Each subpath registers exactly its one tag and pulls in only the code that tag needs. Use it inside chat / dashboard apps where you ship a known fixed set of components.

### Optional — meta JSON for tooling

For build-time docs generation, dev tools, or self-describing UIs, you can also import the per-component meta files. **No runtime cost**: meta is only loaded if you import it.

```ts
// Single component's meta
import meta from "custom-elements-collection/meta/ce-card.json"
  with { type: "json" };

// Bundle of every component
import bundle from "custom-elements-collection/meta"
  with { type: "json" };
console.log(Object.keys(bundle));  // ["ce-bar-chart", "ce-bookmark", ...]
```

The same files are queryable from a CLI: `node node_modules/custom-elements-collection/dist/meta/index.json | jq '...'`, or from the repo via `node scripts/components.mjs --help`.

---

## Path C — vendored static files

If your environment forbids CDNs and bundlers (e.g. some intranet Wikis, government sandboxes), copy `node_modules/custom-elements-collection/dist/` into your `public/` folder and link it via relative paths. The tarball has no Node-specific shims; everything in `dist/` runs in browsers.

---

## Theming

Always link `tokens.css` first, then optionally one or more theme bundles. See `tokens.md` for the full list of 11 themes and their tokens.

```html
<link rel="stylesheet" href="https://unpkg.com/custom-elements-collection/dist/tokens/tokens.css">
<link rel="stylesheet" href="https://unpkg.com/custom-elements-collection/dist/tokens/solarized.css">
```

```html
<html data-ce-theme="solarized">
```

---

## Framework notes

The library ships **standard custom elements**, so any framework that lets you render unknown HTML tags works.

### Vue 3

`vite.config.ts`:

```ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith("ce-") || tag.startsWith("lesson-"),
        },
      },
    }),
  ],
});
```

`main.ts`:

```ts
import "custom-elements-collection/auto";
import "custom-elements-collection/tokens.css";
```

### React / Preact

React 19+ supports custom elements directly. For 18 and below, use the `@property={value}` form for non-string props or wrap with `react-wrap-balancer`-style adapters. JSON-attribute fallback always works:

```jsx
<ce-bar-chart data='[{"label":"a","value":1}]'></ce-bar-chart>
```

### Svelte / SolidJS / Astro / static sites

Just drop the tag in. Set theme bundles via `<link rel="stylesheet">` in your layout component / template.

### Streaming markdown (Generative DOM)

Companion of [`@generative-dom/plugin-companion`](https://github.com/generative-dom/generative-dom). Stream tokens into a slot; the component upgrades when registered and the slotted content keeps updating. This is why all chat-surface components support late-added children — see `ce-chat-bubble`, `ce-cursor`, `ce-tool-call`.

---

## SSR notes

Most components guard `window` / `localStorage` access. The exceptions worth knowing:

- `ce-feedback-sink` reads `localStorage` on connect when `transport="localstorage"` (the default). Hydrate happens client-side; SSR renders a stable empty stub.
- `ce-theme-switcher` writes `data-ce-theme` to `<html>` on mount. SSR-render the chosen theme on the server attribute to avoid a flash.
- `ce-chart` dynamically imports `chart.js` on first render — the network request only happens client-side.

If you SSR with Lit's SSR package, all components render their initial DOM correctly; hydration upgrades them to interactive on the client.

---

## Bundle math

Lit is bundled inside the library. Per-component sizes (gzip) range from ~1 kB for a brick (`ce-cursor`, `ce-chip`) to ~4 kB for a widget (`ce-feedback-sink`, `ce-rating`). The shared Lit chunk is `~7.5 kB` gzipped and is loaded once even if you import every entry.

To audit: run `pnpm bundle-stats` after `pnpm build` — the script writes per-tag sizes to `internal/bundle-stats.jsonl` so you can see deltas across builds.

---

## Importing meta in production

The runtime bundle is unaffected by ADR-005. Components import from `custom-elements-collection/<tag>` exactly as before; meta JSON ships in a separate `dist/meta/` folder behind opt-in subpaths:

```ts
// Just the component (no meta)
import "custom-elements-collection/card";

// Component + its meta (separate import)
import "custom-elements-collection/card";
import meta from "custom-elements-collection/meta/ce-card.json"
  with { type: "json" };

// All meta in one fetch
import bundle from "custom-elements-collection/meta"
  with { type: "json" };
```

If you don't import meta, you don't pay for it. Keep production bundles minimal by only importing the tags you actually render. The same data is also projected into an LLM-tool-use-shaped registry under `custom-elements-collection/registry` (ADR-007).

---

## Demo

```bash
pnpm install
pnpm demo
```

Boots at `http://localhost:4600`. The catalog page renders every component with props/events/slots/CSS-vars pulled from the meta files; the chat-surface and feedback-UI components each have a live example. There's also a separate `demo/feedback.html` that exercises the full feedback subtree with `transport="localstorage"`.
