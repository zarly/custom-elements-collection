/**
 * Sidebar controller — manages refreshSidebar and refreshSettingsCount.
 *
 * v3: The old reflectFiltersIntoForm / renderFilterTagChips functions are
 * removed — those are now handled by <demo-filter-tab> which reads from
 * ReactiveForm directly.
 *
 * Exported functions take INDEX and suppressRef at call time so this module
 * stays free of circular imports.
 */

import { buildNavItems } from "../build-nav-items.js";
import { esc } from "../dates.js";
import { activeFilterCount } from "../filters.js";
import { stateQueryString, writeHash } from "../hash.js";
import { STATE } from "../state.js";

/** Repaint the sidebar from the current STATE. */
export function refreshSidebar(INDEX, suppressRef) {
  const nav = document.getElementById("nav");
  const empty = document.getElementById("sidebar-empty");
  const items = buildNavItems(INDEX, STATE);
  if (items.length === 0) {
    nav.items = [];
    const suggestion = suggestForQuery(INDEX, STATE.query.trim());
    empty.innerHTML = `
      <ce-callout type="info" title="No components match">
        ${
          suggestion
            ? `Did you mean <a href="#" data-suggest="${esc(suggestion)}"><code>${esc(suggestion)}</code></a>?`
            : "Try a broader search, or clear the filters."
        }
      </ce-callout>`;
    const link = empty.querySelector("[data-suggest]");
    if (link) {
      link.addEventListener("click", (ev) => {
        ev.preventDefault();
        const tag = link.dataset.suggest;
        const stripped = tag.replace(/^ce-/, "").replace(/^lesson-/, "");
        const search = document.getElementById("search");
        if (search) search.value = stripped;
        STATE.query = stripped;
        refreshSidebar(INDEX, suppressRef);
        writeHash(STATE, suppressRef);
      });
    }
    empty.hidden = false;
  } else {
    empty.hidden = true;
    // "Overview" link also carries current state forward so it doesn't reset.
    const qs = stateQueryString(STATE);
    const overviewHref = qs ? `#?${qs}` : "#";
    nav.items = [
      { label: "Overview", href: overviewHref, group: "" },
      ...items,
    ];
  }
  nav.value = location.hash || "#";
}

/**
 * Count of active (non-default) settings axes for the count chip.
 * Counts filter axes + non-default group/sort (but NOT view opts which are
 * preference-only and don't "filter" the list).
 */
export function activeSettingsCount(state) {
  let n = activeFilterCount(state.filters);
  if (state.groupBy && state.groupBy !== "group") n += 1;
  if (state.sortBy && state.sortBy !== "a-z") n += 1;
  return n;
}

/** Update the count chip on the settings button. */
export function refreshSettingsCount() {
  const btn = document.getElementById("settings");
  if (!btn) return;
  btn.count = activeSettingsCount(STATE);
}

/**
 * @deprecated Use refreshSettingsCount instead.
 * Kept for any leftover callers during the v3 migration; no-ops gracefully.
 */
export function refreshFilterCount() {
  refreshSettingsCount();
}

/** Suggest a tag when search is a prefix of an existing tag (poor man's "did you mean"). */
function suggestForQuery(INDEX, q) {
  if (!q || q.length < 2) return null;
  // Exact-prefix match against the bare-tag portion (strip ce-/lesson-).
  const lower = q.toLowerCase();
  const candidates = INDEX.filter((r) => {
    const bare = r.tag.replace(/^ce-/, "").replace(/^lesson-/, "");
    return bare.startsWith(lower) || r.tag.startsWith(`ce-${lower}`);
  });
  if (candidates.length === 0) return null;
  return candidates[0].tag;
}
