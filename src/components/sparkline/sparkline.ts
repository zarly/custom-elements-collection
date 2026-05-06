import { html, css, svg } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, type CecColor, jsonProp } from "../../core/index.js";

/**
 * `<ce-sparkline>` — inline mini-chart (line / area / bar) drawn as inline SVG.
 *
 * Attributes:
 *   values  — JSON array of numbers. Required.
 *   color   — semantic color token. Default "blue".
 *   shape   — "line" | "area" | "bar". Default "line".
 *   width   — chart width in CSS px (default 80).
 *   height  — chart height in CSS px (default 24).
 *   stroke  — stroke width (default 1.5).
 */
export class CeSparkline extends CecElement {
  static override styles = css`
    :host {
      display: inline-block;
      vertical-align: middle;
      line-height: 0;
    }
    svg { display: block; overflow: visible; }
    .stroke { fill: none; stroke: var(--ce-color-blue); stroke-linejoin: round; stroke-linecap: round; }
    .area   { fill: var(--ce-color-blue); opacity: 0.18; }
    .bar    { fill: var(--ce-color-blue); }

    :host([color="green"])  .stroke, :host([color="green"])  .bar { stroke: var(--ce-color-green); fill: var(--ce-color-green); }
    :host([color="green"])  .area  { fill: var(--ce-color-green); }
    :host([color="red"])    .stroke, :host([color="red"])    .bar { stroke: var(--ce-color-red);   fill: var(--ce-color-red);   }
    :host([color="red"])    .area  { fill: var(--ce-color-red); }
    :host([color="amber"])  .stroke, :host([color="amber"])  .bar { stroke: var(--ce-color-amber); fill: var(--ce-color-amber); }
    :host([color="amber"])  .area  { fill: var(--ce-color-amber); }
    :host([color="purple"]) .stroke, :host([color="purple"]) .bar { stroke: var(--ce-color-purple); fill: var(--ce-color-purple); }
    :host([color="purple"]) .area  { fill: var(--ce-color-purple); }
    :host([color="cyan"])   .stroke, :host([color="cyan"])   .bar { stroke: var(--ce-color-cyan);  fill: var(--ce-color-cyan);  }
    :host([color="cyan"])   .area  { fill: var(--ce-color-cyan); }
    .stroke.fill { fill: none; }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property(jsonProp<number[]>([]))
  values: number[] = [];

  @property({ type: String, reflect: true })
  color: CecColor = "blue";

  @property({ type: String, reflect: true })
  shape: "line" | "area" | "bar" = "line";

  @property({ type: Number }) width = 80;
  @property({ type: Number }) height = 24;
  @property({ type: Number }) stroke = 1.5;

  override render() {
    const v = Array.isArray(this.values) ? this.values : [];
    if (v.length === 0) {
      return html`<svg
        width=${this.width}
        height=${this.height}
        role="img"
        aria-label="Empty sparkline"
      ></svg>`;
    }
    const w = this.width;
    const h = this.height;
    const min = Math.min(...v);
    const max = Math.max(...v);
    const range = max - min || 1;
    const x = (i: number) => (v.length === 1 ? w / 2 : (i / (v.length - 1)) * w);
    const y = (val: number) => h - ((val - min) / range) * h;

    const aria = `Sparkline of ${v.length} values from ${min} to ${max}`;

    if (this.shape === "bar") {
      const gap = 1;
      const bw = Math.max(1, w / v.length - gap);
      const bars = v.map((val, i) => {
        const bx = (i / v.length) * w;
        const by = y(val);
        const bh = Math.max(1, h - by);
        return svg`<rect class="bar" x=${bx} y=${by} width=${bw} height=${bh} />`;
      });
      return html`<svg
        width=${w}
        height=${h}
        viewBox=${`0 0 ${w} ${h}`}
        role="img"
        aria-label=${aria}
      >${bars}</svg>`;
    }

    const points = v.map((val, i) => `${x(i)},${y(val)}`).join(" ");
    if (this.shape === "area") {
      const areaD = `M0,${h} L${points.replace(/ /g, " L")} L${w},${h} Z`;
      return html`<svg
        width=${w}
        height=${h}
        viewBox=${`0 0 ${w} ${h}`}
        role="img"
        aria-label=${aria}
      >
        ${svg`<path class="area" d=${areaD} />`}
        ${svg`<polyline class="stroke" stroke-width=${this.stroke} points=${points} />`}
      </svg>`;
    }
    return html`<svg
      width=${w}
      height=${h}
      viewBox=${`0 0 ${w} ${h}`}
      role="img"
      aria-label=${aria}
    >
      ${svg`<polyline class="stroke" stroke-width=${this.stroke} points=${points} />`}
    </svg>`;
  }
}
