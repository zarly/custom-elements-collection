/**
 * Demo app — vanilla JS, no framework.
 * Uses the library's own components (ce-docs-layout, ce-nav-list, and the rest)
 * to render a Storybook-style sidebar + detail pane.
 */
import { COMPONENTS } from "/src/manifest.ts";
import { DOCS } from "./docs-data.js";

/** CATEGORY_ORDER + CATEGORY_LABELS control sidebar ordering and group names. */
const CATEGORY_ORDER = ["ui", "lesson", "internal"];
const CATEGORY_LABELS = {
  ui: "UI",
  lesson: "Lesson",
  internal: "Internal",
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

/** Render a property table (ce-table) from a list of PropDoc rows. */
function renderProps(props) {
  if (!props || props.length === 0) {
    return `<p>No documented properties.</p>`;
  }
  const rows = props
    .map(
      (p) => `
      <tr>
        <td><code>${esc(p.name)}</code></td>
        <td><span class="prop-type">${esc(p.type)}</span></td>
        <td><span class="prop-default">${esc(p.default ?? "—")}</span></td>
        <td>${esc(p.description)}</td>
      </tr>`,
    )
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
  const docs = DOCS[tag];
  if (!entry || !docs) {
    return `<ce-callout type="warn" title="Unknown component">
      No component registered at <code>${esc(tag)}</code>.
    </ce-callout>`;
  }

  const examplesHtml =
    entry.category === "internal" || !docs.examples
      ? `<ce-callout type="info" title="No live example">
          ${
            entry.category === "internal"
              ? "This is an internal layout primitive; the demo app itself is the live example."
              : "No example registered."
          }
        </ce-callout>`
      : docs.examples.map(renderExample).join("");

  const syntaxSection = docs.syntax
    ? `<ce-section title="Syntax">
         <ce-code lang="html" copy>${esc(docs.syntax)}</ce-code>
       </ce-section>`
    : "";

  return `
    <div class="doc-pane">
      <ce-hero
        kicker="${esc(CATEGORY_LABELS[entry.category])}${entry.group ? " · " + esc(entry.group) : ""}"
        title="&lt;${esc(entry.tag)}&gt;"
        lede="${esc(entry.description)}"
      ></ce-hero>

      <ce-section title="Description">
        <p>${esc(docs.description)}</p>
      </ce-section>

      ${syntaxSection}

      <ce-section title="Properties">
        ${renderProps(docs.properties)}
      </ce-section>

      <ce-section title="Examples">
        ${examplesHtml}
      </ce-section>
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
