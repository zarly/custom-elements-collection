/**
 * Reusable facet-counting helpers for multi-select filter axes.
 *
 * A "facet" here is a chip-style multi-select where each chip carries a count
 * of how many records that chip's value would match under the current filter
 * state. As other filters change, the counts update.
 *
 * Accounting rule: count(v) = records that pass the current filter predicate
 * AND whose `valuesOf` yields `v`. With an AND-logic axis, selecting more
 * chips naturally drives other chips' counts toward 0 — that's the signal
 * "this combination would empty the result set".
 *
 * Generic on purpose. Today's caller is the Tags facet; future Set-typed
 * axes (capabilities, categories, …) can plug into the same module.
 */

/**
 * Compute counts for a fixed set of candidate values.
 *
 * @template R
 * @param {Iterable<R>} records
 * @param {object} filters — full filter state
 * @param {(record: R, filters: object) => boolean} predicate
 * @param {(record: R) => Iterable<string>} valuesOf
 * @param {Iterable<string>} [candidates] — restrict counting to these values.
 *   If omitted, every value yielded by `valuesOf` is counted.
 * @returns {Map<string, number>}
 */
export function valueCounts(records, filters, predicate, valuesOf, candidates) {
  const restrict = candidates ? new Set(candidates) : null;
  const counts = new Map();
  if (restrict) for (const v of restrict) counts.set(v, 0);
  for (const r of records) {
    if (!predicate(r, filters)) continue;
    const seen = new Set();
    for (const v of valuesOf(r)) {
      if (seen.has(v)) continue;
      seen.add(v);
      if (restrict && !restrict.has(v)) continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * For each currently-selected value on a Set-typed axis, count records that
 * would pass the predicate if that value were *removed* from the selection.
 *
 * Symmetric to `valueCounts`: where `valueCounts` answers "what's the result
 * set if I add this chip", this answers "what's the result set if I remove
 * this chip". Used to put a meaningful per-chip number on already-selected
 * chips (otherwise every selected chip shows the same total).
 *
 * @template R
 * @param {Iterable<R>} records
 * @param {object} filters — full filter state, axis at `axisName` is a Set
 * @param {string} axisName — which Set-typed axis to vary
 * @param {(record: R, filters: object) => boolean} predicate
 * @param {Iterable<string>} selected — usually `filters[axisName]`
 * @returns {Map<string, number>}
 */
export function valueCountsOnRemove(records, filters, axisName, predicate, selected) {
  const counts = new Map();
  const sel = [...selected];
  for (const v of sel) {
    const reduced = new Set(sel.filter((x) => x !== v));
    const hypo = { ...filters, [axisName]: reduced };
    let n = 0;
    for (const r of records) if (predicate(r, hypo)) n++;
    counts.set(v, n);
  }
  return counts;
}

/**
 * Rank every value present in `records` by total occurrence count.
 * Returns `[value, count]` pairs sorted by descending count, then alphabetically.
 *
 * Useful for "what tags exist at all" — the caller can take the top N as the
 * candidate set for `valueCounts`. Counts here ignore filters on purpose:
 * it's a stable population-level ranking, not a live count.
 *
 * @template R
 * @param {Iterable<R>} records
 * @param {(record: R) => Iterable<string>} valuesOf
 * @returns {Array<[string, number]>}
 */
export function rankValues(records, valuesOf) {
  const counts = new Map();
  for (const r of records) {
    const seen = new Set();
    for (const v of valuesOf(r)) {
      if (seen.has(v)) continue;
      seen.add(v);
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
}

/**
 * Pick the candidate values to show on a facet UI.
 *
 * Returns the top `limit` ranked values by total occurrence, unioned with any
 * currently-selected values (so a selected chip never disappears when its
 * tag falls below the rank cutoff). Output is sorted: selected first, then
 * by descending population count, then alphabetically.
 *
 * @template R
 * @param {Iterable<R>} records
 * @param {(record: R) => Iterable<string>} valuesOf
 * @param {Iterable<string>} selected
 * @param {number} limit
 * @returns {string[]}
 */
export function pickCandidates(records, valuesOf, selected, limit) {
  const ranked = rankValues(records, valuesOf);
  const sel = new Set(selected);
  const rank = new Map(ranked.map(([v, _n], i) => [v, i]));
  const top = ranked.slice(0, limit).map(([v]) => v);
  const set = new Set(top);
  for (const v of sel) set.add(v);
  return [...set].sort((a, b) => {
    const aSel = sel.has(a);
    const bSel = sel.has(b);
    if (aSel !== bSel) return aSel ? -1 : 1;
    const ai = rank.get(a) ?? Number.POSITIVE_INFINITY;
    const bi = rank.get(b) ?? Number.POSITIVE_INFINITY;
    if (ai !== bi) return ai - bi;
    return a.localeCompare(b);
  });
}
