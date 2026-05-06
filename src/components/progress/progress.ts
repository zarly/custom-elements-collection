import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, type CecColor } from "../../core/index.js";

/**
 * `<ce-progress>` — linear progress bar.
 *
 * Attributes:
 *   value   — number in [0, max], default 0
 *   max     — denominator, default 100
 *   color   — fill color token (default "blue")
 *   label   — optional inline label
 *   show-value — boolean; overlays "N%" text on the bar
 *   indeterminate — boolean; shows an animated shimmer
 */
export class CeProgress extends CecElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
    }
    .ce-progress__row {
      display: flex;
      align-items: center;
      gap: var(--ce-space-2);
    }
    .ce-progress__label {
      flex: 0 0 auto;
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
    }
    .ce-progress__track {
      flex: 1;
      height: 8px;
      background: var(--ce-surface-2);
      border-radius: var(--ce-radius-pill);
      overflow: hidden;
      position: relative;
    }
    .ce-progress__fill {
      height: 100%;
      background: var(--ce-color-blue);
      border-radius: var(--ce-radius-pill);
      transition: width var(--ce-transition);
    }
    :host([color="green"])  .ce-progress__fill { background: var(--ce-color-green);  }
    :host([color="red"])    .ce-progress__fill { background: var(--ce-color-red);    }
    :host([color="amber"])  .ce-progress__fill { background: var(--ce-color-amber);  }
    :host([color="purple"]) .ce-progress__fill { background: var(--ce-color-purple); }
    :host([color="cyan"])   .ce-progress__fill { background: var(--ce-color-cyan);   }

    :host([indeterminate]) .ce-progress__fill {
      width: 30% !important;
      animation: ce-progress-shimmer 1.4s infinite ease-in-out;
    }
    @keyframes ce-progress-shimmer {
      0%   { transform: translateX(-100%); }
      50%  { transform: translateX(150%); }
      100% { transform: translateX(400%); }
    }

    .ce-progress__value {
      flex: 0 0 auto;
      color: var(--ce-muted);
      font-size: var(--ce-text-xs);
      font-variant-numeric: tabular-nums;
      min-width: 38px;
      text-align: right;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: Number }) value = 0;
  @property({ type: Number }) max = 100;
  @property({ type: String, reflect: true }) color: CecColor = "blue";
  @property({ type: String }) label = "";
  @property({ type: Boolean, attribute: "show-value" }) showValue = false;
  @property({ type: Boolean, reflect: true }) indeterminate = false;

  get #percent(): number {
    if (this.indeterminate) return 30;
    if (!this.max) return 0;
    const raw = (this.value / this.max) * 100;
    if (Number.isNaN(raw)) return 0;
    return Math.max(0, Math.min(100, raw));
  }

  override render() {
    const pct = this.#percent;
    return html`
      <div
        class="ce-progress__row"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax=${this.max}
        aria-valuenow=${this.indeterminate ? "" : this.value}
        aria-busy=${this.indeterminate}
      >
        ${this.label ? html`<span class="ce-progress__label">${this.label}</span>` : ""}
        <div class="ce-progress__track">
          <div class="ce-progress__fill" style="width:${pct}%"></div>
        </div>
        ${this.showValue
          ? html`<span class="ce-progress__value">${Math.round(pct)}%</span>`
          : ""}
      </div>
    `;
  }
}
