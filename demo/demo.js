/*
 * Demo app — vanilla JS, no framework.
 * Uses the library's own components (ce-docs-layout, ce-nav-list, and the rest)
 * to render a Storybook-style sidebar + detail pane.
 *
 * v3: One ReactiveForm is the authoritative state owner. The settings button
 * opens a ce-modal with four tabs (View / Group / Sort / Filter). The search
 * input is the only sidebar control that remains outside the modal.
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

import { buildIndex } from "./lib/index.js";
import { STATE } from "./lib/state.js";
import { parseHash, writeHash } from "./lib/hash.js";
import { renderCatalog, renderComponent } from "./lib/render.js";
import { initTheme } from "./lib/theme.js";
import { ReactiveForm } from "./lib/reactive-form.js";
import { refreshSidebar, refreshSettingsCount } from "./lib/controllers/sidebar.js";

// Register demo-namespace custom elements.
import "./lib/elements/demo-settings-button.js";
import "./lib/elements/demo-view-tab.js";
import "./lib/elements/demo-group-tab.js";
import "./lib/elements/demo-sort-tab.js";
import "./lib/elements/demo-filter-tab.js";
import "./lib/elements/demo-settings-modal.js";

// Vite eagerly imports every meta JSON file at dev/build time.
const metaModules = import.meta.glob("../src/**/*.meta.json", {
  eager: true,
  import: "default",
});
const META = Object.fromEntries(
  Object.values(metaModules).map((m) => [m.tag, m]),
);

// Co-located examples.
const exampleModules = import.meta.glob("../src/**/*.examples.html", {
  eager: true,
  query: "?raw",
  import: "default",
});
const EXAMPLES = {};
for (const [filePath, raw] of Object.entries(exampleModules)) {
  const m = /\/([^/]+)\.examples\.html$/.exec(filePath);
  if (!m) continue;
  const stem = m[1];
  const tag = stem.startsWith("lesson-") ? stem : `ce-${stem}`;
  EXAMPLES[tag] = parseExamples(raw);
}

/** Single in-memory index. */
const INDEX = buildIndex(COMPONENTS, META);

if (INDEX.length !== COMPONENTS.length) {
  console.error(
    `[demo] index size ${INDEX.length} disagrees with COMPONENTS size ${COMPONENTS.length}`,
  );
}
for (const r of INDEX) {
  if (!META[r.tag]) {
    console.warn(`[demo] no meta record for ${r.tag} — schema fields blank`);
  }
}

// ─── Reactive form ────────────────────────────────────────────────────────────

const form = new ReactiveForm({
  fields: {
    query:           { type: "string",  default: "" },
    groupBy:         { type: "enum",    values: ["group","tier","stability","category","createdMonth","alpha"], default: "group" },
    sortBy:          { type: "enum",    values: ["a-z","z-a","recent-updated","recent-created","most-deps","least-deps"], default: "a-z" },
    stab:            { type: "set",     values: ["stable","beta","experimental","deprecated"] },
    tier:            { type: "set",     values: ["brick","widget","layout"] },
    cat:             { type: "set",     values: ["ui","lesson","internal"] },
    has:             { type: "set",     values: ["events","slots","cssVars","globalDeps","sideEffects"] },
    tags:            { type: "set" },
    created:         { type: "int",     default: 0 },
    updated:         { type: "int",     default: 0 },
    showDescription: { type: "bool",    default: false },
    showUpdated:     { type: "bool",    default: false },
    showCreated:     { type: "bool",    default: false },
    showStability:   { type: "bool",    default: true },
  },
  hashParam: {
    query:   "q",
    groupBy: "group",
    sortBy:  "sort",
    stab:    "stab",
    tier:    "tier",
    cat:     "cat",
    has:     "has",
    tags:    "tags",
    created: "created",
    updated: "updated",
    // view options not in hash — they live in localStorage only
  },
  localStorage: {
    showDescription: "cec-demo-view-desc",
    showUpdated:     "cec-demo-view-upd",
    showCreated:     "cec-demo-view-crt",
    showStability:   "cec-demo-view-stab",
  },
});

// ─── Sync form → STATE ────────────────────────────────────────────────────────

/**
 * Copy the current ReactiveForm snapshot into STATE so that all pure modules
 * (filters.js, group.js, sort.js, render.js, build-nav-items.js) keep reading
 * STATE without modification.
 */
function syncStateFromForm() {
  const snap = form.snapshot();
  STATE.query           = snap.query;
  STATE.groupBy         = snap.groupBy;
  STATE.sortBy          = snap.sortBy;
  STATE.filters.stab    = snap.stab;
  STATE.filters.tier    = snap.tier;
  STATE.filters.cat     = snap.cat;
  STATE.filters.has     = snap.has;
  STATE.filters.tags    = snap.tags;
  STATE.filters.created = snap.created;
  STATE.filters.updated = snap.updated;
  STATE.view = {
    showDescription: snap.showDescription,
    showUpdated:     snap.showUpdated,
    showCreated:     snap.showCreated,
    showStability:   snap.showStability,
  };
}

