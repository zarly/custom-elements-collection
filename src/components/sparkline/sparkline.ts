import { html, css, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, type CecColor, jsonProp } from "../../core/index.js";

/**
 * `<ce-sparkline>` — inline mini-chart (line / area / bar) drawn as inline SVG.
 *
 * Three input shapes (CDR-2 / CDR-5). Resolution order:
 *   1. `values` attribute / JS property (when non-empty) — wins.
 *   2. `<ce-data>` child with JSON payload — parses `.values` (or accepts a
 *      bare numeric array). Useful when the payload is too big or
 *      escaping-heavy for an attribute, or carries auxiliary fields.
 *   3. Text-content child — whitespace- or comma-separated numbers in the
 *      element's own text content (e.g. `<ce-sparkline>1 2 3</ce-sparkline>`).
 *
 * Attributes:
 *   values  — JSON array of numbers. Optional when text-content data is provided.
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

  @state() private _childValues: number[] = [];
  #mo: MutationObserver | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this._childValues = this.#parseChildValues();
    this.#mo = new MutationObserver(() => {
      const next = this.#parseChildValues();
      if (next.length !== this._childValues.length ||
          next.some((n, i) => n !== this._childValues[i])) {
        this._childValues = next;
      }
    });
    this.#mo.observe(this, { childList: true, characterData: true, subtree: true });
  }

  override disconnectedCallback(): void {
    this.#mo?.disconnect();
    this.#mo = null;
    super.disconnectedCallback();
  }

  #parseChildValues(): number[] {
    // Priority 1: a <ce-data> child carrying JSON payload.
    const dataEl = this.querySelector(":scope > ce-data");
    if (dataEl) {
      const text = (dataEl.textContent ?? "").trim();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          const arr = Array.isArray(parsed)
            ? parsed
            : Array.isArray((parsed as { values?: unknown })?.values)
              ? (parsed as { values: unknown[] }).values
              : null;
          if (arr) {
            return arr.map((n) => Number(n)).filter((n) => Number.isFinite(n));
          }
        } catch {
          // Fall through to text-content parsing.
        }
      }
    }
    // Priority 2: whitespace/comma-separated numbers in the host's own text.
    // Skip any text that belongs to a <ce-data> child (handled above) by
    // looking at direct text nodes only.
    const parts: string[] = [];
    for (const node of this.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        parts.push((node.nodeValue ?? "").trim());
      }
    }
    const text = parts.join(" ").trim();
    if (!text) return [];
    return text
      .split(/[\s,]+/)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n));
  }

  override render() {
    const fromAttr = Array.isArray(this.values) ? this.values : [];
    const v = fromAttr.length > 0 ? fromAttr : this._childValues;
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
