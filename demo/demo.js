/*
 * Demo app — vanilla JS, no framework.
 * Uses the library's own components (ce-docs-layout, ce-nav-list, and the rest)
 * to render a Storybook-style sidebar + detail pane.
 *
 * Data sources:
 *   - COMPONENTS from /src/manifest.ts — ordering + sidebar group hints.
 *   - META from import.meta.glob over every "*.meta.json" under src/ — full
 *     meta JSON keyed by tag (props/events/slots/cssVariables/…).
 *   - EXAMPLES from import.meta.glob over every "*.examples.html" co-located
 *     next to each component's source. Parsed by ./parse-examples.js.
 *     Demo-only content; kept out of the meta schema on purpose.
 */
import { COMPONENTS } from "/src/manifest.ts";
import { parseExamples } from "./parse-examples.js";

// Vite eagerly imports every meta JSON file at dev/build time and inlines them
// as JS modules. Keying by `tag` gives us O(1) lookup in the renderer. The
// glob is relative to this file (demo/demo.js); the pattern matches every
// meta.json under the sibling src/ tree.
const metaModules = import.meta.glob("../src/**/*.meta.json", {
  eager: true,
  import: "default",
});
const META = Object.fromEntries(
  Object.values(metaModules).map((m) => [m.tag, m]),
);

// Co-located examples: each component's <stem>.examples.html sits next to its
// source. Vite imports each as raw text (?raw); the path stem maps back to a
// tag via META lookup so renaming a folder keeps everything consistent.
const exampleModules = import.meta.glob("../src/**/*.examples.html", {
  eager: true,
  query: "?raw",
  import: "default",
});
const EXAMPLES = {};
for (const [filePath, raw] of Object.entries(exampleModules)) {
  // ../src/components/<stem>/<stem>.examples.html or ../src/lesson/<stem>/...
  const m = /\/([^/]+)\.examples\.html$/.exec(filePath);
  if (!m) continue;
  const stem = m[1];
  // Stems map to tags: ce-* for UI, lesson-* keeps stem as-is.
  const tag = stem.startsWith("lesson-") ? stem : `ce-${stem}`;
  EXAMPLES[tag] = parseExamples(raw);
}

/** CATEGORY_ORDER + CATEGORY_LABELS control sidebar ordering and group names. */
const CATEGORY_ORDER = ["ui", "lesson", "internal"];
const CATEGORY_LABELS = {
  ui: "UI",
  lesson: "Lesson",
  internal: "Internal",
};

/** Stability → ce-chip color mapping, kept narrow on purpose. */
const STABILITY_CHIP = {
  stable: "green",
  beta: "blue",
  experimental: "amber",
  deprecated: "red",
};

/** Build the sidebar item list grouped by category + group. */
function buildNavItems() {
  const items = [];
  for (const cat of CATEGORY_ORDER) {
    const rows = COMPONENTS.filter((c) => c.category === cat);
    for (const row of rows) {
      const group =
        cat === "ui"
          ? `${CATEGORY_LABELS[cat]} · ${row.group ?? ""}`
          : CATEGORY_LABELS[cat];
      items.push({
        group,
        label: row.name,
        href: `#/${row.tag}`,
        tag: row.tag,
      });
    }
  }
  return items;
}

/** Escape a string for safe insertion into HTML text or attributes. */
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Render the property table from `meta.props[]`. The schema gives us
 *  { name, type, required, default?, attribute?, reflect?, description }. */
function renderProps(props) {
  if (!props || props.length === 0) {
    return `<p>No documented properties.</p>`;
  }
  const rows = props
    .map((p) => {
      const requiredBadge = p.required
        ? ` <ce-chip type="red" outlined>required</ce-chip>`
        : "";
      const reflectBadge = p.reflect
        ? ` <ce-chip type="blue" outlined>reflect</ce-chip>`
        : "";
      const attrLine =
        p.attribute && p.attribute !== p.name
          ? `<div class="prop-attr">attribute: <code>${esc(p.attribute)}</code></div>`
          : "";
      return `
      <tr>
        <td><code>${esc(p.name)}</code>${requiredBadge}${reflectBadge}${attrLine}</td>
        <td><span class="prop-type">${esc(p.type)}</span></td>
        <td><span class="prop-default">${esc(p.default ?? "—")}</span></td>
        <td>${esc(p.description)}</td>
      </tr>`;
    })
    .join("");
  return `
    <ce-table>
      <table>
        <thead>
          <tr><th>Name</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </ce-table>`;
}

