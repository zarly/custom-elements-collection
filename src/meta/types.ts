/**
 * Component meta types — the canonical, machine-readable specification
 * for every component shipped from this package.
 *
 * See `docs/adr/adr-005-component-meta.md` and
 * `docs/COMPONENT_META_PLAN.md` for the rationale and full plan.
 *
 * Each component lives in its own subfolder alongside a `<name>.meta.json`
 * file that conforms to {@link ComponentMeta}. A Zod schema in
 * `src/meta/schema.ts` enforces the shape at build time.
 */

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

export interface ComponentMeta {
  // — Schema ————————————————————————————————————
  /**
   * Meta-schema version. Currently always `1`. Bumped on any non-additive
   * change to the meta shape (rename, removal, narrowed enum). See ADR-007.
   */
  schemaVersion: 1;

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
}
