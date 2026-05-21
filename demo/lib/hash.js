import { VALID_GROUP_BY } from "./group.js";
import { VALID_SORT_BY } from "./sort.js";
import { VALID_STAB, VALID_TIER, VALID_CAT, VALID_HAS } from "./filters.js";

export function parseSetParam(qs, key, allowed) {
  const raw = qs.get(key);
  if (!raw) return new Set();
  const out = new Set();
  for (const v of raw.split(",")) {
    if (!allowed || allowed.has(v)) out.add(v);
  }
  return out;
}

export function parseDaysParam(qs, key) {
  const raw = qs.get(key);
  if (!raw) return 0;
  // Accept "7d", "30d", or bare integers.
  const m = raw.match(/^(\d+)d?$/);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Parse the current location.hash into route + query state.
 * Format: `#/<tag>?q=…&group=…&sort=…&stab=stable,beta&tier=brick&cat=ui
 *          &has=events,slots&tags=primitive&created=7d&updated=30d`
 */
export function parseHash() {
  const raw = location.hash || "";
  const stripped = raw.replace(/^#/, "");
  const [path, qs] = stripped.split("?");
  const params = new URLSearchParams(qs ?? "");
  const tagMatch = (path ?? "").match(/^\/?([\w-]+)?$/);
  const tag = tagMatch ? tagMatch[1] ?? null : null;
  return {
    tag,
    query: params.get("q") ?? "",
    groupBy: VALID_GROUP_BY.has(params.get("group")) ? params.get("group") : "group",
    sortBy: VALID_SORT_BY.has(params.get("sort")) ? params.get("sort") : "a-z",
    filters: {
      stab: parseSetParam(params, "stab", VALID_STAB),
      tier: parseSetParam(params, "tier", VALID_TIER),
      cat: parseSetParam(params, "cat", VALID_CAT),
      has: parseSetParam(params, "has", VALID_HAS),
      tags: parseSetParam(params, "tags", null),
      created: parseDaysParam(params, "created"),
      updated: parseDaysParam(params, "updated"),
    },
  };
}

/**
 * Build the URL-hash query string for the given STATE, **without** the tag.
 * Pure — no side effects. Used by writeHash to build the live URL AND by
 * buildNavItems so sidebar links carry the current state forward (otherwise
 * clicking a sidebar link would reset filters/group/sort to defaults).
 *
 * Returns "" for fully-default state.
 */
export function stateQueryString(state) {
  const { query, groupBy, sortBy, filters } = state;
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (groupBy !== "group") params.set("group", groupBy);
  if (sortBy !== "a-z") params.set("sort", sortBy);
  if (filters.stab.size) params.set("stab", [...filters.stab].sort().join(","));
  if (filters.tier.size) params.set("tier", [...filters.tier].sort().join(","));
  if (filters.cat.size) params.set("cat", [...filters.cat].sort().join(","));
  if (filters.has.size) params.set("has", [...filters.has].sort().join(","));
  if (filters.tags.size) params.set("tags", [...filters.tags].sort().join(","));
  if (filters.created > 0) params.set("created", `${filters.created}d`);
  if (filters.updated > 0) params.set("updated", `${filters.updated}d`);
  return params.toString();
}

/** Write the current STATE back to location.hash without scroll/jump.
 *  suppressHashChange is a ref object { value } so the caller can observe it. */
export function writeHash(state, suppressRef) {
  const qs = stateQueryString(state);
  const path = state.tag ? `/${state.tag}` : "";
  const target = `#${path}${qs ? "?" + qs : ""}`;
  if (location.hash === target || (!location.hash && target === "#")) return;
  suppressRef.value = true;
  history.replaceState(null, "", location.pathname + location.search + target);
  Promise.resolve().then(() => { suppressRef.value = false; });
}
