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

const PropMetaSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean(),
  default: z.string().optional(),
  attribute: z.string().optional(),
  reflect: z.boolean().optional(),
  description: z.string().min(1),
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

export const ComponentMetaSchema = z.object({
  schemaVersion: z.literal(1),

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
}) satisfies z.ZodType<ComponentMeta>;

export type { ComponentMeta };
