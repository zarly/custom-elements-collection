/**
 * Docs pages: Quick start + Theming.
 *
 * These are demo-only "pseudo-tags" routed via the same hash mechanism as
 * components — `#/quick-start`, `#/theming`. They don't appear in COMPONENTS
 * or META; routing in demo.js dispatches to render functions here when the
 * hash matches a key in PAGES.
 */

import { esc } from "./dates.js";
import { THEME_OPTIONS } from "./theme.js";

/* ─── Quick start ──────────────────────────────────────────────────────── */

// Install commands. Each must be a single runnable line on its own:
// the per-tab <ce-code copy> button copies the panel's text verbatim, so any
// "# or" comment or second command would break paste-and-run.
// See CONTRIBUTING.md / MEMORY.md ("Authoring `<ce-code copy>` blocks").
const QUICK_START_INSTALL_PNPM = `pnpm add custom-elements-collection`;
const QUICK_START_INSTALL_NPM  = `npm i custom-elements-collection`;
const QUICK_START_INSTALL_YARN = `yarn add custom-elements-collection`;
const QUICK_START_INSTALL_BUN  = `bun add custom-elements-collection`;

const QUICK_START_HTML = `<!doctype html>
<html data-ce-theme="dark">
<head>
  <link rel="stylesheet"
        href="https://unpkg.com/custom-elements-collection/dist/tokens/tokens.css">
  <script type="module"
          src="https://unpkg.com/custom-elements-collection/dist/auto.js"></script>
</head>
<body>
  <ce-hero kicker="Status" title="Release readiness" lede="All gates green.">
    <ce-kpi slot="stats" value="96%" label="Pass" color="green"></ce-kpi>
    <ce-kpi slot="stats" value="0"   label="Bugs" color="red"></ce-kpi>
  </ce-hero>

  <ce-callout type="success" title="Ready to ship">
    All quality gates green.
  </ce-callout>
</body>
</html>`;

const QUICK_START_AUTO = `// 1) Register every tag at once
import "custom-elements-collection/auto";
import "custom-elements-collection/tokens.css";`;

const QUICK_START_PER_TAG = `// 2) Or register only what you use (tree-shakable)
import "custom-elements-collection/hero";
import "custom-elements-collection/kpi";
import "custom-elements-collection/lesson-quiz";`;

const QUICK_START_DYNAMIC = `// 3) Or register dynamically at runtime
import { loadOnDemand } from "custom-elements-collection";
await loadOnDemand(["ce-hero", "ce-kpi"]);`;

const QUICK_START_VUE_SFC = `<template>
  <ce-hero kicker="Status" title="Release readiness">
    <ce-kpi slot="stats" :value="kpi.value" :label="kpi.label" color="green" />
  </ce-hero>
</template>`;

const QUICK_START_VUE_CONFIG = `// vite.config.ts
vue({
  template: {
    compilerOptions: {
      isCustomElement: (t) => t.startsWith("ce-") || t.startsWith("lesson-"),
    },
  },
});`;

const QUICK_START_REACT = `// Custom elements work as JSX intrinsic tags.
// For attribute typing, declare:
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ce-kpi": { value?: string; label?: string; color?: string };
    }
  }
}`;