/** Render the events table from `meta.events[]`. */
function renderEvents(events) {
  if (!events || events.length === 0) return "";
  const rows = events
    .map(
      (e) => `
      <tr>
        <td><code>${esc(e.name)}</code></td>
        <td><span class="prop-type">${esc(e.detail)}</span></td>
        <td>${e.bubbles ? "yes" : "no"}</td>
        <td>${e.composed ? "yes" : "no"}</td>
        <td>${esc(e.description)}</td>
      </tr>`,
    )
    .join("");
  return `
    <ce-section title="Events">
      <ce-table>
        <table>
          <thead>
            <tr><th>Name</th><th>Detail</th><th>Bubbles</th><th>Composed</th><th>Description</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </ce-table>
    </ce-section>`;
}

/** Render the slots table from `meta.slots[]`. Empty-name slot becomes "(default)". */
function renderSlots(slots) {
  if (!slots || slots.length === 0) return "";
  const rows = slots
    .map((s) => {
      const label = s.name === "" ? "<em>(default)</em>" : `<code>${esc(s.name)}</code>`;
      return `
      <tr>
        <td>${label}</td>
        <td>${s.required ? "yes" : "no"}</td>
        <td>${esc(s.description)}</td>
      </tr>`;
    })
    .join("");
  return `
    <ce-section title="Slots">
      <ce-table>
        <table>
          <thead>
            <tr><th>Name</th><th>Required?</th><th>Description</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </ce-table>
    </ce-section>`;
}

/** Render the CSS variables table from `meta.cssVariables[]`. */
function renderCssVariables(cssVars) {
  if (!cssVars || cssVars.length === 0) return "";
  const rows = cssVars
    .map(
      (v) => `
      <tr>
        <td><code>${esc(v.name)}</code></td>
        <td>${esc(v.kind)}</td>
        <td>${esc(v.source)}</td>
        <td>${esc(v.description)}</td>
        <td><span class="prop-default">${esc(v.fallback ?? "—")}</span></td>
      </tr>`,
    )
    .join("");
  return `
    <ce-section title="CSS Variables">
      <ce-table>
        <table>
          <thead>
            <tr><th>Name</th><th>Kind</th><th>Source</th><th>Description</th><th>Fallback</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </ce-table>
    </ce-section>`;
}

/** Render the globals + side-effects panel. Two stacked tables. */
function renderEnvironment(globals, sideEffects) {
  const hasGlobals = globals && globals.length > 0;
  const hasFx = sideEffects && sideEffects.length > 0;
  if (!hasGlobals && !hasFx) return "";

  const globalsTable = hasGlobals
    ? `<ce-table>
        <table>
          <thead><tr><th>API</th><th>Purpose</th><th>Writes?</th></tr></thead>
          <tbody>${globals
            .map(
              (g) => `
            <tr>
              <td><code>${esc(g.api)}</code></td>
              <td>${esc(g.purpose)}</td>
              <td>${g.writes ? "yes" : "no"}</td>
            </tr>`,
            )
            .join("")}</tbody>
        </table>
      </ce-table>`
    : "";

  const fxTable = hasFx
    ? `<ce-table>
        <table>
          <thead><tr><th>Kind</th><th>Description</th><th>Reason</th><th>Guarded?</th></tr></thead>
          <tbody>${sideEffects
            .map(
              (s) => `
            <tr>
              <td>${esc(s.kind)}</td>
              <td>${esc(s.description)}</td>
              <td>${esc(s.reason)}</td>
              <td>${s.guarded ? "yes" : "no"}</td>
            </tr>`,
            )
            .join("")}</tbody>
        </table>
      </ce-table>`
    : "";

  const globalsLabel = hasGlobals
    ? `<h4 class="env-subhead">Global dependencies</h4>${globalsTable}`
    : "";
  const fxLabel = hasFx
    ? `<h4 class="env-subhead">Side effects</h4>${fxTable}`
    : "";

  return `
    <ce-section title="Globals & Side Effects">
      ${globalsLabel}
      ${fxLabel}
    </ce-section>`;
}

