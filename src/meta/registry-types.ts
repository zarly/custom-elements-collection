/**
 * Registry types — the LLM-tool-use-shaped projection of every meta JSON.
 *
 * The registry is a derived artifact built by `scripts/generate-registry.ts`
 * from every `*.meta.json` under `src/`. Consumers can read
 * `dist/registry.json` (full), `dist/registry/by-tier/<tier>.json`,
 * `dist/registry/by-group/<slug>.json`,
 * `dist/registry/by-category/<cat>.json`, or `dist/registry/<tag>.json`.
 *
 * The shape mirrors Anthropic / OpenAI tool-use input-schema records so a
 * consumer can do:
 *
 *   const tools = registry.components.map(c => ({
 *     name: c.tag,
 *     description: c.description,
 *     input_schema: c.input_schema,
 *   }));
 *
 * to assemble a `tools[]` array. The Anthropic / OpenAI projection itself
 * is intentionally NOT shipped from this package — see ADR-007.
 *
 * See `docs/adr/adr-007-component-registry.md` for the rationale and the
 * TS-type → JSON-Schema translation table.
 */

import type { ComponentCategory, ComponentStability } from "./types.js";
import type { Tier } from "./tiers.js";

/** Loose JSON Schema subset emitted by the generator. */
export interface JsonSchemaProperty {
  /** Primary type or [type, "null"] for nullable. */
  type?: string | string[];
  /** Closed enum (string literals only — TS unions are projected here). */
  enum?: ReadonlyArray<string | number | boolean>;
  /** Array element schema (when type === "array"). */
  items?: JsonSchemaProperty;
  /** Default value, stringified the same way the meta declared it. */
  default?: string;
  /** Human-readable description, copied from meta. */
  description?: string;
  /**
   * Original TS type string from the meta (e.g. "CecColor | null"). Always
   * preserved so consumers can fall back when the JSON-Schema projection
   * loses fidelity.
   */
  "x-tsType"?: string;
  /** Set when the prop reflects to/from an HTML attribute. */
  "x-attribute"?: string;
  /** Set when the prop reflects via a custom attribute name. */
  "x-reflect"?: boolean;
}

export interface JsonSchemaObject {
  type: "object";
  properties: Record<string, JsonSchemaProperty>;
  required: string[];
  additionalProperties?: false;
}

export interface RegistryEvent {
  /** DOM event name, e.g. "ce-card-activate". */
  name: string;
  /** TS type of `CustomEvent.detail`, copied verbatim from meta. */
  detail: string;
  bubbles: boolean;
  composed: boolean;
  description: string;
}

export interface RegistrySlot {
  /** "" = default slot. */
  name: string;
  description: string;
  required?: boolean;
}

export interface RegistryCssVar {
  /** Custom property name including the `--` prefix. */
  name: string;
  kind: "color" | "size" | "font" | "radius" | "shadow" | "other";
  description: string;
  fallback?: string;
}

export interface RegistryComponent {
  /** Custom-element tag name, e.g. "ce-button". */
  tag: string;
  /** Human-readable name, e.g. "Button". */
  name: string;
  /** Exported class name, e.g. "CeButton". */
  className: string;
  /** Subpath import specifier, e.g. "custom-elements-collection/button". */
  import: string;
  tier: Tier;
  /** Manifest group (= meta.tags[0]). */
  group: string;
  category: ComponentCategory;
  stability: ComponentStability;
  /** SRP statement copied from meta. */
  goal: string;
  /** Long description copied from meta. */
  description: string;
  /** When NOT to use — copied from meta when present. */
  limitations?: string;
  /** JSON-Schema-shaped projection of props. Suitable for LLM tool-use. */
  input_schema: JsonSchemaObject;
  events: RegistryEvent[];
  slots: RegistrySlot[];
  cssVariables: RegistryCssVar[];

  // ─── v2 additions (ADR-015) ─────────────────────────────────────
  // Projected verbatim from meta. Optional in v2 schema.
  contentModel?: "block" | "inline" | "void";
  role?: "transparent-wrapper" | "container" | "leaf";
  deterministic?: boolean;
  streamSafe?: boolean;
  childPolicy?: "none" | "any" | "constrained";
  requiredParent?: string[];
  tagDependencies?: string[];
  codeDependencies?: string[];
  injects?: string[];
  interchangeableWith?: Array<{ tag: string; scope?: string; when?: string }>;
  slotCompatible?: boolean;
  preferredSlotIn?: string[];
}

/**
 * Metadata about which filter (if any) was applied to produce this registry
 * file. The full registry has `filter: null`; filtered views use one of the
 * three closed-enum axes.
 */
export type RegistryFilter =
  | null
  | { axis: "tier"; value: Tier }
  | { axis: "group"; value: string }
  | { axis: "category"; value: ComponentCategory }
  | { axis: "tag"; value: string };

/**
 * v2 (ADR-015 + 0022.07) — exported compliance-tier map. Consumers can
 * write generic validators without hardcoding which fields are MUST.
 */
export interface RegistrySchemaBlock {
  /** Meta-schema version used in source manifests. */
  metaSchemaVersion: 1 | 2;
  /** Maps tier label → list of field paths in that tier. */
  compliance: Record<"MUST" | "SHOULD" | "MAY" | "INTERNAL", readonly string[]>;
}

export interface Registry {
  /** Registry-document schema version. Bumped to 2 in v0.7 (adds $schema block). */
  schemaVersion: 1 | 2;
  /** Always "custom-elements-collection". */
  library: string;
  /** Library version (matches package.json). */
  version: string;
  /** ISO-8601 timestamp from build time. */
  generatedAt: string;
  /** Filter applied to this view, or null for the full registry. */
  filter: RegistryFilter;
  /** Sorted by category (ui → lesson → internal) then tag. */
  components: RegistryComponent[];
  /**
   * v2 (ADR-015): meta-schema info + compliance tiers (MUST/SHOULD/MAY/INTERNAL).
   * Optional on v1 registries; required from v0.8.
   */
  $schema?: RegistrySchemaBlock;
}

export type { Tier } from "./tiers.js";
export type {
  ComponentCategory,
  ComponentStability,
  EventMeta,
  SlotMeta,
} from "./types.js";
