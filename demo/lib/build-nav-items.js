/**
 * buildNavItems — composes filter + sort + group + search into the sidebar
 * items array under the current STATE.
 * Pipeline: filter (query + modal filters) → sort (within sections) → group (sectioning).
 */

import { matchesQuery } from "./query.js";
import { passesFilters } from "./filters.js";
import { groupKeyOf, orderGroupKeys } from "./group.js";
import { comparator } from "./sort.js";
import { buildRowMeta, esc } from "./dates.js";
import { highlightLabel } from "./query.js";
import { stateQueryString } from "./hash.js";
import { CATEGORY_ORDER, CATEGORY_LABELS } from "./index.js";

/**
 * Build sidebar nav items from INDEX + STATE.
 * Both passed as parameters so this module stays side-effect-free.
 *
 * Every href carries the current STATE as a query string so that clicking
 * a sidebar link preserves the user's filters / group / sort / search.
 * Without this, navigating to a component would silently reset the form.
 *
 * @param {object[]} INDEX — IndexRecord[]
 * @param {object}   STATE — current demo navigation state
 * @returns {object[]} — nav item objects for ce-nav-list
 */
export function buildNavItems(INDEX, STATE) {
  const q = STATE.query.trim().toLowerCase();
  const filtered = INDEX.filter(
    (r) => matchesQuery(r, q) && passesFilters(r, STATE.filters),
  );
  if (filtered.length === 0) return [];

  // Group first to know section boundaries, then sort within sections.
  const groups = new Map(); // key -> records[]
  for (const r of filtered) {
    const k = groupKeyOf(r, STATE.groupBy, CATEGORY_LABELS);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const sortFn = comparator(STATE.sortBy);
  const orderedKeys = orderGroupKeys(
    STATE.groupBy,
    Array.from(groups.keys()),
    { INDEX, CATEGORY_ORDER, CATEGORY_LABELS },
  );

  const view = STATE.view ?? {};
  const qs = stateQueryString(STATE);
  const suffix = qs ? `?${qs}` : "";
  const items = [];
  for (const k of orderedKeys) {
    const records = groups.get(k).slice().sort(sortFn);
    const sectionLabel = `${k} · ${records.length}`;
    for (const r of records) {
      // Base label: component name.
      let labelHtml = q ? highlightLabel(r.name, q) : null;
      // Append description when the view option is ON.
      if (view.showDescription && r.description) {
        const desc = esc(r.description).slice(0, 80) + (r.description.length > 80 ? "…" : "");
        const descHtml = `<span class="nav-item-desc">${desc}</span>`;
        labelHtml = (labelHtml ?? esc(r.name)) + " " + descHtml;
      }
      const item = {
        group: sectionLabel,
        label: r.name,
        href: `#/${r.tag}${suffix}`,
        tag: r.tag,
        meta: buildRowMeta(r, view),
      };
      if (labelHtml) item.labelHtml = labelHtml;
      items.push(item);
    }
  }
  return items;
}
