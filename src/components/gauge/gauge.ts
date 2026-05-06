import { html, css, svg } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, type CecColor } from "../../core/index.js";

/**
 * `<ce-gauge>` — semicircle dial / meter with optional target tick.
 *
 * Attributes:
 *   value   — current numeric value
 *   min     — lower bound (default 0)
 *   max     — upper bound (default 100)
 *   target  — optional target value rendered as a tick mark
 *   color   — semantic fill color
 *   label   — optional small label under the value
 *   size    — svg pixel size (default 140)
 */
export class CeGauge extends CecElement {
  static override styles = css`
    :host {
      display: inline-block;
      vertical-align: middle;
    }
    .wrap {
      position: relative;
      display: inline-block;
      line-height: 0;
    }
    .center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      padding-bottom: 12%;
      pointer-events: none;
      line-height: 1.1;
    }
    .value {
      font-size: var(--ce-text-xl);
      font-weight: 800;
      color: var(--ce-text);
    }
    .label {
      font-size: var(--ce-text-xs);
      color: var(--ce-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 600;
    }
    .track { stroke: var(--ce-surface-2); }
    .fill  { stroke: var(--ce-color-blue); }
    .tick  { stroke: var(--ce-text); }

    :host([color="green"])  .fill { stroke: var(--ce-color-green); }
    :host([color="red"])    .fill { stroke: var(--ce-color-red); }
    :host([color="amber"])  .fill { stroke: var(--ce-color-amber); }
    :host([color="purple"]) .fill { stroke: var(--ce-color-purple); }
    :host([color="cyan"])   .fill { stroke: var(--ce-color-cyan); }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: Number }) value = 0;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;
  @property({ type: Number }) target: number | null = null;
  @property({ type: String, reflect: true }) color: CecColor = "blue";
  @property({ type: String }) label = "";
  @property({ type: Number }) size = 140;

  #pct(): number {
    const span = this.max - this.min;
    if (!span) return 0;
    const raw = (this.value - this.min) / span;
    return Math.max(0, Math.min(1, raw));
  }

  #angle(p: number): number {
    // Sweep from -180° (left) to 0° (right) — 180° arc
    return -Math.PI + p * Math.PI;
  }

  #point(cx: number, cy: number, r: number, angle: number): [number, number] {
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  override render() {
    const s = this.size;
    const cx = s / 2;
    const cy = s * 0.62;
    const r = s * 0.42;
    const stroke = Math.max(6, s * 0.09);

    const trackD = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

    const pct = this.#pct();
    const a = this.#angle(pct);
    const [px, py] = this.#point(cx, cy, r, a);
    const sweep = pct > 0.5 ? 1 : 0; // large-arc flag for arcs > 180° (never here)
    const fillD = `M ${cx - r} ${cy} A ${r} ${r} 0 ${sweep} 1 ${px} ${py}`;

    let tick = null;
    if (this.target != null) {
      const tspan = this.max - this.min || 1;
      const tp = Math.max(0, Math.min(1, (this.target - this.min) / tspan));
      const ta = this.#angle(tp);
      const [x1, y1] = this.#point(cx, cy, r - stroke / 2 - 2, ta);
      const [x2, y2] = this.#point(cx, cy, r + stroke / 2 + 2, ta);
      tick = svg`<line class="tick" x1=${x1} y1=${y1} x2=${x2} y2=${y2} stroke-width="2" />`;
    }

    const aria = `${this.value} of ${this.max}`;

    return html`
      <div class="wrap" style="width:${s}px;height:${cy + stroke}px;">
        <svg
          width=${s}
          height=${cy + stroke}
          viewBox=${`0 0 ${s} ${cy + stroke}`}
          role="meter"
          aria-valuemin=${this.min}
          aria-valuemax=${this.max}
          aria-valuenow=${this.value}
          aria-label=${aria}
        >
          ${svg`<path class="track" d=${trackD} fill="none" stroke-width=${stroke} stroke-linecap="round" />`}
          ${pct > 0
            ? svg`<path class="fill" d=${fillD} fill="none" stroke-width=${stroke} stroke-linecap="round" />`
            : null}
          ${tick}
        </svg>
        <div class="center">
          <div class="value">${this.value}</div>
          ${this.label ? html`<div class="label">${this.label}</div>` : ""}
        </div>
      </div>
    `;
  }
}