export function renderQuickStart() {
  return `
    <div class="doc-pane">
      <ce-hero
        kicker="Get started"
        title="Quick start"
        lede="Install the package, register the tags you need, drop them into your markup. Works from plain HTML, any bundler, or any framework."
      ></ce-hero>

      <ce-section number="1" title="Install">
        <p>Pin the version on a real project — every dependency carries an exact pin in this repo, and we recommend you do the same.</p>
        <ce-tabs tabs='["pnpm","npm","yarn","bun"]' active="0">
          <ce-code slot="panel" lang="bash" copy>${esc(QUICK_START_INSTALL_PNPM)}</ce-code>
          <ce-code slot="panel" lang="bash" copy>${esc(QUICK_START_INSTALL_NPM)}</ce-code>
          <ce-code slot="panel" lang="bash" copy>${esc(QUICK_START_INSTALL_YARN)}</ce-code>
          <ce-code slot="panel" lang="bash" copy>${esc(QUICK_START_INSTALL_BUN)}</ce-code>
        </ce-tabs>
      </ce-section>

      <ce-section number="2" title="Register the tags">
        <p>Three entry styles. Pick whichever fits your build:</p>

        <h4 class="page-subhead">Auto — register everything</h4>
        <ce-code lang="ts" copy>${esc(QUICK_START_AUTO)}</ce-code>

        <h4 class="page-subhead">Per-tag — tree-shakable</h4>
        <ce-code lang="ts" copy>${esc(QUICK_START_PER_TAG)}</ce-code>

        <h4 class="page-subhead">Dynamic — at runtime</h4>
        <ce-code lang="ts" copy>${esc(QUICK_START_DYNAMIC)}</ce-code>
      </ce-section>

      <ce-section number="3" title="Plain HTML (no bundler)">
        <p>Drop two tags into <code>&lt;head&gt;</code> — one for tokens, one for the runtime — then use any component in <code>&lt;body&gt;</code>. The runtime ships as an ES module, served from any CDN that mirrors npm.</p>
        <ce-code lang="html" copy>${esc(QUICK_START_HTML)}</ce-code>
      </ce-section>

      <ce-section number="4" title="Frameworks">
        <p>Web Components work natively in every framework. The only configuration tends to be telling the template compiler that <code>ce-*</code> and <code>lesson-*</code> are custom elements.</p>

        <h4 class="page-subhead">Vue 3</h4>
        <ce-code lang="html" filename="App.vue" copy>${esc(QUICK_START_VUE_SFC)}</ce-code>
        <ce-code lang="ts" filename="vite.config.ts" copy style="display:block;margin-top:8px">${esc(QUICK_START_VUE_CONFIG)}</ce-code>

        <h4 class="page-subhead">React</h4>
        <ce-code lang="ts" copy>${esc(QUICK_START_REACT)}</ce-code>

        <ce-callout type="info" title="Svelte / Lit / Angular / Solid">
          All work out of the box. Bind attributes/properties using the framework's standard syntax — there is no per-framework adapter to install.
        </ce-callout>
      </ce-section>

      <ce-section number="5" title="Next">
        <ul>
          <li><a href="#/theming"><strong>Theming</strong></a> — switch built-in themes and override <code>--ce-*</code> tokens.</li>
          <li><a href="#/components"><strong>Components</strong></a> — browse every tag, with props, slots, and live examples.</li>
          <li><a href="https://github.com/zarly/custom-elements-collection" target="_blank" rel="noopener"><strong>GitHub</strong></a> — source, ADRs, contribution guide.</li>
        </ul>
      </ce-section>
    </div>`;
}

/* ─── Theming ──────────────────────────────────────────────────────────── */

const THEME_NOTES = {
  "auto":       { kind: "Built-in",       blurb: "Follow the operating-system color scheme (light or dark)." },
  "light":      { kind: "Built-in",       blurb: "Clean light surface, GitHub-style palette." },
  "dark":       { kind: "Built-in",       blurb: "Default dark surface, GitHub-style palette." },
  "swiss":      { kind: "Design school",  blurb: "Swiss International Typographic Style — Helvetica, sharp edges, high contrast." },
  "bauhaus":    { kind: "Design school",  blurb: "Bauhaus — primary colors, geometric forms, Futura-family." },
  "muji":       { kind: "Design school",  blurb: "Muji / Japanese minimalism — warm paper tones, restraint." },
  "neo-brutal": { kind: "Design school",  blurb: "Neo-brutalist — flat colors, hard shadows, no gradients." },
  "solarized":  { kind: "Design school",  blurb: "Ethan Schoonover's Solarized palette." },
  "nordic":     { kind: "Design school",  blurb: "Nordic — muted blues and frost greys, calm contrast." },
  "memphis":    { kind: "Design school",  blurb: "Memphis Group — playful pastels, bold contrast." },
  "gruvbox":    { kind: "Design school",  blurb: "Gruvbox — retro warm earth tones." },
};

