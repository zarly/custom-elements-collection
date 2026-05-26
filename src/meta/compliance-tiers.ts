/**
 * Compliance tiers — see ADR-015 + studio job `0022.07`.
 *
 * Each meta field falls into one of four tiers:
 *
 *   MUST     — validator REFUSES on violation (studio refuses submit,
 *              benchmark zero-scores, publish blocks).
 *   SHOULD   — validator WARNS (studio warns, benchmark 0.5× penalty,
 *              lint warns).
 *   MAY      — informational; no warning.
 *   INTERNAL — auto-computed; do not edit by hand. Emitted into
 *              `dist/relations.json` / `dist/conformance.json` /
 *              `dist/meta-fields-registry.json`.
 *
 * Projected into `dist/registry.json` as `$schema.compliance` so
 * consumers can author generic validators without hardcoding field
 * lists.
 */

export const COMPLIANCE_TIERS = ["MUST", "SHOULD", "MAY", "INTERNAL"] as const;
export type ComplianceTier = (typeof COMPLIANCE_TIERS)[number];

export const COMPLIANCE_MAP: Record<ComplianceTier, readonly string[]> = {
  MUST: [
    // v1 identity
    "schemaVersion",
    "tag",
    "name",
    "className",
    "goal",
    "description",
    "stability",
    "created",
    "updated",
    "category",
    "tier",
    "tags",
    // v2 relations
    "requiredParent",
    "childPolicy",
    "tagDependencies",
    "slots[].acceptTags",
    // v2 rendering
    "contentModel",
    "deterministic",
    "nondeterministicReason", // conditional MUST when deterministic=false
  ],
  SHOULD: [
    // v1 lifecycle
    "since",
    "deprecatedIn",
    "replacedBy",
    "limitations",
    // v2 relations
    "interchangeableWith",
    "codeDependencies",
    "injects",
    "role",
    // v2 streaming
    "streamSafe",
    "streamingLifecycle",
    // v2 props
    "props[].semanticType",
  ],
  MAY: [
    // v1 relations / discovery
    "related",
    "subTags",
    // v2 slots / props
    "preferredSlotIn",
    "slotCompatible",
    "props[].aliases",
    "props[].semanticGroup",
    "slots[].acceptShapes",
    "slots[].required",
    // v1 extension
    "additional",
    // v1 a11y (unchanged)
    "a11y",
  ],
  INTERNAL: [
    // auto-computed in dist/relations.json
    "tagDependents",
    "codeDependents",
    "injectsInto",
    "childOf",
    "interchangeableSymmetric",
  ],
} as const;

/**
 * Reverse lookup: field path -> tier. Useful for generic-validator code
 * on the consumer side.
 */
export const FIELD_TIER: ReadonlyMap<string, ComplianceTier> = new Map(
  Object.entries(COMPLIANCE_MAP).flatMap(([tier, fields]) =>
    fields.map((f) => [f, tier as ComplianceTier] as const)
  )
);
