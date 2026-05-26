import { daysSinceIso } from "./dates.js";

export const HAS_FIELD = {
  events: "hasEvents",
  slots: "hasSlots",
  cssVars: "hasCssVars",
  globalDeps: "hasGlobalDeps",
  sideEffects: "hasSideEffects",
};

export const VALID_STAB = new Set(["stable", "beta", "experimental", "deprecated"]);
export const VALID_TIER = new Set(["brick", "widget", "layout"]);
export const VALID_CAT = new Set(["ui", "lesson", "internal"]);
export const VALID_HAS = new Set(Object.keys(HAS_FIELD));

/** True when no filter is set — used to size the active-count chip on the
 *  Filters button. */
export function isDefaultFilters(f) {
  return (
    f.stab.size === 0 &&
    f.tier.size === 0 &&
    f.cat.size === 0 &&
    f.has.size === 0 &&
    f.tags.size === 0 &&
    f.created === 0 &&
    f.updated === 0
  );
}

/** Count of active filter axes (not individual values within a multi-select). */
export function activeFilterCount(f) {
  let n = 0;
  if (f.stab.size) n += 1;
  if (f.tier.size) n += 1;
  if (f.cat.size) n += 1;
  if (f.has.size) n += 1;
  if (f.tags.size) n += 1;
  if (f.created > 0) n += 1;
  if (f.updated > 0) n += 1;
  return n;
}

/**
 * AND across axes. Per-axis semantics:
 *   - stab / tier / cat: OR within the multi-select (record's single value
 *     must be in the set).
 *   - has: AND — every picked capability must be present on the record.
 *   - tags: AND — every picked tag must be present on the record (tags[0],
 *     the canonical group, is skipped because that axis is filtered separately).
 *   - created / updated: integer day cutoff on record.created / record.updated.
 */
export function passesFilters(record, f) {
  if (f.stab.size && !f.stab.has(record.stability)) return false;
  if (f.tier.size && !f.tier.has(record.tier)) return false;
  if (f.cat.size && !f.cat.has(record.category)) return false;
  if (f.has.size) {
    for (const cap of f.has) {
      const field = HAS_FIELD[cap];
      if (!field || !record[field]) return false;
    }
  }
  if (f.tags.size) {
    // Skip tags[0] (canonical group, already covered by the group filter axis).
    const free = record.tags.slice(1);
    for (const t of f.tags) {
      if (!free.includes(t)) return false;
    }
  }
  if (f.created > 0) {
    const days = daysSinceIso(record.created);
    if (!isFinite(days) || days > f.created) return false;
  }
  if (f.updated > 0) {
    const days = daysSinceIso(record.updated);
    if (!isFinite(days) || days > f.updated) return false;
  }
  return true;
}
