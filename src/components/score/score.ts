import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type ScoreTier = "high" | "med" | "low";

const VALID_TIERS = new Set<string>(["high", "med", "low"]);

/**
 * `<ce-score>` — a color-coded pill showing a numeric score.
 *
 * Usage:
 *
 *   <!-- Auto-tier from value/max (default max=10) -->
 *   <ce-score value="9.4"></ce-score>
 *
 *   <!-- Custom max -->
 *   <ce-score value="42" max="100"></ce-score>
 *
 *   <!-- Explicit tier override -->
 *   <ce-score value="6.2" tier="high"></ce-score>
 *
 *   <!-- Rich label in default slot -->
 *   <ce-score value="9.4">9.4<sup>*</sup></ce-score>
 *
 * Attributes:
 *   value   — numeric score (required; drives tier math)
 *   max     — denominator for auto-tier (default: 10)
 *   tier    — explicit tier override: "high" | "med" | "low"
 *   inline  — boolean (default true); pill is inline-flex by default
 *
 * Auto-tier thresholds (overridable globally via --ce-score-breakpoints):
 *   value/max >= 0.66 → high (green)
 *   value/max >= 0.33 → med  (amber)
 *   else              → low  (red)
 *
 * ARIA: role="meter" with aria-valuenow / aria-valuemin / aria-valuemax /
 *       aria-valuetext on the host element.
 */
export class CeScore extends CecElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--ce-inset-xs) var(--ce-inset-md);
      border-radius: var(--ce-radius-pill);
      font-size: var(--ce-text-sm);
      font-weight: 700;
      line-height: 1.2;
      white-space: nowrap;
      /* Default (before first update resolves tier): amber */
      background: var(--ce-color-amber-bg);
      color: var(--ce-color-amber);
      border: 1px solid var(--ce-color-amber-border);
    }

    /* Block display when inline=false */
    :host(:not([inline])) {
      display: flex;
    }

    /* Tier color: high → green */
    :host([tier="high"]) {
      background: var(--ce-color-green-bg);
      color: var(--ce-color-green);
      border-color: var(--ce-color-green-border);
    }

    /* Tier color: med → amber */
    :host([tier="med"]) {
      background: var(--ce-color-amber-bg);
      color: var(--ce-color-amber);
      border-color: var(--ce-color-amber-border);
    }

    /* Tier color: low → red */
    :host([tier="low"]) {
      background: var(--ce-color-red-bg);
      color: var(--ce-color-red);
      border-color: var(--ce-color-red-border);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  /** The numeric score. Drives auto-tier computation. */
  @property({ type: Number, reflect: true })
  value = 0;

  /** Denominator for tier computation. Default 10 (corpus-dominant 0–10 scale). */
  @property({ type: Number })
  max = 10;

  /**
   * When true (default), the pill is inline-flex — fits naturally in table
   * cells and inline text. Set to false for a block-level standalone score.
   */
  @property({ type: Boolean, reflect: true })
  inline = true;

  /**
   * Author-supplied tier override ("high" | "med" | "low"). When empty, tier
   * is auto-computed from value/max.
   *
   * DESIGN: We manage `tier` entirely outside Lit's property system to avoid
   * the attributeChangedCallback → property-setter feedback loop that would
   * corrupt auto-computation. The DOM attribute is written by willUpdate on
   * every render; the property getter/setter store only the author's explicit
   * intent in `_authorTier`.
   *
   * We must include "tier" in observedAttributes manually (no @property
   * decorator here because Lit 3 removed `noAccessor` and would stomp our
   * custom getter/setter). attributeChangedCallback handles "tier" explicitly.
   */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "tier"];
  }

  get tier(): ScoreTier | "" {
    return this._authorTier;
  }

  set tier(v: ScoreTier | "") {
    const old = this._authorTier;
    this._authorTier = VALID_TIERS.has(v) ? (v as ScoreTier) : "";
    if (old !== this._authorTier) {
      this.requestUpdate("tier", old);
    }
  }

  /** Holds the author's explicit tier intent. Never overwritten by auto-computation. */
  private _authorTier: ScoreTier | "" = "";

  /**
   * Guard flag: set to true while willUpdate writes the "tier" attribute so
   * that attributeChangedCallback knows to ignore that write and not corrupt
   * _authorTier with the auto-computed value.
   */
  private _writingTier = false;

  /**
   * Observe the "tier" attribute so HTML `<ce-score tier="high">` works.
   * We handle it ourselves and do NOT call super.attributeChangedCallback for
   * "tier" to prevent Lit from syncing the DOM attribute back into this.tier
   * (which would make auto-writes from willUpdate look like explicit overrides).
   *
   * We DO call super for all other attributes so Lit's normal update cycle runs.
   */
  override attributeChangedCallback(
    name: string,
    old: string | null,
    value: string | null
  ): void {
    if (name === "tier") {
      // Ignore writes that willUpdate itself issued — those are the computed
      // tier sync, not author intent. Only external attribute changes
      // (from HTML parse or external JS setAttribute) update _authorTier.
      if (this._writingTier) return;
      const next: ScoreTier | "" = VALID_TIERS.has(value ?? "") ? (value as ScoreTier) : "";
      if (next !== this._authorTier) {
        const prev = this._authorTier;
        this._authorTier = next;
        this.requestUpdate("tier", prev);
      }
      return;
    }
    super.attributeChangedCallback(name, old, value);
  }

  /** Compute the tier from value/max ratio, honouring explicit author override. */
  get #resolvedTier(): ScoreTier {
    // Author-supplied explicit tier takes precedence.
    if (this._authorTier === "high" || this._authorTier === "med" || this._authorTier === "low") {
      return this._authorTier;
    }
    const ratio = this.max > 0 ? this.value / this.max : 0;
    // --ce-score-breakpoints: two space-separated ratio thresholds.
    // Format: "0.8 0.5" means >= 0.8 → high, >= 0.5 → med, else → low.
    // Default: >= 0.66 high, >= 0.33 med, else → low.
    const bpRaw = getComputedStyle(this).getPropertyValue("--ce-score-breakpoints").trim();
    let highBp = 0.66;
    let medBp = 0.33;
    if (bpRaw) {
      const parts = bpRaw.split(/\s+/).map(Number);
      if (parts.length >= 2 && !parts.some(isNaN)) {
        highBp = parts[0];
        medBp = parts[1];
      }
    }
    if (ratio >= highBp) return "high";
    if (ratio >= medBp) return "med";
    return "low";
  }

  /** Format the numeric value for display (1 decimal place). */
  get #formattedValue(): string {
    return Number.isFinite(this.value) ? this.value.toFixed(1) : String(this.value);
  }

  override willUpdate(): void {
    const computed = this.#resolvedTier;

    // Manually sync the DOM attribute so CSS :host([tier="..."]) selectors work.
    // We raise _writingTier so attributeChangedCallback knows this change is
    // internal (auto-computed) and must not be treated as author intent.
    const current = this.getAttribute("tier");
    if (current !== computed) {
      this._writingTier = true;
      try {
        this.setAttribute("tier", computed);
      } finally {
        this._writingTier = false;
      }
    }

    // Sync ARIA meter attributes on host.
    this.setAttribute("role", "meter");
    this.setAttribute("aria-valuenow", String(this.value));
    this.setAttribute("aria-valuemin", "0");
    this.setAttribute("aria-valuemax", String(this.max));
    this.setAttribute("aria-valuetext", `${this.value} of ${this.max}`);
  }

  override render() {
    return html`<slot>${this.#formattedValue}</slot>`;
  }
}