// suppressHashChange prevents re-parsing the hash we just wrote.
const suppressRef = { value: false };

/** Refresh sidebar + count chip from current STATE. */
function onFormChange() {
  syncStateFromForm();
  refreshSidebar(INDEX, suppressRef);
  refreshSettingsCount();
  writeHashFromForm();
}

form.subscribe(onFormChange);

// ─── Hash helpers ─────────────────────────────────────────────────────────────

/**
 * Write hash as `#/<tag>?<form.toHash()>`. The path segment (selected tag)
 * is owned outside the form.
 */
function writeHashFromForm() {
  const qs = form.toHash();
  const path = STATE.tag ? `/${STATE.tag}` : "";
  const target = `#${path}${qs ? "?" + qs : ""}`;
  if (location.hash === target || (!location.hash && target === "#")) return;
  suppressRef.value = true;
  history.replaceState(null, "", location.pathname + location.search + target);
  Promise.resolve().then(() => { suppressRef.value = false; });
}

// ─── Routing ──────────────────────────────────────────────────────────────────

/**
 * Parse the current hash: extract the tag (path segment) then feed the query
 * string into form.fromHash() which handles all form fields.
 */
function parseTagFromHash() {
  const raw = location.hash || "";
  const stripped = raw.replace(/^#/, "");
  const [path, qs] = stripped.split("?");
  const tagMatch = (path ?? "").match(/^\/?([\w-]+)?$/);
  return {
    tag: tagMatch ? tagMatch[1] ?? null : null,
    qs: qs ?? "",
  };
}

function route() {
  const { tag, qs } = parseTagFromHash();
  STATE.tag = tag;
  // fromHash triggers subscriber → syncStateFromForm + refreshSidebar + writeHash.
  // But we want to suppress the hash re-write that fromHash indirectly triggers
  // via the subscriber, since we're reading from the hash right now.
  suppressRef.value = true;
  form.fromHash(qs);
  syncStateFromForm();
  suppressRef.value = false;

  const main = document.getElementById("main");
  main.innerHTML = STATE.tag
    ? renderComponent(STATE.tag, COMPONENTS, META, EXAMPLES)
    : renderCatalog(STATE, INDEX, COMPONENTS);
  main.scrollTop = 0;

  // Wire the "clear all" link rendered inside renderActiveSummary().
  const clearLink = main.querySelector("[data-clear-all]");
  if (clearLink) {
    clearLink.addEventListener("click", (ev) => {
      ev.preventDefault();
      suppressRef.value = true;
      form.reset();
      const snap = form.snapshot();
      // Preserve view options; only reset query + filter axes + group/sort.
      form.set("showDescription", snap.showDescription);
      form.set("showUpdated", snap.showUpdated);
      form.set("showCreated", snap.showCreated);
      form.set("showStability", snap.showStability);
      suppressRef.value = false;
      // Sync search input visually.
      const search = document.getElementById("search");
      if (search) search.value = "";
      syncStateFromForm();
      refreshSidebar(INDEX, suppressRef);
      refreshSettingsCount();
      writeHashFromForm();
      route();
    });
  }

  // Reflect query into search input (on URL navigation).
  const search = document.getElementById("search");
  if (search && search.value !== STATE.query) search.value = STATE.query;

  refreshSidebar(INDEX, suppressRef);
  refreshSettingsCount();
}

// ─── Initialise ──────────────────────────────────────────────────────────────

function init() {
  initTheme();

  // Wire search input directly (stays outside the form's DOM binding).
  const search = document.getElementById("search");
  let searchRaf = 0;
  const onSearchInput = () => {
    form.set("query", search.value ?? "");
    if (searchRaf) cancelAnimationFrame(searchRaf);
    searchRaf = requestAnimationFrame(() => {/* subscriber already ran */});
  };
  search.addEventListener("input", onSearchInput);
  search.addEventListener("ce-input", onSearchInput);

  // Keyboard shortcut: `/` focuses the search box.
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && document.activeElement === search) {
      if (search.value) {
        form.set("query", "");
        search.value = "";
      }
      return;
    }
    if (ev.key !== "/") return;
    const target = ev.target;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.tagName === "CE-INPUT")
    ) return;
    ev.preventDefault();
    search.focus();
  });
  search.title = "Press / to focus, Esc to clear";

  // Wire the settings button → modal.
  const settingsBtn  = document.getElementById("settings");
  const settingsModal = document.getElementById("settings-modal");

  if (settingsBtn && settingsModal) {
    settingsModal.form = form;
    settingsModal.setIndex(INDEX);
    settingsBtn.addEventListener("demo-settings-open", () => {
      settingsModal.open();
    });
  }

  window.addEventListener("hashchange", () => {
    if (suppressRef.value) return;
    route();
  });

  route();
}

/* The library registers tags from /src/auto.ts (loaded before this script),
 * so upgrade callbacks for ce-docs-layout / ce-nav-list fire synchronously. */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
