/**
 * Component meta types — the canonical, machine-readable specification
 * for every component shipped from this package.
 *
 * See `docs/adr/adr-005-component-meta.md` (v1 shape rationale),
 * `docs/adr/adr-015-meta-schema-v2.md` (v2 additions), and the field
 * registry at `docs/cec/meta-fields-registry.md` (meta-repo root).
 *
 * Each component lives in its own subfolder alongside a `<name>.meta.json`
 * file that conforms to {@link ComponentMeta}. A Zod schema in
 * `src/meta/schema.ts` enforces the shape at build time.
 *
 * v2 additions are all `?` (optional) so v1 manifests continue to
 * validate; the codemod `scripts/migrate-v1-to-v2.ts` rewrites every
 * existing meta to v2 with safe defaults in one mechanical pass.
 */
import type { SemanticType } from "./semantic-types.js";

export type ComponentCategory = "ui" | "lesson" | "internal";
/**
 * Component tier — closed enum (see ADR-006). Replaces the legacy `scale`
 * field whose 4-value enum included a fuzzy `"component"` catch-all.
 */
export type ComponentTier = "brick" | "widget" | "layout";
export type ComponentStability =
  | "stable"
  | "beta"
  | "experimental"
  | "deprecated";
export type CssVarKind =
  | "color"
  | "size"
  | "font"
  | "radius"
  | "shadow"
  | "other";
export type SideEffectKind =
  | "log"
  | "storage"
  | "network"
  | "dom"
  | "timer"
  | "state"
  | "other";

export interface PropMeta {
  /** property name, e.g. "accent" */
  name: string;
  /** TS type string, e.g. "CecColor | null" */
  type: string;
  required: boolean;
  /** stringified, e.g. "null", "'medium'" */
  default?: string;
  /** if different from prop name */
  attribute?: string;
  /** syncs to/from HTML attribute */
  reflect?: boolean;
  description: string;
  /**
   * v2 (CDR-012): historical attribute names recognized as equivalent
   * for benchmark scoring + docs. The runtime does NOT read aliases
   * unless the component explicitly installs a fallback.
   */
  aliases?: string[];
  /**
   * v2 (ADR-015): semantic kind beyond TypeScript `type` — e.g.
   * `"email"` / `"percent-0-100"` / `"hex-color"`. Drives studio
   * submit-validation and benchmark canonicalization.
   */
  semanticType?: SemanticType;
  /**
   * v2 (ADR-015): loose grouping label for cross-component prop
   * recognition (e.g. all `label` props in `lesson-*` could share
   * `"lesson-step-label"`).
   */
  semanticGroup?: string;
}

export interface EventMeta {
  /** DOM event name, e.g. "ce-card-activate" */
  name: string;
  /** TS type of CustomEvent.detail, e.g. "{ id: string }" | "void" */
  detail: string;
  bubbles: boolean;
  /** crosses shadow-DOM boundary */
  composed: boolean;
  description: string;
}

export interface MethodMeta {
  name: string;
  /** "(target: Element) => void" */
  signature: string;
  description: string;
}

export interface SlotMeta {
  /** "" = default slot */
  name: string;
  description: string;
  required?: boolean;
  /**
   * v2 (CDR-013 MUST): allowlist of tag names valid in this slot.
   * Empty / absent = unconstrained.
   */
  acceptTags?: string[];
  /**
   * v2 (CDR-012 MAY): shape descriptors of what's valid in the slot —
   * e.g. `"child-tag:ce-bar-row"`, `"semantic-html:ul,li"`,
   * `"semantic-html:div,p"`. For benchmark canonicalization.
   */
  acceptShapes?: string[];
}

export interface CssVarMeta {
  /** "--ce-surface" */
  name: string;
  kind: CssVarKind;
  /** "token" = design system token, "local" = component override */
  source: "token" | "local";
  description: string;
  /** CSS fallback value */
  fallback?: string;
}

export interface GlobalDepMeta {
  /** "localStorage.getItem", "fetch", "location.href" */
  api: string;
  /** why it is accessed */
  purpose: string;
  /** does the component mutate this API? */
  writes: boolean;
}

export interface SideEffectMeta {
  kind: SideEffectKind;
  description: string;
  /** why this side effect is acceptable */
  reason: string;
  /** behind a debug flag or feature check? */
  guarded?: boolean;
}

/** v2 (CDR-013): explicit child-acceptance policy. */
export type ChildPolicy = "none" | "any" | "constrained";

/** v2 (CDR-014): content-model categorization for generative-dom + studio. */
export type ContentModel = "block" | "inline" | "void";

/** v2 (CDR-012): wrapper / container / leaf categorization. */
export type ComponentRole = "transparent-wrapper" | "container" | "leaf";

/** v2 (CDR-015): when the component DOM is considered final. */
export type StreamingFinalizesAt =
  | "flush"
  | "blockEnd"
  | "chunkBoundary"
  | "tagEnd";

/** v2 (CDR-012): semantic-equivalence declaration. */
export interface InterchangeableEntry {
  /** Tag name that may substitute for this component. */
  tag: string;
  /** Optional scope label, e.g. `"summary-tone"`, `"single-value"`. */
  scope?: string;
  /** Optional condition string in author-prose; advisory for scorer. */
  when?: string;
}

/** v2 (CDR-015): streaming behavior declaration. */
export interface StreamingLifecycleMeta {
  finalizesAt: StreamingFinalizesAt;
}

