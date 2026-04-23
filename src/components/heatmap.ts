import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, jsonProp } from "../core/index.js";

/**
 * `<ce-heatmap>` — colored grid of cells.
 *
 * Provide:
 *   rows         — array of row labels
 *   cols         — array of column labels
 *   data         — 2D array (rows × cols) of numbers in [min, max]
 *   min, max     — value range; default min=0, max=auto-detected
 *   palette      — "blue" | "green" | "amber" | "red" | "purple" — color for high values
 *
 * Each cell shows its raw value and gets a background of the palette color
 * with alpha scaled by the normalized value.
 */
export class CeHeatmap extends CecElement {
  static override styles = css`
    :host { display: block; overflow: auto; }
    table { border-collapse: collapse; font-size: var(--ce-text-sm); width: 100%; }
    th, td {
      padding: 6px 8px;
      text-align: center;
      border: 1px solid var(--ce-border-soft);
      font-variant-numeric: tabular-nums;
    }
    th {
      color: var(--ce-muted);
      font-weight: 600;
      background: var(--ce-surface-2);
      font-size: var(--ce-text-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    th.ce-heatmap__row-label { text-align: right; }
    td {
      color: var(--ce-text);
      font-weight: 600;
      transition: background var(--ce-transition-fast);
    }
    td:hover { outline: 2px solid var(--ce-color-blue); position: relative; }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property(jsonProp<string[]>([])) rows: string[] = [];
  @property(jsonProp<string[]>([])) cols: string[] = [];
  @property(jsonProp<number[][]>([])) data: number[][] = [];
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 0;
  @property({ type: String, reflect: true }) palette: "blue" | "green" | "amber" | "red" | "purple" = "blue";

  get #effectiveMax(): number {
    if (this.max > 0) return this.max;
    let m = this.min;
    for (const row of this.data) for (const v of row) if (v > m) m = v;
    return m || 1;
  }

  #colorFor(value: number): string {
    const max = this.#effectiveMax;
    const min = this.min;
    const range = Math.max(max - min, 1);
    const t = Math.max(0, Math.min(1, (value - min) / range));
    // alpha 0.05 → 0.55
    const alpha = 0.05 + t * 0.5;
    const map = {
      blue:   `63, 185, 80`,
      green:  `63, 185, 80`,
      amber:  `210, 153, 34`,
      red:    `248, 81, 73`,
      purple: `188, 140, 255`,
    } as const;
    if (this.palette === "blue") return `rgba(88, 166, 255, ${alpha})`;
    return `rgba(${map[this.palette]}, ${alpha})`;
  }

  override render() {
    return html`
      <table>
        <thead>
          <tr>
            <th></th>
            ${this.cols.map((c) => html`<th>${c}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${this.rows.map(
            (rLabel, rIdx) => html`
              <tr>
                <th class="ce-heatmap__row-label">${rLabel}</th>
                ${(this.data[rIdx] ?? []).map(
                  (v) => html`<td style="background:${this.#colorFor(v)}">${v}</td>`
                )}
              </tr>
            `
          )}
        </tbody>
      </table>
    `;
  }
}
