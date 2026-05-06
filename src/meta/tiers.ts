// Canonical component tiers. Every meta.tier MUST be one of these strings;
// validate-meta enforces it. The order here is the order tiers appear in
// generated catalogs and the registry's `by-tier/` filter views.
//
// Adding a new tier: extend TIERS, update the classification rule in
// docs/adr/adr-006-component-tier.md §"Classification rule", and migrate
// affected meta files. Removing or renaming a tier is a one-way migration
// (touch every meta + the skill CLI flag + generated catalogs).

export const TIERS = ["brick", "widget", "layout"] as const;

export type Tier = (typeof TIERS)[number];

export function isTier(s: string): s is Tier {
  return (TIERS as readonly string[]).includes(s);
}