export interface ComponentMeta {
  // — Schema ————————————————————————————————————
  /**
   * Meta-schema version. v1 manifests use `1`; v2 use `2`. Both are
   * accepted by the validator during the v0.7/v0.8 release cycle.
   * v0.9 will refuse `1`. See ADR-015.
   */
  schemaVersion: 1 | 2;

  // — Identity ——————————————————————————————————
  /** "ce-card" */
  tag: string;
  /** "Card" */
  name: string;
  /** "CeCard" */
  className: string;

  // — Purpose ———————————————————————————————————
  /** SRP statement: why created + when to use */
  goal: string;
  /** full prose description */
  description: string;
  /** when NOT to use; responsibility boundaries */
  limitations?: string;

  // — Lifecycle —————————————————————————————————
  stability: ComponentStability;
  /** semver version when introduced, e.g. "0.3.0" */
  since?: string;
  /** version when deprecated */
  deprecatedIn?: string;
  /** tag name of replacement component */
  replacedBy?: string;
  /**
   * ISO-8601 date (YYYY-MM-DD) the meta was first introduced.
   *
   * SCRIPT-MANAGED — see ADR-011, ADR-012. Maintained automatically by
   * `scripts/sync-meta-dates.ts`, fired from the simple-git-hooks
   * pre-commit hook on every commit. Humans and agents never edit this.
   */
  created: string;
  /**
   * ISO-8601 date (YYYY-MM-DD) the component source last changed.
   *
   * SCRIPT-MANAGED — bumped automatically when the SHA-256 of `<stem>.ts`
   * (only — see ADR-012) differs from the entry in
   * `src/meta/content-hashes.json`. Must satisfy `updated >= created`.
   */
  updated: string;

  // — Public API ————————————————————————————————
  props: PropMeta[];
  events: EventMeta[];
  /** imperative public API — rare in web components */
  methods?: MethodMeta[];
  /** required; empty array if no slots */
  slots: SlotMeta[];

  // — Styling API ———————————————————————————————
  /** required; empty array if none */
  cssVariables: CssVarMeta[];

  // — Environment impact ————————————————————————
  /** required; empty array if none */
  globalDependencies: GlobalDepMeta[];
  /** required; empty array if none */
  sideEffects: SideEffectMeta[];

  // — Dependency graph — all required; populate when non-empty
  /** tags that depend ON this component */
  dependents: string[];
  /** tags this component depends ON */
  dependencies: string[];
  /** related by other means (not parent/child) */
  related: string[];
  /**
   * Sub-tags registered alongside this component (multi-tag pattern).
   *
   * Example: `ce-segmented` registers `ce-segment` as a co-element.
   * `ce-tree` registers `ce-tree-node`. Sub-tags share the parent's
   * lifecycle, are bundled together, and do NOT need their own meta
   * file. The dependency-graph validator silently accepts sub-tags
   * referenced in the parent's `dependencies[]`.
   *
   * Optional — populate only when the component registers additional
   * `customElements.define()` calls beyond its primary tag.
   */
  subTags?: string[];

  // — Discovery —————————————————————————————————
  category: ComponentCategory;
  /** Structural tier (see ADR-006). Replaces the legacy `scale` field. */
  tier: ComponentTier;
  tags: string[];

  // — Accessibility ——————————————————————————————
  a11y?: {
    /** ARIA landmark/widget role */
    role?: string;
    /** accessibility contract for consumers */
    notes?: string;
  };

  // — Extension —————————————————————————————————
  additional?: Record<string, unknown>;

  // ═════════════════════════════════════════════════════════════════════
  //   v2 additions — see ADR-015, CDR-012 / 013 / 014 / 015.
  //   All optional; codemod `scripts/migrate-v1-to-v2.ts` fills safe
  //   defaults. `dependents` and `dependencies` above remain valid in
  //   v0.7+v0.8; refused at v0.9.
  // ═════════════════════════════════════════════════════════════════════

  /** v2 (CDR-013 MUST): tags this component requires as a parent. */
  requiredParent?: string[];
  /** v2 (CDR-013 MUST): child-acceptance policy. Default `"any"`. */
  childPolicy?: ChildPolicy;
  /** v2 (CDR-013 SHOULD): TS-level class imports (build-time deps). */
  codeDependencies?: string[];
  /** v2 (CDR-013 MUST): runtime tag children (composition deps). */
  tagDependencies?: string[];
  /** v2 (CDR-013 SHOULD): tags programmatically created in render(). */
  injects?: string[];

  /** v2 (CDR-012 SHOULD): semantic equivalents for benchmark scoring. */
  interchangeableWith?: InterchangeableEntry[];
  /** v2 (CDR-012 SHOULD): wrapper/container/leaf role. Default `"leaf"`. */
  role?: ComponentRole;

  /** v2 (CDR-013 MAY): true (default) if this tag may be placed in another's slot. */
  slotCompatible?: boolean;
  /** v2 (CDR-013 MAY): preferred parent tags for LLM tool-use hints. */
  preferredSlotIn?: string[];

  /** v2 (CDR-014 MUST): block / inline / void. */
  contentModel?: ContentModel;

  /** v2 (CDR-015 MUST): CDR-009 conformance declaration. */
  deterministic?: boolean;
  /** v2 (CDR-015 MUST when deterministic=false): escape-hatch justification. */
  nondeterministicReason?: string;
  /** v2 (CDR-015 SHOULD): UX-1..3 streaming-safety declaration. */
  streamSafe?: boolean;
  /** v2 (CDR-015 SHOULD): ADR-014 finalization point. */
  streamingLifecycle?: StreamingLifecycleMeta;
}
