/**
 * Zod schema mirroring `src/meta/types.ts`.
 *
 * The `satisfies z.ZodType<ComponentMeta>` clause at the bottom keeps the
 * Zod schema and the hand-written TypeScript interface in sync at compile
 * time — drift in either direction surfaces as a TS error.
 */

import { z } from "zod";
import type { ComponentMeta } from "./types.js";
import { TIERS } from "./tiers.js";
import { SEMANTIC_TYPES } from "./semantic-types.js";

const tagPattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/;
const tagSchema = z.string().regex(tagPattern, "must be a valid custom-element tag");

const PropMetaSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean(),
  default: z.string().optional(),
  attribute: z.string().optional(),
  reflect: z.boolean().optional(),
  description: z.string().min(1),
  // v2 (CDR-012 MAY): historical attribute names
  aliases: z.array(z.string().min(1)).optional(),
  // v2 (ADR-015 SHOULD): semantic kind beyond TS `type`
  semanticType: z.enum(SEMANTIC_TYPES).optional(),
  // v2 (ADR-015 MAY): loose grouping for cross-component recognition
  semanticGroup: z.string().min(1).optional(),
});

const EventMetaSchema = z.object({
  name: z.string().min(1),
  detail: z.string().min(1),
  bubbles: z.boolean(),
  composed: z.boolean(),
  description: z.string().min(1),
});

const MethodMetaSchema = z.object({
  name: z.string().min(1),
  signature: z.string().min(1),
  description: z.string().min(1),
});

const SlotMetaSchema = z.object({
  name: z.string(), // "" is valid (default slot)
  description: z.string().min(1),
  required: z.boolean().optional(),
  // v2 (CDR-013 MUST): tag allowlist
  acceptTags: z.array(tagSchema).optional(),
  // v2 (CDR-012 MAY): shape descriptors
  acceptShapes: z.array(z.string().min(1)).optional(),
});

const CssVarMetaSchema = z.object({
  name: z
    .string()
    .regex(/^--/, "CSS variable names must start with --"),
  kind: z.enum(["color", "size", "font", "radius", "shadow", "other"]),
  source: z.enum(["token", "local"]),
  description: z.string().min(1),
  fallback: z.string().optional(),
});

const GlobalDepMetaSchema = z.object({
  api: z.string().min(1),
  purpose: z.string().min(1),
  writes: z.boolean(),
});

const SideEffectMetaSchema = z.object({
  kind: z.enum([
    "log",
    "storage",
    "network",
    "dom",
    "timer",
    "state",
    "other",
  ]),
  description: z.string().min(1),
  reason: z.string().min(1),
  guarded: z.boolean().optional(),
});

const InterchangeableEntrySchema = z.object({
  tag: tagSchema,
  scope: z.string().min(1).optional(),
  when: z.string().min(1).optional(),
});

const StreamingLifecycleSchema = z.object({
  finalizesAt: z.enum(["flush", "blockEnd", "chunkBoundary", "tagEnd"]),
});

