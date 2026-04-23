# Usage

Three ways to use the library, depending on your context.

## Option A — plain HTML (CDN)

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
  <ce-shell>
    <ce-hero kicker="Status" title="Release readiness" lede="All gates green.">
      <ce-kpi slot="stats" value="96%" label="Pass" color="green"></ce-kpi>
      <ce-kpi slot="stats" value="0"   label="Bugs" color="red"></ce-kpi>
    </ce-hero>
    <ce-callout type="success" title="Ready to ship">
      All quality gates green.
    </ce-callout>
  </ce-shell>
</body>
</html>
```

## Option B — pnpm + bundler (Vite / Rollup / webpack)

Install:

```bash
pnpm add custom-elements-collection
```

Pick an entry style:

```ts
// 1) Register every tag at once
import "custom-elements-collection/auto";
import "custom-elements-collection/tokens.css";

// 2) Or register only what you use (tree-shakable)
import "custom-elements-collection/hero";
import "custom-elements-collection/kpi";
import "custom-elements-collection/lesson-quiz";

// 3) Or register dynamically at runtime
import { loadOnDemand } from "custom-elements-collection";
await loadOnDemand(["ce-hero", "ce-kpi"]);
```

## Option C — Vue 3 / React / Svelte

Web components work natively in every framework. Import the side-effect module once at app startup and use the tags in templates.

**Vue 3:**

```vue
<template>
  <ce-hero kicker="Status" title="Release readiness">
    <ce-kpi slot="stats" :value="kpi.value" :label="kpi.label" color="green" />
  </ce-hero>
</template>
```

If Vue's compiler warns about unknown tags, mark them as custom elements in `vite.config.ts`:

```ts
vue({
  template: {
    compilerOptions: {
      isCustomElement: (t) => t.startsWith("ce-") || t.startsWith("lesson-"),
    },
  },
});
```

**React:** custom elements work as JSX intrinsic tags. For attribute typing, declare:

```ts
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ce-kpi": { value?: string; label?: string; color?: string };
    }
  }
}
```

## Theming

All colors, spacing, and radii are CSS custom properties under `--ce-*`. Override on `:root`, `<html>`, or any parent element:

```css
:root {
  --ce-color-green: #10b981;          /* swap green corporate-wide */
  --ce-radius: 6px;                   /* tighter corners */
  --ce-font-sans: "Inter", sans-serif;
}
```

Switch theme:

```html
<html data-ce-theme="light">
```

Ready-made dark / light overrides:

```html
<link rel="stylesheet"
      href="https://unpkg.com/custom-elements-collection/dist/tokens/dark.css" />
<link rel="stylesheet"
      href="https://unpkg.com/custom-elements-collection/dist/tokens/light.css" />
```

The full token catalog lives at [`src/tokens/tokens.css`](../src/tokens/tokens.css) — search for `--ce-` to see all variables.

## Common composition patterns

```html
<!-- Dashboard hero -->
<ce-hero kicker="…" title="…" lede="…">
  <ce-kpi slot="stats" …/>
  <ce-kpi slot="stats" …/>
  <ce-kpi slot="stats" …/>
</ce-hero>

<!-- Status section -->
<ce-section number="1" title="Status" count-label="3 items">
  <ce-grid cols="3">
    <ce-card accent="green">…</ce-card>
    <ce-card accent="amber">…</ce-card>
    <ce-card accent="red">…</ce-card>
  </ce-grid>
</ce-section>

<!-- Verdict -->
<ce-verdict type="go" title="Ship it" detail="…" />

<!-- Before/after -->
<ce-compare>
  <div slot="before">Old way</div>
  <div slot="after">New way</div>
</ce-compare>

<!-- Callouts -->
<ce-callout type="info|success|warn|danger" title="…">…</ce-callout>

<!-- Status pill -->
<ce-chip type="green" dot>Live</ce-chip>
```

Lesson composition:

```html
<lesson-frame title="Lesson 1: Articles" meta="Beginner · 12 min" progress="35">
  <lesson-rule number="1" title="Use 'a' before consonant sounds">…</lesson-rule>
  <lesson-gap id="ex1"></lesson-gap>
  <script>
    document.getElementById("ex1").prompt = "I want ___ apple.";
    document.getElementById("ex1").options = ["a","an","the"];
    document.getElementById("ex1").correct = "an";
  </script>
</lesson-frame>
```

## Troubleshooting

**Tags are in the HTML but don't render anything.**
The runtime didn't load. Check: (a) the `<script type="module">` tag is present, (b) the URL returns 200 in the network tab, (c) no Content-Security-Policy rule blocks the module.

**Components render but are unstyled.**
The tokens stylesheet didn't load. Add `<link rel="stylesheet" href="…/tokens.css">` before your first tag.

**Vue warns about unknown elements.**
Configure `isCustomElement` on the Vue plugin as shown above.

**Markdown inside `<ce-card>` renders as raw text.**
Your markdown renderer is stripping unknown tags. Configure it to treat `ce-*` and `lesson-*` as allowed.

**I want syntax highlighting in `<ce-code>`.**
Pre-tokenise on the server or at build time. The component renders pre-tokenised spans via `<span class="tok-k">`, `<span class="tok-s">`, etc. The tokens stylesheet ships the colors.