const TOKEN_AXES = [
  { prefix: "--ce-bg / --ce-surface-* / --ce-border-*", purpose: "Surface and border colors", example: "background: var(--ce-surface-2)" },
  { prefix: "--ce-text / --ce-muted / --ce-dim",         purpose: "Foreground text colors",   example: "color: var(--ce-muted)" },
  { prefix: "--ce-color-*",                              purpose: "Semantic colors (green / red / amber / blue / purple / cyan) — each with solid, -bg, -border variants", example: "color: var(--ce-color-green)" },
  { prefix: "--ce-state-*",                              purpose: "Hover/active overlays — lighter than -bg",   example: "background: var(--ce-state-hover)" },
  { prefix: "--ce-code-*",                               purpose: "Code-block surface — stays dark in light themes", example: "background: var(--ce-code-bg)" },
  { prefix: "--ce-space-*",                              purpose: "Layout gaps, container padding (4 px grid, 1–8)", example: "gap: var(--ce-space-3)" },
  { prefix: "--ce-inset-*",                              purpose: "Padding inside compact interactive elements", example: "padding: var(--ce-inset-sm)" },
  { prefix: "--ce-sz-*",                                 purpose: "Fixed geometric sizes for icons, badges, avatars", example: "width: var(--ce-sz-lg)" },
  { prefix: "--ce-radius-*",                             purpose: "Border-radius scale",                        example: "border-radius: var(--ce-radius)" },
  { prefix: "--ce-text-* / --ce-line-*",                 purpose: "Font size + line-height scale",              example: "font-size: var(--ce-text-sm)" },
  { prefix: "--ce-font-sans / --ce-font-mono",           purpose: "Type families",                              example: "font-family: var(--ce-font-sans)" },
  { prefix: "--ce-shadow-*",                             purpose: "Elevation",                                  example: "box-shadow: var(--ce-shadow)" },
  { prefix: "--ce-transition-*",                         purpose: "Motion durations",                           example: "transition: opacity var(--ce-transition)" },
  { prefix: "--ce-focus-ring",                           purpose: "Accessibility focus ring",                   example: "box-shadow: var(--ce-focus-ring)" },
];

const OVERRIDE_EXAMPLE = `:root {
  --ce-color-green: #10b981;          /* swap green corporate-wide */
  --ce-radius: 6px;                   /* tighter corners */
  --ce-font-sans: "Inter", sans-serif;
}`;

const SCOPED_OVERRIDE_EXAMPLE = `<!-- Override only this subtree -->
<section style="--ce-color-blue: #0ea5e9; --ce-radius: 2px">
  <ce-card>Local palette swap</ce-card>
</section>`;

// Reference enum — the attribute values data-ce-theme accepts. Not meant to be
// pasted as a unit; the `copy` attribute is intentionally omitted on the
// rendering block (see MEMORY.md "Authoring `<ce-code copy>` blocks").
const SET_THEME_ENUM = `<!-- Pick a theme on the root element -->
<html data-ce-theme="light">
<html data-ce-theme="dark">
<html data-ce-theme="swiss">
<html data-ce-theme="bauhaus">`;

const SET_THEME_SWITCHER = `<ce-theme-switcher></ce-theme-switcher>`;

/**
 * Parse a CSS string into a list of { name, value } pairs, restricted to
 * declarations inside the first `:root,` or `:root {` selector block.
 *
 * Robust enough for tokens.css (which is hand-written, no nesting beyond one
 * level, comments only at top level). Stops at the first closing brace at
 * depth 1, so theme-specific overrides further down the file are ignored.
 */
