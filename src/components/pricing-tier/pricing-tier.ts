import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

export interface PricingFeature {
  label: string;
  included?: boolean;
  note?: string;
}

/**
 * `<ce-pricing-tier>` — a single pricing tier card.
 *
 * Attributes:
 *   name        — tier name (required)
 *   sub         — sub-headline beneath the name
 *   price       — price string ("1 990 ₽", "по запросу"); allow slot="price" override
 *   period      — period suffix appended to price ("мес", "year")
 *   badge       — small badge above name; allow slot="badge" override
 *   highlighted — boolean; accent border to visually emphasise this tier
 *   cta         — CTA label; renders a button or, with cta-href, a link
 *   cta-href    — when set, CTA renders as <a href>
 *   features    — JSON array {label, included?, note?}; if non-empty, wins over slot
 *
 * Slots:
 *   (default)   — feature items; each direct child gets a checkmark prefix
 *                 unless it carries the `not-included` attribute (× prefix)
 *   price       — rich price override (strikethrough, sub-decimal, etc.)
 *   badge       — rich badge override
 *   cta         — rich CTA override
 *   footer      — optional area below features
 *
 * Events:
 *   ce-pricing-cta — fires when the button-form CTA is clicked (no cta-href)
 */
export class CePricingTier extends CecElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--ce-space-3);
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-4) var(--ce-space-5);
      transition: border-color var(--ce-transition);
      position: relative;
    }

    :host([highlighted]) {
      border: 2px solid var(--ce-color-blue);
    }

    /* ── badge ─────────────────────────────────────────── */
    .ce-pricing__badge {
      display: inline-flex;
      align-items: center;
      background: var(--ce-color-blue-bg);
      color: var(--ce-color-blue);
      border: 1px solid var(--ce-color-blue-border);
      border-radius: var(--ce-radius-pill);
      font-size: var(--ce-text-xs);
      font-weight: 700;
      letter-spacing: 0.04em;
      padding: var(--ce-inset-xs) var(--ce-space-2);
    }

    /* ── head: name + sub ──────────────────────────────── */
    .ce-pricing__name {
      font-size: var(--ce-text-lg);
      font-weight: 700;
      color: var(--ce-text);
      line-height: var(--ce-line-tight);
    }

    .ce-pricing__sub {
      font-size: var(--ce-text-sm);
      color: var(--ce-muted);
      margin-top: var(--ce-space-1);
    }

    /* ── price ─────────────────────────────────────────── */
    .ce-pricing__price-wrap {
      margin-top: var(--ce-space-1);
    }

    .ce-pricing__price {
      font-size: var(--ce-text-2xl);
      font-weight: 800;
      color: var(--ce-text);
      line-height: var(--ce-line-tight);
      letter-spacing: -0.01em;
    }

    .ce-pricing__period {
      font-size: var(--ce-text-sm);
      color: var(--ce-muted);
      margin-left: var(--ce-space-1);
      font-weight: 400;
    }

    /* ── features ──────────────────────────────────────── */
    .ce-pricing__features {
      display: flex;
      flex-direction: column;
      gap: var(--ce-space-2);
      flex: 1;
    }

    /* JSON-rendered feature rows */
    .ce-pricing__feature {
      display: flex;
      align-items: baseline;
      gap: var(--ce-space-2);
      font-size: var(--ce-text-sm);
      color: var(--ce-text);
    }

    .ce-pricing__feature.is-excluded {
      color: var(--ce-dim);
    }

    .ce-pricing__feature-icon {
      flex-shrink: 0;
      font-style: normal;
    }

    .ce-pricing__feature.is-excluded .ce-pricing__feature-icon {
      color: var(--ce-dim);
    }

    .ce-pricing__feature-note {
      color: var(--ce-muted);
      font-size: var(--ce-text-xs);
    }

    /* Slot-children feature styling via CSS attribute selectors (CDR-006).
     Any direct slotted child gets a ✓ prefix via ::before.
     Children with [not-included] get × and muted color.
     Children with [included] get explicit ✓. */
    ::slotted(*) {
      display: flex;
      align-items: baseline;
      gap: var(--ce-space-2);
      font-size: var(--ce-text-sm);
      color: var(--ce-text);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    ::slotted(*::before) {
      content: "✓";
      color: var(--ce-color-green);
      font-weight: 700;
      flex-shrink: 0;
    }

    ::slotted([not-included]) {
      color: var(--ce-dim);
    }

    /* ── CTA ────────────────────────────────────────────── */
    .ce-pricing__cta {
      display: block;
      text-align: center;
      margin-top: var(--ce-space-2);
      background: transparent;
      color: var(--ce-color-blue);
      border: 1px solid var(--ce-color-blue-border);
      border-radius: var(--ce-radius-sm);
      padding: var(--ce-inset-lg) var(--ce-space-4);
      cursor: pointer;
      font: inherit;
      font-weight: 600;
      font-size: var(--ce-text-sm);
      text-decoration: none;
      transition: background var(--ce-transition-fast);
      width: 100%;
      box-sizing: border-box;
    }

    .ce-pricing__cta:hover {
      background: var(--ce-color-blue-bg);
    }

    :host([highlighted]) .ce-pricing__cta {
      background: var(--ce-color-blue);
      color: var(--ce-text-inverse);
      border-color: var(--ce-color-blue);
    }

    :host([highlighted]) .ce-pricing__cta:hover {
      background: var(--ce-color-blue);
      opacity: 0.9;
    }

    /* ── footer ─────────────────────────────────────────── */
    .ce-pricing__footer {
      margin-top: var(--ce-space-2);
      font-size: var(--ce-text-sm);
      color: var(--ce-muted);
      border-top: 1px solid var(--ce-border-soft);
      padding-top: var(--ce-space-2);
    }

    .ce-pricing__footer:not(:has(::slotted(*))) {
      display: none;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true }) name = "";
  @property({ type: String }) sub = "";
  @property({ type: String }) price = "";
  @property({ type: String }) period = "";
  @property({ type: String }) badge = "";
  @property({ type: Boolean, reflect: true }) highlighted = false;
  @property({ type: String }) cta = "";
  @property({ type: String, attribute: "cta-href" }) ctaHref = "";

  @property(jsonProp<PricingFeature[]>([]))
  features: PricingFeature[] = [];

  override render() {
    const hasBadgeSlot = this.#hasNamedSlot("badge");
    const hasPriceSlot = this.#hasNamedSlot("price");
    const hasCtaSlot = this.#hasNamedSlot("cta");
    const hasFooterSlot = this.#hasNamedSlot("footer");
    const useJsonFeatures = this.features.length > 0;

    return html`
      ${hasBadgeSlot
        ? html`<div class="ce-pricing__badge"><slot name="badge"></slot></div>`
        : this.badge
        ? html`<div class="ce-pricing__badge">${this.badge}</div>`
        : nothing}

      <div class="ce-pricing__head">
        <div class="ce-pricing__name">${this.name}</div>
        ${this.sub
          ? html`<div class="ce-pricing__sub">${this.sub}</div>`
          : nothing}
      </div>

      <div
        class="ce-pricing__price-wrap"
        aria-label=${this.price
          ? this.period
            ? `Цена: ${this.price} / ${this.period}`
            : `Цена: ${this.price}`
          : nothing}
      >
        ${hasPriceSlot
          ? html`<slot name="price"></slot>`
          : this.price
          ? html`<span class="ce-pricing__price">${this.price}</span>${this.period
              ? html`<span class="ce-pricing__period">/${this.period}</span>`
              : nothing}`
          : nothing}
      </div>

      <div class="ce-pricing__features">
        ${useJsonFeatures
          ? this.#renderJsonFeatures()
          : html`<slot></slot>`}
      </div>

      ${hasCtaSlot
        ? html`<slot name="cta"></slot>`
        : this.cta
        ? this.ctaHref
          ? html`<a class="ce-pricing__cta" href=${this.ctaHref}>${this.cta}</a>`
          : html`<button class="ce-pricing__cta" type="button" @click=${this.#emitCta}>
              ${this.cta}
            </button>`
        : nothing}

      ${hasFooterSlot
        ? html`<div class="ce-pricing__footer"><slot name="footer"></slot></div>`
        : nothing}
    `;
  }

  #renderJsonFeatures() {
    return this.features.map((f) => {
      const included = f.included !== false;
      return html`
        <div class="ce-pricing__feature ${included ? "" : "is-excluded"}">
          <i class="ce-pricing__feature-icon" aria-hidden="true">${included ? "✓" : "×"}</i>
          <span>${f.label}${f.note
            ? html` <span class="ce-pricing__feature-note">(${f.note})</span>`
            : nothing}</span>
        </div>
      `;
    });
  }

  #hasNamedSlot(name: string): boolean {
    return !!this.querySelector(`[slot="${name}"]`);
  }

  #emitCta = (): void => {
    this.dispatchEvent(
      new CustomEvent("ce-pricing-cta", { bubbles: true, composed: true })
    );
  };
}
