/** Grouping key derivation and group-key ordering. All pure. */

export const VALID_GROUP_BY = new Set([
  "group",
  "tier",
  "stability",
  "category",
  "createdMonth",
  "alpha",
]);

export function capitalize(s) {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

/**
 * Resolve the group-key for a record under the chosen axis.
 * Needs CATEGORY_LABELS for the "group" and "category" axes — passed in to
 * avoid a circular import with index.js.
 */
export function groupKeyOf(record, axis, CATEGORY_LABELS) {
  switch (axis) {
    case "tier":
      return record.tier ? capitalize(record.tier) : "(no tier)";
    case "stability":
      return capitalize(record.stability ?? "stable");
    case "category":
      return CATEGORY_LABELS[record.category] ?? record.category;
    case "createdMonth":
      return record.created ? record.created.slice(0, 7) : "(no date)";
    case "alpha":
      return (record.tag[3] ?? record.tag[0] ?? "?").toUpperCase();
    case "group":
    default:
      return record.category === "ui"
        ? `${CATEGORY_LABELS.ui} · ${record.group || "(no group)"}`
        : CATEGORY_LABELS[record.category] ?? record.category;
  }
}

/**
 * Order group-keys deterministically. For known axes, use a canonical order;
 * for free-form axes (group, alpha, createdMonth), fall back to insertion order
 * with a secondary alphabetical sort.
 *
 * For axis === "group", walks INDEX (passed as parameter) to preserve the
 * CATEGORY_ORDER + GROUPS sequence the library defined.
 */
export function orderGroupKeys(axis, keys, { INDEX, CATEGORY_ORDER, CATEGORY_LABELS } = {}) {
  if (axis === "tier") {
    const order = ["Brick", "Widget", "Layout", "(no tier)"];
    return [...keys].sort(
      (a, b) =>
        (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) -
        (order.indexOf(b) === -1 ? 99 : order.indexOf(b)),
    );
  }
  if (axis === "stability") {
    const order = ["Stable", "Beta", "Experimental", "Deprecated"];
    return [...keys].sort(
      (a, b) =>
        (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) -
        (order.indexOf(b) === -1 ? 99 : order.indexOf(b)),
    );
  }
  if (axis === "category") {
    const order = ["UI", "Lesson", "Internal"];
    return [...keys].sort(
      (a, b) =>
        (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) -
        (order.indexOf(b) === -1 ? 99 : order.indexOf(b)),
    );
  }
  if (axis === "createdMonth") {
    // Descending — newest first.
    return [...keys].sort((a, b) => b.localeCompare(a));
  }
  if (axis === "alpha") {
    return [...keys].sort();
  }
  // axis === "group" — preserve the CATEGORY_ORDER + GROUPS sequence the
  // library defined. Walk INDEX in that natural order and collect unique keys.
  const seen = new Set();
  const out = [];
  for (const cat of CATEGORY_ORDER) {
    for (const r of INDEX) {
      if (r.category !== cat) continue;
      const k = groupKeyOf(r, "group", CATEGORY_LABELS);
      if (seen.has(k)) continue;
      if (!keys.includes(k)) continue;
      seen.add(k);
      out.push(k);
    }
  }
  // Append any keys we didn't find via INDEX walk (defensive).
  for (const k of keys) if (!seen.has(k)) out.push(k);
  return out;
}
