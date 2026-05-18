import { html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-heat-cell>` — a single colored heatmap cell per CDR-002 / CDR-005.
 *
 * Tone 1-5 maps to alpha 0.05, 0.175, 0.30, 0.425, 0.55 within the
 * palette ramp. Default slot carries the cell's visible label; can be
 * any rich inline content (link, chip, etc.) per CDR-002.
 *
 * When nested inside `<ce-heat-row>` → `<ce-heatmap>` the parent reads
 * `tone` and `title` attributes and the slot text to build its internal
 * data grid; this element itself renders nothing (display:contents).
 * When used standalone it renders a minimal colored cell box.
 */
export class CeHeatCell extends CecElement {
  static override styles = css`
    :host {
      display: contents; /* invisible when nested inside ce-heat-row */
    }
    :host([data-standalone]) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2.5rem;
      min-height: 2.5rem;
      padding: var(--ce-inset-md) var(--ce-space-2);
      border: 1px solid var(--ce-border-soft);
      border-radius: var(--ce-radius-sm, 4px);
      font-size: var(--ce-text-sm);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: var(--ce-text);
      cursor: default;
      transition: outline var(--ce-transition-fast);
    }
    :host([data-standalone]:hover) {
      outline: 2px solid var(--ce-color-blue);
      position: relative;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  /** Tone 1–5 controls color intensity (1=faint, 5=vivid). Default 3. */
  @property({ type: Number, reflect: true }) tone: 1 | 2 | 3 | 4 | 5 = 3;

  /** Tooltip text shown on hover (maps to HTML title attribute on the cell). */
  @property({ type: String, reflect: true }) title = "";

  /** Whether we're rendered outside any ce-heat-row parent. */
  @state() private _standalone = false;

  override connectedCallback(): void {
    super.connectedCallback();
    const nested = this.closest("ce-heat-row") !== null;
    this._standalone = !nested;
    if (this._standalone) {
      this.setAttribute("data-standalone", "");
    } else {
      this.removeAttribute("data-standalone");
    }
  }

  /** Map tone 1-5 → alpha 0.05 … 0.55 */
  static toneToAlpha(tone: number): number {
    const clamped = Math.max(1, Math.min(5, Math.round(tone)));
    // tone 1 → 0.05, tone 5 → 0.55, step 0.125
    return 0.05 + (clamped - 1) * 0.125;
  }

  override render() {
    if (!this._standalone) {
      return nothing;
    }
    // Standalone: apply background via host style; slot carries rich content.
    const alpha = CeHeatCell.toneToAlpha(this.tone);
    const bg = `rgba(88, 166, 255, ${alpha})`;
    this.style.background = bg;
    if (this.title) this.setAttribute("title", this.title);
    return html`<slot></slot>`;
  }
}