function parseRootTokens(css) {
  // Find the opening of the base block. tokens.css uses the comma-selector
  // `:root,` followed by `html[data-ce-theme="dark"] {`.
  const startIdx = css.indexOf(":root");
  if (startIdx === -1) return [];
  const braceIdx = css.indexOf("{", startIdx);
  if (braceIdx === -1) return [];

  // Walk until the matching close brace.
  let depth = 1;
  let end = -1;
  for (let i = braceIdx + 1; i < css.length; i++) {
    const ch = css[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) return [];

  const body = css.slice(braceIdx + 1, end);
  // Strip block comments before parsing declarations.
  const clean = body.replace(/\/\*[\s\S]*?\*\//g, "");

  const tokens = [];
  const re = /(--ce-[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m;
  while ((m = re.exec(clean)) !== null) {
    tokens.push({ name: m[1], value: m[2].trim() });
  }
  return tokens;
}

const TOKEN_GROUP_ORDER = [
  { id: "surface",    title: "Surfaces & borders",     test: (n) => /^--ce-(bg|surface|border)/.test(n) },
  { id: "text",       title: "Text",                   test: (n) => /^--ce-(text(-(inverse|xs|sm|base|md|lg|xl|2xl|3xl))?|muted|dim|line-)/.test(n) },
  { id: "color",      title: "Semantic colors",        test: (n) => /^--ce-color-/.test(n) },
  { id: "state",      title: "State overlays",         test: (n) => /^--ce-state-/.test(n) },
  { id: "code",       title: "Code surface",           test: (n) => /^--ce-code-/.test(n) },
  { id: "space",      title: "Layout spacing",         test: (n) => /^--ce-space-/.test(n) },
  { id: "inset",      title: "Element insets",         test: (n) => /^--ce-inset-/.test(n) },
  { id: "size",       title: "Element sizes",          test: (n) => /^--ce-sz-/.test(n) },
  { id: "radius",     title: "Radius scale",           test: (n) => /^--ce-radius/.test(n) },
  { id: "font",       title: "Type families",          test: (n) => /^--ce-font-/.test(n) },
  { id: "motion",     title: "Motion",                 test: (n) => /^--ce-transition/.test(n) },
  { id: "shadow",     title: "Elevation",              test: (n) => /^--ce-shadow/.test(n) },
  { id: "focus",      title: "Focus",                  test: (n) => /^--ce-focus/.test(n) },
];

function isLikelyColor(value) {
  const v = value.trim();
  return (
    /^#[0-9a-f]{3,8}$/i.test(v) ||
    v.startsWith("rgb(") ||
    v.startsWith("rgba(") ||
    v.startsWith("hsl(") ||
    v.startsWith("hsla(")
  );
}

function renderTokenSwatch(value) {
  if (!isLikelyColor(value)) return "";
  // Use the raw token value as a swatch background. Safe because we control
  // the source (tokens.css) — no user input.
  return `<span class="token-swatch" style="background:${esc(value)}" aria-hidden="true"></span>`;
}

function groupTokens(tokens) {
  const buckets = new Map();
  const other = [];
  for (const t of tokens) {
    let placed = false;
    for (const g of TOKEN_GROUP_ORDER) {
      if (g.test(t.name)) {
        if (!buckets.has(g.id)) buckets.set(g.id, []);
        buckets.get(g.id).push(t);
        placed = true;
        break;
      }
    }
    if (!placed) other.push(t);
  }
  const groups = TOKEN_GROUP_ORDER
    .filter((g) => buckets.has(g.id))
    .map((g) => ({ title: g.title, tokens: buckets.get(g.id) }));
  if (other.length) groups.push({ title: "Other", tokens: other });
  return groups;
}

function renderTokenGroup(group) {
  const rows = group.tokens.map((t) => `
    <tr>
      <td><code>${esc(t.name)}</code></td>
      <td><span class="token-value">${renderTokenSwatch(t.value)}<code>${esc(t.value)}</code></span></td>
    </tr>`).join("");
  return `
    <h4 class="page-subhead">${esc(group.title)} <span class="page-subhead__count">${group.tokens.length}</span></h4>
    <ce-table>
      <table>
        <thead><tr><th>Name</th><th>Default</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </ce-table>`;
}

function renderThemeCards() {
  const items = THEME_OPTIONS.map((o) => {
    const note = THEME_NOTES[o.value] ?? { kind: "Theme", blurb: "" };
    const hint = o.value === "auto" ? "" :
      `<div class="theme-swatch" data-ce-theme="${esc(o.value)}" aria-hidden="true">
         <span class="theme-swatch__bg"></span>
         <span class="theme-swatch__surface"></span>
         <span class="theme-swatch__dot theme-swatch__dot--green"></span>
         <span class="theme-swatch__dot theme-swatch__dot--blue"></span>
         <span class="theme-swatch__dot theme-swatch__dot--purple"></span>
         <span class="theme-swatch__dot theme-swatch__dot--amber"></span>
         <span class="theme-swatch__dot theme-swatch__dot--red"></span>
       </div>`;
    return `
      <ce-card>
        ${hint}
        <div class="theme-card__head">
          <code>${esc(o.value)}</code>
          <ce-chip outlined>${esc(note.kind)}</ce-chip>
        </div>
        <div class="theme-card__label">${esc(o.label)}</div>
        <p class="theme-card__blurb">${esc(note.blurb)}</p>
      </ce-card>`;
  }).join("");
  return `<ce-grid cols="3">${items}</ce-grid>`;
}

function renderAxesTable() {
  const rows = TOKEN_AXES.map((a) => `
    <tr>
      <td><code>${esc(a.prefix)}</code></td>
      <td>${esc(a.purpose)}</td>
      <td><code>${esc(a.example)}</code></td>
    </tr>`).join("");
  return `
    <ce-table>
      <table>
        <thead><tr><th>Prefix</th><th>Purpose</th><th>Example</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </ce-table>`;
}

export function renderTheming(tokensCss) {
  const tokens = tokensCss ? parseRootTokens(tokensCss) : [];
  const groups = groupTokens(tokens);
  const tokenCount = tokens.length;
  const tokenSections = groups.map(renderTokenGroup).join("");

  return `
    <div class="doc-pane">
      <ce-hero
        kicker="Setup"
        title="Theming"
        lede="Every visual value is a CSS custom property under --ce-*. Switch themes by setting data-ce-theme on <html>, or override any token on :root."
      ></ce-hero>

      <ce-section number="1" title="Pick a theme">
        <p>${THEME_OPTIONS.length - 1} themes ship out of the box plus an <code>auto</code> mode that follows the OS color scheme. Use the switcher in the top bar to preview any of them live.</p>
        <p>Set <code>data-ce-theme</code> on the root element — any of the values below:</p>
        <ce-code lang="html">${esc(SET_THEME_ENUM)}</ce-code>
        <p style="margin-top:12px">Or drop in the bundled switcher:</p>
        <ce-code lang="html" copy>${esc(SET_THEME_SWITCHER)}</ce-code>
      </ce-section>

      <ce-section title="Built-in themes" count-label="${THEME_OPTIONS.length} options">
        ${renderThemeCards()}
      </ce-section>

      <ce-section number="2" title="Override tokens">
        <p>Redefine any <code>--ce-*</code> on <code>:root</code> to change it everywhere, or scope an override to a subtree by setting it on a parent element.</p>
        <h4 class="page-subhead">Global</h4>
        <ce-code lang="css" copy>${esc(OVERRIDE_EXAMPLE)}</ce-code>
        <h4 class="page-subhead">Scoped</h4>
        <ce-code lang="html" copy>${esc(SCOPED_OVERRIDE_EXAMPLE)}</ce-code>
      </ce-section>

      <ce-section number="3" title="Token axes">
        <p>Each prefix carries a distinct semantic. Mixing them is a smell — use a <code>--ce-space-*</code> token for gaps, <code>--ce-inset-*</code> for element-internal padding, <code>--ce-sz-*</code> for fixed geometry.</p>
        ${renderAxesTable()}
      </ce-section>

      <ce-section number="4" title="All tokens" count-label="${tokenCount} variables">
        <p>The full base palette, parsed live from <code>src/tokens/tokens.css</code>. Theme files (<code>swiss.css</code>, <code>bauhaus.css</code>, …) override a subset of these values.</p>
        ${tokenCount === 0
          ? `<ce-callout type="warn" title="No tokens parsed">Failed to extract tokens from the source CSS. See the file directly at <code>src/tokens/tokens.css</code>.</ce-callout>`
          : tokenSections}
      </ce-section>
    </div>`;
}

/* ─── Page registry ────────────────────────────────────────────────────── */

/**
 * Page renderers keyed by the path segment in the hash (`#/<key>`).
 * Each renderer receives `ctx` — a bag of optional inputs the page may want
 * (currently: tokensCss). Pages don't need INDEX / META / EXAMPLES, but
 * `components` is special: it renders the catalog and lives in render.js.
 */
export const PAGES = {
  "quick-start": (_ctx) => renderQuickStart(),
  "theming":     (ctx)  => renderTheming(ctx?.tokensCss ?? ""),
};

export const DEFAULT_PAGE = "quick-start";

export const PAGE_KEYS = new Set(Object.keys(PAGES));
