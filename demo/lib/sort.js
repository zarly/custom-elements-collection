/** Sort comparators and related constants. All pure. */

export const SORT_OPTIONS = [
  { value: "a-z", label: "A → Z" },
  { value: "z-a", label: "Z → A" },
  { value: "recent-updated", label: "Recently updated" },
  { value: "recent-created", label: "Recently created" },
  { value: "most-deps", label: "Most dependents" },
  { value: "least-deps", label: "Least dependents" },
];

export const VALID_SORT_BY = new Set([
  "a-z",
  "z-a",
  "recent-updated",
  "recent-created",
  "most-deps",
  "least-deps",
]);

export const STABILITY_RANK = { stable: 0, beta: 1, experimental: 2, deprecated: 3 };

/** Compare two ISO YYYY-MM-DD date strings; null/undefined sorts last. */
export function cmpDateDesc(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return b.localeCompare(a);
}

/** Sort comparator factory keyed by sortBy. Tag-asc is the tiebreak. */
export function comparator(sortBy) {
  switch (sortBy) {
    case "z-a":
      return (a, b) => b.tag.localeCompare(a.tag);
    case "recent-updated":
      return (a, b) => cmpDateDesc(a.updated, b.updated) || a.tag.localeCompare(b.tag);
    case "recent-created":
      return (a, b) => cmpDateDesc(a.created, b.created) || a.tag.localeCompare(b.tag);
    case "most-deps":
      return (a, b) =>
        b.dependentsCount - a.dependentsCount || a.tag.localeCompare(b.tag);
    case "least-deps":
      return (a, b) =>
        a.dependentsCount - b.dependentsCount || a.tag.localeCompare(b.tag);
    case "a-z":
    default:
      return (a, b) => a.tag.localeCompare(b.tag);
  }
}