export const ComponentMetaSchema = z.object({
  // v0.7/v0.8: accept both 1 and 2; v0.9 will narrow to 2 only.
  schemaVersion: z.union([z.literal(1), z.literal(2)]),

  tag: z
    .string()
    .regex(
      /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/,
      "must be a valid custom element tag"
    ),
  name: z.string().min(1),
  className: z.string().min(1),

  goal: z.string().min(20), // enforce a real sentence
  description: z.string().min(20),
  limitations: z.string().optional(),

  stability: z.enum(["stable", "beta", "experimental", "deprecated"]),
  since: z.string().optional(),
  deprecatedIn: z.string().optional(),
  replacedBy: z.string().optional(),

  // SCRIPT-MANAGED dates — see ADR-011, ADR-012.
  // `created` is the ISO-8601 date the meta first landed; `updated` is the
  // last date the component's `<stem>.ts` source bytes changed. Both are
  // maintained by `scripts/sync-meta-dates.ts` via the pre-commit hook.
  created: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "must be ISO date YYYY-MM-DD"),
  updated: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "must be ISO date YYYY-MM-DD"),

  props: z.array(PropMetaSchema),
  events: z.array(EventMetaSchema),
  methods: z.array(MethodMetaSchema).optional(),
  slots: z.array(SlotMetaSchema),

  cssVariables: z.array(CssVarMetaSchema),

  globalDependencies: z.array(GlobalDepMetaSchema),
  sideEffects: z.array(SideEffectMetaSchema),

  dependents: z.array(z.string()),
  dependencies: z.array(z.string()),
  related: z.array(z.string()),
  /**
   * Sub-tags registered alongside this component (multi-tag pattern).
   * Each value must be a valid custom-element tag. See `types.ts` for
   * the full contract. Optional — only populate when the component
   * registers additional custom elements beyond its primary tag.
   */
  subTags: z
    .array(
      z
        .string()
        .regex(
          /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/,
          "subTags entries must be valid custom-element tags"
        )
    )
    .optional(),

  category: z.enum(["ui", "lesson", "internal"]),
  tier: z.enum(TIERS),
  tags: z.array(z.string()).min(1),

  a11y: z
    .object({
      role: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),

  additional: z.record(z.unknown()).optional(),

  // ─────────────────────────────────────────────────────────────────
  //  v2 additions (ADR-015) — all optional during v0.7/v0.8 cycle.
  //  Codemod `scripts/migrate-v1-to-v2.ts` fills safe defaults.
  // ─────────────────────────────────────────────────────────────────

  // CDR-013 — structured relations
  requiredParent: z.array(tagSchema).optional(),
  childPolicy: z.enum(["none", "any", "constrained"]).optional(),
  codeDependencies: z.array(tagSchema).optional(),
  tagDependencies: z.array(tagSchema).optional(),
  injects: z.array(tagSchema).optional(),

  // CDR-012 — LLM equivalence
  interchangeableWith: z.array(InterchangeableEntrySchema).optional(),
  role: z.enum(["transparent-wrapper", "container", "leaf"]).optional(),

  // CDR-013 — slot positioning
  slotCompatible: z.boolean().optional(),
  preferredSlotIn: z.array(tagSchema).optional(),

  // CDR-014 — content model
  contentModel: z.enum(["block", "inline", "void"]).optional(),

  // CDR-015 — determinism + streaming
  deterministic: z.boolean().optional(),
  nondeterministicReason: z.string().min(8).optional(),
  streamSafe: z.boolean().optional(),
  streamingLifecycle: StreamingLifecycleSchema.optional(),
})
  // `updated` must not predate `created`. Lexicographic compare is correct
  // for the `YYYY-MM-DD` regex enforced above.
  .refine((m) => m.updated >= m.created, {
    message: "updated must be on or after created",
    path: ["updated"],
  })
  // CDR-015: deterministic=false REQUIRES nondeterministicReason.
  .refine(
    (m) => m.deterministic !== false || typeof m.nondeterministicReason === "string",
    {
      message:
        "nondeterministicReason is required when deterministic is false (CDR-015)",
      path: ["nondeterministicReason"],
    }
  )
  // CDR-014: contentModel="void" must not declare slots[].
  .refine(
    (m) => m.contentModel !== "void" || m.slots.length === 0,
    {
      message: "contentModel=\"void\" forbids declaring slots (CDR-014)",
      path: ["slots"],
    }
  )
  // CDR-013: childPolicy="none" must not declare slots with acceptTags.
  .refine(
    (m) =>
      m.childPolicy !== "none" ||
      m.slots.every((s) => !s.acceptTags || s.acceptTags.length === 0),
    {
      message:
        "childPolicy=\"none\" forbids slots[].acceptTags non-empty (CDR-013)",
      path: ["childPolicy"],
    }
  ) satisfies z.ZodType<ComponentMeta>;

export type { ComponentMeta };
