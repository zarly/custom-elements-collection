/**
 * Index builder — joins COMPONENTS + META + EXAMPLES into IndexRecord[].
 *
 * Every navigation / filter / sort / group operation in the demo reads from
 * the index — never from COMPONENTS or META directly.
 *
 * IndexRecord shape:
 *   { tag, name, className, category, group, tier, stability,
 *     description, tags, dependentsCount, dependenciesCount,
 *     hasEvents, hasSlots, hasCssVars, hasGlobalDeps, hasSideEffects,
 *     created, updated,           // null until Stage 1 backfill lands
 *     searchHaystack }            // lowercased, single string
 */

/** CATEGORY_ORDER + CATEGORY_LABELS control sidebar ordering and group names. */
export const CATEGORY_ORDER = ["ui", "lesson", "internal"];
export const CATEGORY_LABELS = {
  ui: "UI",
  lesson: "Lesson",
  internal: "Internal",
};

/** Stability → ce-chip color mapping, kept narrow on purpose. */
export const STABILITY_CHIP = {
  stable: "green",
  beta: "blue",
  experimental: "amber",
  deprecated: "red",
};

/**
 * Build a single source-of-truth index over every component. One record per
 * registered tag, joined from COMPONENTS (manifest) + META[tag] (full meta).
 */
export function buildIndex(COMPONENTS, META) {
  return COMPONENTS.map((c) => {
    const meta = META[c.tag] ?? {};
    const tags = Array.isArray(meta.tags) ? meta.tags : [];
    const goal = meta.goal ?? "";
    const description = meta.description ?? c.description ?? "";
    const searchHaystack = [
      c.tag,
      c.name,
      goal,
      description,
      tags.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return {
      tag: c.tag,
      name: c.name,
      className: c.className,
      category: c.category,
      group: tags[0] ?? c.group ?? "",
      tier: meta.tier ?? null,
      stability: meta.stability ?? "stable",
      description,
      tags,
      dependentsCount: Array.isArray(meta.dependents) ? meta.dependents.length : 0,
      dependenciesCount: Array.isArray(meta.dependencies)
        ? meta.dependencies.length
        : 0,
      hasEvents: Array.isArray(meta.events) && meta.events.length > 0,
      hasSlots: Array.isArray(meta.slots) && meta.slots.length > 0,
      hasCssVars:
        Array.isArray(meta.cssVariables) && meta.cssVariables.length > 0,
      hasGlobalDeps:
        Array.isArray(meta.globalDependencies) &&
        meta.globalDependencies.length > 0,
      hasSideEffects:
        Array.isArray(meta.sideEffects) && meta.sideEffects.length > 0,
      created: meta.created ?? null,
      updated: meta.updated ?? null,
      searchHaystack,
    };
  });
}
