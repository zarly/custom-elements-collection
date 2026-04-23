import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, jsonProp, type CecColor } from "../core/index.js";

export interface BarRow {
  label: string;
  value: number;
  /** Optional right-aligned meta label (e.g. "$8.2B"). */
  meta?: string;
  /** Optional per-row color override. */
  color?: CecColor;
}

/**
 * `<ce-bar-chart>` — horizontal bar chart. Data-driven via the `data` property
 * (array of BarRow). For one-off static use, declare `<ce-bar-row>` children.
 *
 * Attributes:
 *   max      — forces chart max; if unset, auto-scales to the largest value
 *   color    — default bar color token ("blue" default)
 *   label-width — CSS width for the label column (default 180px)
 *   compact  — tighter rows
 */
export class CeBarChart extends CecElement {
  static override styles = css`
    :host { display: block; }
    .ce-bar-row {
      display: grid;
      grid-template-columns: var(--ce-bar-label-width, 180px) 1fr auto;
      align-items: center;
      gap: var(--ce-space-3);
      margin-bottom: var(--ce-space-2);
    }
    :host([compact]) .ce-bar-row { margin-bottom: 2px; }
    .ce-bar-label {
      text-align: right;
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ce-bar-track {
      height: 18px;
      background: var(--ce-surface-2);
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }
    :host([compact]) .ce-bar-track { height: 12px; }
    .ce-bar-fill {
      height: 100%;
      border-radius: 4px;
      background: var(--ce-color-blue);
      display: flex;
      align-items: center;
      padding: 0 var(--ce-space-2);
      color: var(--ce-text);
      font-size: var(--ce-text-xs);
      font-weight: 600;
      white-space: nowrap;
      transition: width var(--ce-transition);
    }
    .ce-bar-fill.c-green  { background: var(--ce-color-green);  }
    .ce-bar-fill.c-red    { background: var(--ce-color-red);    }
    .ce-bar-fill.c-amber  { background: var(--ce-color-amber);  }
    .ce-bar-fill.c-blue   { background: var(--ce-color-blue);   }
    .ce-bar-fill.c-purple { background: var(--ce-color-purple); }
    .ce-bar-fill.c-cyan   { background: var(--ce-color-cyan);   }
    .ce-bar-meta {
      color: var(--ce-muted);
      font-size: var(--ce-text-xs);
      font-variant-numeric: tabular-nums;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property(jsonProp<BarRow[]>([])) data: BarRow[] = [];
  @property({ type: Number }) max = 0;
  @property({ type: String, reflect: true }) color: CecColor = "blue";
  @property({ type: String, attribute: "label-width" }) labelWidth = "180px";
  @property({ type: Boolean, reflect: true }) compact = false;

  override updated(): void {
    this.style.setProperty("--ce-bar-label-width", this.labelWidth);
  }

  get #effectiveMax(): number {
    if (this.max > 0) return this.max;
    let m = 0;
    for (const row of this.data) if (row.value > m) m = row.value;
    return m || 1;
  }

  override render() {
    const max = this.#effectiveMax;
    return html`
      ${this.data.map((row) => {
        const pct = Math.max(0, Math.min(100, (row.value / max) * 100));
        const c = row.color ?? this.color;
        return html`
          <div class="ce-bar-row">
            <span class="ce-bar-label" title=${row.label}>${row.label}</span>
            <div
              class="ce-bar-track"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax=${max}
              aria-valuenow=${row.value}
              aria-label=${row.label}
            >
              <div
                class="ce-bar-fill c-${c}"
                style="width:${pct}%"
              ></div>
            </div>
            <span class="ce-bar-meta">${row.meta ?? ""}</span>
          </div>
        `;
      })}
    `;
  }
}
