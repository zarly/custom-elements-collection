# Demo internals

This folder is the catalog browser for `custom-elements-collection`. It's vanilla JS — no framework, no build step beyond Vite's dev server. Run it with:

```bash
pnpm demo
```

## What it does

- Loads every component from the manifest at boot, eagerly imports each `*.meta.json` and `*.examples.html` via Vite's `import.meta.glob`.
- Builds a single in-memory `INDEX` (one record per component, joined from manifest + meta + examples).
- Renders a Storybook-style sidebar (left) + detail pane (right) using the library's own components — `ce-docs-layout`, `ce-nav-list`, `ce-section`, `ce-card`, etc.
- One `ReactiveForm` instance owns every user-controlled setting: search query, group-by axis, sort axis, the 7 filter axes, and 4 view options.
- Every change to the form re-runs the pipeline (filter → search → sort → group), refreshes the sidebar, and updates the URL hash. Refresh-safe and deep-linkable.

## File map

```
demo/
├── index.html                              entry HTML — sidebar + main pane + settings modal
├── demo.js                                 entry JS — INDEX init, route(), init(); ~300 LOC
├── demo.css                                demo-only chrome; everything else uses --ce-* tokens
├── parse-examples.js                       splits an .examples.html file into { title, html } pairs
├── vite.config.js                          vite dev-server config; serves on port 4600
├── feedback.html                           standalone feedback-UI playground
└── lib/
    ├── index.js                            buildIndex() + CATEGORY_*  +  STABILITY_CHIP
    ├── state.js                            STATE singleton (passive mirror of form.snapshot())
    ├── reactive-form.js                    the small reactive form helper (≤200 LOC implementation)
    ├── query.js                            matchesQuery, escRegex, highlightLabel
    ├── sort.js                             comparator, SORT_OPTIONS, cmpDateDesc
    ├── group.js                            groupKeyOf, orderGroupKeys, VALID_GROUP_BY
    ├── filters.js                          passesFilters, isDefaultFilters, activeFilterCount
    ├── dates.js                            daysSinceIso, buildRowMeta(record, view), esc
    ├── hash.js                             parseHash, writeHash (URL-hash transport)
    ├── render.js                           all HTML-string builders (catalog + detail pane)
    ├── theme.js                            theme switcher
    ├── build-nav-items.js                  composes filter→sort→group→items array for ce-nav-list
    ├── controllers/sidebar.js              refreshSidebar, refreshFilterCount, reflectFiltersIntoForm
    └── elements/                           demo-namespace custom elements (NOT ce-*)
        ├── demo-settings-button.js         icon + count chip; emits demo-settings-open on click
        ├── demo-settings-modal.js          wraps ce-modal + ce-tabs (View / Group / Sort / Filter)
        ├── demo-view-tab.js                checkboxes for view-options
        ├── demo-group-tab.js               radios for group-by axes
        ├── demo-sort-tab.js                radios for sort axes
        └── demo-filter-tab.js              the 7-axis filter form
```

Every pure module under `lib/` has a co-located `*.test.js` (vitest, jsdom). Total: 76 unit tests + 3 playwright e2e specs.

## State flow

```
ReactiveForm ─── form.subscribe ──→ syncStateFromForm() ──→ STATE
                                                              │
                                          ┌───────────────────┼──────────────┐
                                          ↓                   ↓              ↓
                                  refreshSidebar()    writeHash()     render.* (next route)
                                          │
                              buildNavItems(INDEX, STATE)
                                          │
                              filter → sort → group → items[]
                                          │
                                  ce-nav-list .items = items[]
```

- `ReactiveForm` is the single source of truth for mutable settings.
- `STATE` is a passive mirror kept in lock-step via `syncStateFromForm()`. The pure modules (`filters.js`, `group.js`, `sort.js`, `render.js`, `build-nav-items.js`) read `STATE` only — they don't import or depend on `ReactiveForm`.
- The URL hash is the persistence layer for shareable state: search query, group, sort, filter axes. Round-tripped via `form.toHash()` / `form.fromHash()` plus a small `#/<tag>` path prefix.
- View options (`showDescription`, `showUpdated`, `showCreated`, `showStability`) are session-personal — persisted to localStorage, not URL.

## `demo-*` namespace

The settings modal and its four tabs are custom elements registered under `demo-*` rather than `ce-*` — they live in the demo only, not in the published library. They're thin orchestration shells: every visible piece comes from a library component (`ce-modal`, `ce-tabs`, `ce-button`, `ce-input`, `ce-chip`). The pattern is intentional — if a wrapper element ever outgrows the demo, it's a candidate for promotion to a library component (`ce-*`); until then, `demo-*` keeps the surface area tight.

## ReactiveForm

A small (~188 LOC implementation) reactive form-state container. Field types: `string` / `enum` / `bool` / `int` / `set`. Built-in transports:

- **URL hash** via `hashParam: { fieldName: 'paramKey' }`
- **localStorage** via `localStorage: { fieldName: 'lsKey' }`

API:

```js
const form = new ReactiveForm({ fields, hashParam, localStorage });
form.get(name);            // current value (Sets are returned as a copy)
form.set(name, value);     // returns true if value changed
form.reset(name?);         // reset one field, or all
form.snapshot();           // immutable record of all fields
form.subscribe(cb);        // returns unsubscribe function
form.toHash();             // URL-query string (omits defaults)
form.fromHash(qs);         // parse + apply
form.bindCheckbox(name, el);       // two-way bind a checkbox to a bool field
form.bindInput(name, el);          // two-way bind a text/number input
form.bindRadioGroup(name, els);    // two-way bind a radio group to an enum field
```

This is currently **demo-local**. If the pattern proves itself across several reuses, it's a candidate for promotion to a library export — a decision to make then, not now.

## Testing

- **Vitest (jsdom)** — `pnpm test` runs all 1266 specs including 76 demo `*.test.js` files. Pure-logic coverage on every module in `demo/lib/`.
- **Playwright (real Chromium)** — `pnpm test:e2e` boots the demo on port 4609 and exercises three user-visible flows: search filters the list; the Group tab inside the settings modal reorganises sections; the Filter tab applies a stability filter. The second test would have caught the v2 F2 bug on day one — it's the regression guard.

## Adding a new view-option

If you want to surface a new per-row decoration (e.g. "show last-author"):

1. Add a `bool` field to the ReactiveForm spec in `demo.js`, with a `localStorage` key under `cec-demo-view-*`.
2. Extend `STATE.view` in `state.js` + the mirror in `syncStateFromForm()`.
3. Render the decoration in `dates.js#buildRowMeta(record, view)` (or in `build-nav-items.js` for label-line additions like the description).
4. Add a checkbox row in `demo/lib/elements/demo-view-tab.js`, bound via `form.bindCheckbox(...)`.

No other files need to change. The pure-logic modules stay untouched.

## Adding a new filter axis

1. Add a field to the form spec in `demo.js` (type `set` or `int` typically).
2. Extend `STATE.filters` + the mirror.
3. Add the predicate to `filters.js#passesFilters` and bump `activeFilterCount`.
4. Add the UI in `demo/lib/elements/demo-filter-tab.js`.
5. Write a unit test for the new predicate in `filters.test.js`.
6. Optionally add an e2e flow.
