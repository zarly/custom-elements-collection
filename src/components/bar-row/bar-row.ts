import { html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";
import { resolveColor } from "../../internal/charts/color.js";
import { number as formatNumber } from "../../internal/charts/format.js";

/** Where the numeric value is displayed relative to the bar track. CDR-001: finite style enum. */
export type ValueDisplay = "inside" | "outside" | "hidden";

/**
 * `<ce-bar-row>` — a single horizontal progress-bar row.
 *
 * Use inside `<ce-bar-chart>` as a slot child (CDR-005), or standalone.
 *
 * When nested inside `<ce-bar-chart>`, the parent reads `value` and `color`
 * from this element's attributes and consumes the `label` and `meta` slot
 * HTML via querySelectorAll. The row renders nothing (display:contents).
 * When used standalone it renders a complete single-row bar with ARIA
 * progressbar semantics, label, fill, and meta.
 *
 * Slots:
 *   label — rich label content (span, a, ce-chip, …). Wins over `label` attr.
 *   meta  — trailing meta label (+12%, count, …). Wins over `meta` attr.
 *   (default) — not used; reserved for forward-compat.
 *
 * Attributes:
 *   value         — required, numeric 0..max.
 *   max           — defaults 100; fill = value/max × 100%.
 *   color         — named token or CSS color (default blue).
 *   label         — plain-text label; rich slot wins if both present.
 *   meta          — plain-text meta; rich slot wins if both present.
 *   value-display — "inside" | "outside" | "hidden" (default "inside").
 */
export class CeBarRow extends CecElement {
  static override styles = css`
    :host {
      display: contents; /* invisible when nested inside ce-bar-chart */
    }
    :host([data-standalone]) {
      display: block;
    }

    /* Standalone layout — minimal single-row bar */
    .ce-sr-wrap {
      display: grid;
      grid-template-columns: auto 1fr auto;
      column-gap: var(--ce-space-3);
      align-items: center;
    }
    .ce-sr-label {
      text-align: right;
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ce-sr-track {
      height: var(--ce-bar-row-track-h, 18px);
      background: var(--ce-surface-2);
      border-radius: var(--ce-radius-sm, 4px);
      overflow: hidden;
      position: relative;
    }
    .ce-sr-fill {
      height: 100%;
      border-radius: var(--ce-radius-sm, 4px);
      display: flex;
      align-items: center;
      padding: 0 var(--ce-space-2);
      color: var(--ce-text);
      font-size: var(--ce-text-xs);
      font-weight: 600;
      white-space: nowrap;
      transition: width var(--ce-transition, 0.2s ease);
    }
    @media (prefers-reduced-motion: reduce) {
      .ce-sr-fill { transition: none; }
    }
    .ce-sr-value-outside {
      color: var(--ce-muted);
      font-size: var(--ce-text-xs);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .ce-sr-meta {
      color: var(--ce-muted);
      font-size: var(--ce-text-xs);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    /* Color variants via :host([color="..."]) selectors — reason Shadow DOM is used. */
    :host([color="green"])  { --ce-bar-row-fill: var(--ce-color-green);  }
    :host([color="red"])    { --ce-bar-row-fill: var(--ce-color-red);    }
    :host([color="amber"])  { --ce-bar-row-fill: var(--ce-color-amber);  }
    :host([color="blue"])   { --ce-bar-row-fill: var(--ce-color-blue);   }
    :host([color="purple"]) { --ce-bar-row-fill: var(--ce-color-purple); }
    :host([color="cyan"])   { --ce-bar-row-fill: var(--ce-color-cyan);   }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  /** The bar value. When `max` is set, fill = value/max × 100. */
  @property({ type: Number, reflect: true }) value = 0;

  /** Maximum value. Defaults to 100. Fill = value/max × 100. */
  @property({ type: Number }) max = 100;

  /**
   * Named token or arbitrary CSS color for the fill.
   * Accepts: green | red | amber | blue | purple | cyan, or any CSS expression.
   * Default: blue.
   */
  @property({ type: String, reflect: true }) color: string | undefined = undefined;

  /** Plain-text label. Rich slot="label" content wins if both are supplied. */
  @property({ type: String }) label = "";

  /** Plain-text meta suffix (e.g. "9 agents", "+12%"). Slot wins if both supplied. */
  @property({ type: String }) meta = "";

  /**
   * Where to display the numeric fill value.
   * "inside" (default) — rendered inside the fill bar.
   * "outside" — rendered to the right of the track, before meta.
   * "hidden" — not rendered.
   */
  @property({ type: String, attribute: "value-display" })
  valueDisplay: ValueDisplay = "inside";

  /** Internal flag set in connectedCallback to distinguish standalone mode. */
  @state() private _standalone = false;

  override connectedCallback(): void {
    super.connectedCallback();
    const nested = this.closest("ce-bar-chart") !== null;
    this._standalone = !nested;
    if (this._standalone) {
      this.setAttribute("data-standalone", "");
    } else {
      this.removeAttribute("data-standalone");
    }
  }

  /** Compute fill percentage clamped to 0..100. */
  get #pct(): number {
    const m = this.max > 0 ? this.max : 100;
    return Math.max(0, Math.min(100, (this.value / m) * 100));
  }

  /** Resolved CSS fill color. */
  get #fillColor(): string {
    return resolveColor(this.color);
  }

  override render() {
    if (!this._standalone) {
      // When nested inside ce-bar-chart the parent reads our attributes and
      // slot content via DOM APIs. We render nothing visible.
      return nothing;
    }

    const pct = this.#pct;
    const fillColor = this.#fillColor;
    const valueText = formatNumber(this.value);

    // Determine aria-label: prefer label slot text, then label attr, then value
    const labelEl = this.querySelector<HTMLElement>("[slot='label']");
    const ariaLabel =
      labelEl?.textContent?.trim() || this.label || `${valueText}`;

    // Does the label slot have real content?
    const hasLabelSlot = labelEl !== null;
    const hasMeta = this.meta || this.querySelector("[slot='meta']");

    return html`
      <div class="ce-sr-wrap">
        <span class="ce-sr-label" aria-hidden="${hasLabelSlot ? "false" : "true"}">
          ${hasLabelSlot
            ? html`<slot name="label"></slot>`
            : this.label
              ? html`<span>${this.label}</span>`
              : nothing}
        </span>
        <div
          class="ce-sr-track"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax=${this.max}
          aria-valuenow=${this.value}
          aria-label=${ariaLabel}
        >
          <div
            class="ce-sr-fill"
            style="width:${pct}%;background:${fillColor}"
          >
            ${this.valueDisplay === "inside" ? valueText : nothing}
          </div>
        </div>
        ${this.valueDisplay === "outside"
          ? html`<span class="ce-sr-value-outside">${valueText}</span>`
          : nothing}
        ${hasMeta
          ? html`<span class="ce-sr-meta"><slot name="meta">${this.meta}</slot></span>`
          : nothing}
      </div>
    `;
  }
}
