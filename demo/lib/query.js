import { esc } from "./dates.js";

/** Substring-match a record against the lowercased query. */
export function matchesQuery(record, q) {
  if (!q) return true;
  return record.searchHaystack.includes(q);
}

/** Escape regex metacharacters in a string. */
export function escRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Wrap the first case-insensitive occurrence of q in the label with <ce-mark>. */
export function highlightLabel(label, q) {
  if (!q) return esc(label);
  const re = new RegExp(escRegex(q), "i");
  const m = label.match(re);
  if (!m) return esc(label);
  const start = m.index;
  const end = start + m[0].length;
  return (
    esc(label.slice(0, start)) +
    `<ce-mark>${esc(label.slice(start, end))}</ce-mark>` +
    esc(label.slice(end))
  );
}