/** Render the dependency-graph chips: dependents / dependencies / related. */
function renderDependencyGraph(meta) {
  const groups = [
    { label: "Dependents", tags: meta.dependents ?? [] },
    { label: "Dependencies", tags: meta.dependencies ?? [] },
    { label: "Related", tags: meta.related ?? [] },
  ];
  const nonEmpty = groups.filter((g) => g.tags.length > 0);
  if (nonEmpty.length === 0) return "";

  const rows = nonEmpty
    .map(
      (g) => `
      <div class="dep-row">
        <span class="dep-label">${esc(g.label)}</span>
        <span class="dep-chips">
          ${g.tags
            .map(
              (t) =>
                `<a href="#/${esc(t)}"><ce-chip outlined><code>${esc(t)}</code></ce-chip></a>`,
            )
            .join(" ")}
        </span>
      </div>`,
    )
    .join("");

  return `
    <ce-section title="Dependency graph">
      <div class="dep-grid">${rows}</div>
    </ce-section>`;
}

/** Render an example: live output + source. */
function renderExample(ex) {
  return `
    <div class="example">
      <div class="example-title">${esc(ex.title)}</div>
      <div>${ex.html}</div>
      <ce-code lang="html" copy style="display:block;margin-top:14px">${esc(ex.html)}</ce-code>
    </div>`;
}

/** Render the catalog landing page (when the hash is empty or "#/"). */
function renderCatalog() {
  const cards = CATEGORY_ORDER.map((cat) => {
    const rows = COMPONENTS.filter((c) => c.category === cat);
    const list = rows
      .map(
        (r) =>
          `<li><a href="#/${r.tag}"><code>${r.tag}</code></a> — ${esc(r.description)}</li>`,
      )
      .join("");
    return `
      <ce-section title="${esc(CATEGORY_LABELS[cat])}" count-label="${rows.length} tags">
        <ul>${list}</ul>
      </ce-section>`;
  }).join("");

  return `
    <div class="doc-pane">
      <ce-hero
        kicker="Catalog"
        title="custom-elements-collection"
        lede="${COMPONENTS.length} framework-agnostic Web Components. Click any tag in the sidebar for details."
      ></ce-hero>
      ${cards}
    </div>`;
}

/** Render a single component's detail page. */
function renderComponent(tag) {
  const entry = COMPONENTS.find((c) => c.tag === tag);
  const meta = META[tag];
  if (!entry || !meta) {
    return `<ce-callout type="warn" title="Unknown component">
      No component registered at <code>${esc(tag)}</code>.
    </ce-callout>`;
  }

  const examples = EXAMPLES[tag] ?? [];
  const hasExamples = examples.length > 0;

  const examplesHtml =
    entry.category === "internal" || !hasExamples
      ? `<ce-callout type="info" title="No live example">
          ${
            entry.category === "internal"
              ? "This is an internal layout primitive; the demo app itself is the live example."
              : "No example registered."
          }
        </ce-callout>`
      : examples.map(renderExample).join("");

  const stabilityChip = `<ce-chip type="${STABILITY_CHIP[meta.stability] ?? "neutral"}">${esc(meta.stability)}</ce-chip>`;

  const tagsRow =
    meta.tags && meta.tags.length > 0
      ? `<div class="tag-chips">
          ${stabilityChip}
          ${meta.tags.map((t) => `<ce-chip outlined>${esc(t)}</ce-chip>`).join(" ")}
        </div>`
      : `<div class="tag-chips">${stabilityChip}</div>`;

  const goalSection = meta.goal
    ? `<blockquote class="goal-block">
        <span class="goal-label">Goal</span>
        ${esc(meta.goal)}
      </blockquote>`
    : "";

  const descriptionSection = meta.description
    ? `<ce-section title="Description">
        <p>${esc(meta.description)}</p>
       </ce-section>`
    : "";

  const limitationsSection = meta.limitations
    ? `<ce-callout type="warn" title="Limitations">${esc(meta.limitations)}</ce-callout>`
    : "";

  return `
    <div class="doc-pane">
      <ce-hero
        kicker="${esc(CATEGORY_LABELS[entry.category])}${entry.group ? " · " + esc(entry.group) : ""}"
        title="&lt;${esc(entry.tag)}&gt;"
        lede="${esc(entry.description)}"
      ></ce-hero>

      ${tagsRow}
      ${goalSection}

      <ce-section title="Examples">
        ${examplesHtml}
      </ce-section>

      ${descriptionSection}
      ${limitationsSection}

      <ce-section title="Properties">
        ${renderProps(meta.props)}
      </ce-section>

      ${renderEvents(meta.events)}
      ${renderSlots(meta.slots)}
      ${renderCssVariables(meta.cssVariables)}
      ${renderEnvironment(meta.globalDependencies, meta.sideEffects)}
      ${renderDependencyGraph(meta)}
    </div>`;
}

