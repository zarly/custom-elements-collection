/**
 * HTML-string builders for the detail pane and catalog.
 * No DOM mutation, no event wiring.
 * Functions that need STATE or INDEX receive them as parameters.
 */

import { esc } from "./dates.js";
import { CATEGORY_ORDER, CATEGORY_LABELS, STABILITY_CHIP } from "./index.js";
import { isDefaultFilters, passesFilters } from "./filters.js";
import { matchesQuery } from "./query.js";

/** Render the property table from `meta.props[]`. The schema gives us
 *  { name, type, required, default?, attribute?, reflect?, description }. */
export function renderProps(props) {
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
export function renderEvents(events) {
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
export function renderSlots(slots) {
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
export function renderCssVariables(cssVars) {
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
export function renderEnvironment(globals, sideEffects) {
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
export function renderDependencyGraph(meta) {
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
export function renderExample(ex) {
  return `
    <div class="example">
      <div class="example-title">${esc(ex.title)}</div>
      <div>${ex.html}</div>
      <ce-code lang="html" copy style="display:block;margin-top:14px">${esc(ex.html)}</ce-code>
    </div>`;
}

/** Render an active-filter summary line (if any filters are active).
 *  Reads STATE and INDEX — passed as parameters. */
export function renderActiveSummary(STATE, INDEX) {
  const { query, groupBy, sortBy, filters } = STATE;
  const filtersDefault = isDefaultFilters(filters);
  if (!query && groupBy === "group" && sortBy === "a-z" && filtersDefault) {
    return "";
  }

  const filtered = INDEX.filter(
    (r) =>
      matchesQuery(r, query.toLowerCase()) && passesFilters(r, filters),
  );

  const chips = [];
  if (query) chips.push(`<ce-chip type="blue" outlined>q: ${esc(query)}</ce-chip>`);
  if (groupBy !== "group") chips.push(`<ce-chip outlined>group: ${esc(groupBy)}</ce-chip>`);
  if (sortBy !== "a-z") chips.push(`<ce-chip outlined>sort: ${esc(sortBy)}</ce-chip>`);
  for (const v of filters.stab) chips.push(`<ce-chip type="green" outlined>${esc(v)}</ce-chip>`);
  for (const v of filters.tier) chips.push(`<ce-chip type="purple" outlined>${esc(v)}</ce-chip>`);
  for (const v of filters.cat) chips.push(`<ce-chip type="cyan" outlined>${esc(v)}</ce-chip>`);
  for (const v of filters.has) chips.push(`<ce-chip type="amber" outlined>has: ${esc(v)}</ce-chip>`);
  for (const v of filters.tags) chips.push(`<ce-chip outlined>${esc(v)}</ce-chip>`);
  if (filters.created > 0)
    chips.push(`<ce-chip type="blue" outlined>created ≤ ${filters.created}d</ce-chip>`);
  if (filters.updated > 0)
    chips.push(`<ce-chip type="blue" outlined>updated ≤ ${filters.updated}d</ce-chip>`);

  return `
    <ce-callout type="info" class="catalog-status">
      <strong>Showing ${filtered.length} of ${INDEX.length} components</strong>
      <span class="catalog-status__chips">${chips.join(" ")}</span>
      <a href="#" class="catalog-status__clear" data-clear-all>clear all</a>
    </ce-callout>`;
}

/** Render the catalog landing page (when the hash is empty or "#/").
 *  Reads STATE, INDEX, and COMPONENTS — passed as parameters. */
export function renderCatalog(STATE, INDEX, COMPONENTS) {
  const summary = renderActiveSummary(STATE, INDEX);

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
      ${summary}
      ${cards}
    </div>`;
}

/** Render a single component's detail page.
 *  Reads META and EXAMPLES — passed as parameters. */
export function renderComponent(tag, COMPONENTS, META, EXAMPLES) {
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
