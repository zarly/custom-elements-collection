/**
 * Date utilities and HTML-escaping helper.
 * Kept together because buildRowMeta is the only consumer of both.
 */

/** Escape a string for safe insertion into HTML text or attributes. */
export function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Number of whole days between an ISO YYYY-MM-DD date and today (local). */
export function daysSinceIso(iso) {
  if (!iso) return Infinity;
  const d = new Date(iso + "T00:00:00");
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((start - d) / 86400000);
}

/** Stability → chip type mapping. */
const STAB_COLOR = {
  beta: "blue",
  experimental: "yellow",
  deprecated: "red",
};

/**
 * Compute the per-row meta HTML based on optional view options.
 *
 * @param {object} record  — IndexRecord (tag, stability, updated, created, …)
 * @param {object} [view]  — view-option snapshot from ReactiveForm
 * @param {boolean} [view.showStability]   — show stability chip when non-stable
 * @param {boolean} [view.showUpdated]     — show updated date
 * @param {boolean} [view.showCreated]     — show created date
 *
 * When called without a `view` argument (legacy / no view prefs), returns
 * an empty string so no dates appear by default (v3 default: all OFF except
 * showStability which is ON by default but needs a view object to activate).
 */
export function buildRowMeta(record, view = {}) {
  const parts = [];
  if (view.showStability && record.stability && record.stability !== "stable") {
    const type = STAB_COLOR[record.stability] ?? "muted";
    parts.push(`<ce-chip type="${esc(type)}" size="sm" outlined>${esc(record.stability)}</ce-chip>`);
  }
  if (view.showUpdated && record.updated) {
    const days = daysSinceIso(record.updated);
    if (days <= 30) {
      parts.push(`<ce-relative-time datetime="${esc(record.updated)}T12:00:00"></ce-relative-time>`);
    } else {
      parts.push(`<span class="nav-meta-old">${esc(record.updated)}</span>`);
    }
  }
  if (view.showCreated && record.created) {
    parts.push(`<span class="nav-meta-old">${esc(record.created)}</span>`);
  }
  return parts.join(" ");
}