/** Route: read hash → render main + update sidebar active state.
 * No inline-script handling needed — every example is pure HTML attributes. */
function route() {
  const main = document.getElementById("main");
  const nav = document.getElementById("nav");
  const hash = location.hash || "";
  const match = hash.match(/^#\/([\w-]+)$/);
  const tag = match ? match[1] : null;

  main.innerHTML = tag ? renderComponent(tag) : renderCatalog();
  main.scrollTop = 0;

  nav.value = hash || "#";
}

/** Theme: "auto" follows prefers-color-scheme; any other value forces that theme. */
const THEME_KEY = "cec-demo-theme";
const themeMedia = window.matchMedia("(prefers-color-scheme: light)");

const THEME_OPTIONS = [
  { value: "auto",       label: "Auto" },
  { value: "light",      label: "Light",              group: "Built-in" },
  { value: "dark",       label: "Dark",               group: "Built-in" },
  { value: "swiss",      label: "Swiss International", group: "Design Schools" },
  { value: "bauhaus",    label: "Bauhaus",             group: "Design Schools" },
  { value: "muji",       label: "Muji (Japanese)",     group: "Design Schools" },
  { value: "neo-brutal", label: "Neo-brutalist",       group: "Design Schools" },
  { value: "solarized",  label: "Solarized",           group: "Design Schools" },
  { value: "nordic",     label: "Nordic",              group: "Design Schools" },
  { value: "memphis",    label: "Memphis",             group: "Design Schools" },
  { value: "gruvbox",    label: "Gruvbox",             group: "Design Schools" },
];

const VALID_THEMES = new Set(THEME_OPTIONS.map((o) => o.value));

function applyTheme(mode) {
  const effective = mode === "auto" ? (themeMedia.matches ? "light" : "dark") : mode;
  document.documentElement.setAttribute("data-ce-theme", effective);
}

function initTheme() {
  const switcher = document.getElementById("theme-switcher");
  const stored = localStorage.getItem(THEME_KEY);
  const initial = VALID_THEMES.has(stored) ? stored : "auto";

  switcher.options = THEME_OPTIONS;
  switcher.value = initial;
  applyTheme(initial);

  switcher.addEventListener("ce-change", (ev) => {
    const { value } = ev.detail;
    localStorage.setItem(THEME_KEY, value);
    applyTheme(value);
  });

  themeMedia.addEventListener("change", () => {
    if (switcher.value === "auto") applyTheme("auto");
  });
}

/** Initialise sidebar, routing, and the ce-nav-select listener. */
function init() {
  initTheme();
  const nav = document.getElementById("nav");
  nav.items = [
    { label: "Overview", href: "#", group: "" },
    ...buildNavItems(),
  ];
  window.addEventListener("hashchange", route);
  route();
}

/* The library registers tags from /src/auto.ts (loaded before this script),
 * so upgrade callbacks for ce-docs-layout / ce-nav-list fire synchronously. */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
