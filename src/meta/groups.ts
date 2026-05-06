// Canonical component groups. The first entry of every meta.tags array MUST be
// one of these strings; validate-meta enforces it. The order here is the order
// the demo nav, SKILL.md catalog, and bundle-stats rollup display in.
//
// Adding a new group: extend GROUPS here, add the corresponding rationale to
// CONTRIBUTING.md, then update meta files. Removing or renaming a group is a
// one-way migration — touch every meta file plus the README's group table.

export const GROUPS = [
  "Layout & primitives",
  "Comparison & narrative",
  "Chat surfaces",
  "Feedback",
  "Metrics & charts",
  "Dashboard",
  "Forms",
  "Content",
  "Education",
  "Docs",
] as const;

export type Group = (typeof GROUPS)[number];

export function isGroup(s: string): s is Group {
  return (GROUPS as readonly string[]).includes(s);
}
