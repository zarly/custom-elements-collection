import { html, css, svg, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

const DEFAULT_PALETTE = [
  "var(--ce-color-blue)",
  "var(--ce-color-green)",
  "var(--ce-color-amber)",
  "var(--ce-color-purple)",
  "var(--ce-color-cyan)",
  "var(--ce-color-red)",
];

/**
 * `<ce-donut>` — donut / pie chart for a small number of segments.
 *
 * Attributes:
 *   values  — JSON array of numbers (segment sizes).
 *   colors  — JSON array of CSS color strings (cycles when shorter).
 *   labels  — JSON array of label strings (used in aria-label and legend).
 *   size    — square SVG size in CSS px (default 140).
 *   thickness — donut ring thickness (px). 0 = pie, default 18.
 *   center-label — small text rendered in the donut hole.
 *
 * Slots:
 *   center — overrides center-label with arbitrary HTML.
 *   legend — overrides the default legend with arbitrary HTML.
 *
 * Per CDR-003, legend visibility is policy, not data. The default behaviour
 * (visible when ≥ 2 segments) covers ~99 % of cases. Override document-wide
 * via the CSS custom property `--ce-donut-legend-display: auto | always |
 * none`, or per-instance via the `legend` named slot.
 */
export class CeDonut extends CecElement {
  static override styles = css`
    :host {
      display: inline-block;
      vertical-align: middle;
      line-height: 0;
    }
    .wrap {
      position: relative;
      display: inline-block;
    }
    .center {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      color: var(--ce-text);
      font-size: var(--ce-text-md);
      font-weight: 700;
      line-height: 1.2;
      text-align: center;
    }

    /* Default legend — light text rows; visible per --ce-donut-legend-display. */
    .legend {
      display: flex;
      flex-direction: column;
      gap: var(--ce-space-1);
      margin-top: var(--ce-space-3);
      font-size: var(--ce-text-sm);
      line-height: 1.4;
      color: var(--ce-text);
    }
    .legend__row {
      display: flex;
      align-items: center;
      gap: var(--ce-space-2);
    }
    .legend__dot {
      width: 0.6em;
      height: 0.6em;
      border-radius: 50%;
      flex: 0 0 auto;
    }
    .legend__label { flex: 1 1 auto; }
    .legend__pct {
      color: var(--ce-muted);
      font-variant-numeric: tabular-nums;
    }

    /* Default policy: hide when only 1 segment, show when ≥ 2. */
    :host(:not([data-multi])) .legend { display: none; }

    /* Document-wide override via CSS custom property. */
    @container style(--ce-donut-legend-display: always) {
      .legend { display: flex; }
    }
    @container style(--ce-donut-legend-display: none) {
      .legend { display: none; }
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property(jsonProp<number[]>([])) values: number[] = [];
  @property(jsonProp<string[]>([])) colors: string[] = [];
  @property(jsonProp<string[]>([])) labels: string[] = [];

  @property({ type: Number }) size = 140;
  @property({ type: Number }) thickness = 18;
  @property({ type: String, attribute: "center-label" }) centerLabel = "";

  protected override willUpdate(): void {
    const segCount = Array.isArray(this.values)
      ? this.values.filter((n) => n > 0).length
      : 0;
    if (segCount >= 2) {
      this.setAttribute("data-multi", "");
    } else {
      this.removeAttribute("data-multi");
    }
  }

  override render() {
    const v = Array.isArray(this.values) ? this.values.filter((n) => n > 0) : [];
    const total = v.reduce((a, b) => a + b, 0);
    const s = this.size;
    const r = s / 2;
    const inner = Math.max(0, r - this.thickness);
    const palette = this.colors.length ? this.colors : DEFAULT_PALETTE;
    const aria =
      v.length === 0
        ? "Empty donut chart"
        : v
            .map((val, i) => {
              const pct = total ? Math.round((val / total) * 100) : 0;
              const lbl = this.labels[i] ?? `segment ${i + 1}`;
              return `${lbl}: ${pct}%`;
            })
            .join(", ");

    const segments: ReturnType<typeof svg>[] = [];
    if (v.length === 1 && total > 0) {
      // Full circle
      segments.push(
        svg`<circle cx=${r} cy=${r} r=${r - 0.5} fill=${palette[0]} />`
      );
      if (this.thickness > 0 && inner > 0) {
        segments.push(
          svg`<circle cx=${r} cy=${r} r=${inner} fill="var(--ce-bg)" />`
        );
      }
    } else if (total > 0) {
      let acc = 0;
      v.forEach((val, i) => {
        const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
        const end = ((acc + val) / total) * Math.PI * 2 - Math.PI / 2;
        acc += val;
        const large = end - start > Math.PI ? 1 : 0;
        const x1 = r + r * Math.cos(start);
        const y1 = r + r * Math.sin(start);
        const x2 = r + r * Math.cos(end);
        const y2 = r + r * Math.sin(end);
        const fill = palette[i % palette.length];
        const d = `M ${r} ${r} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
        segments.push(svg`<path d=${d} fill=${fill} />`);
      });
      if (this.thickness > 0 && inner > 0) {
        segments.push(
          svg`<circle cx=${r} cy=${r} r=${inner} fill="var(--ce-bg)" />`
        );
      }
    }

    const legendRows = v.length === 0
      ? nothing
      : v.map((val, i) => {
          const pct = total ? Math.round((val / total) * 100) : 0;
          const lbl = this.labels[i] ?? `segment ${i + 1}`;
          const fill = palette[i % palette.length];
          return html`
            <div class="legend__row">
              <span class="legend__dot" style="background:${fill}"></span>
              <span class="legend__label">${lbl}</span>
              <span class="legend__pct">${pct}%</span>
            </div>
          `;
        });

    return html`
      <div class="wrap" style="width:${s}px;height:${s}px;">
        <svg
          width=${s}
          height=${s}
          viewBox=${`0 0 ${s} ${s}`}
          role="img"
          aria-label=${aria}
        >${segments}</svg>
        <div class="center">
          <slot name="center">${this.centerLabel}</slot>
        </div>
      </div>
      <div class="legend" part="legend" aria-hidden="true">
        <slot name="legend">${legendRows}</slot>
      </div>
    `;
  }
}
