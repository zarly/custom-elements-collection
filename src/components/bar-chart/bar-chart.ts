import { html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";
import { resolveColor } from "../../internal/charts/color.js";
import { number as formatNumber } from "../../internal/charts/format.js";
import { gateMotion } from "../../internal/charts/easing.js";
import {
  CHART_HOVER,
  CHART_LEAVE,
  CHART_SELECT,
  type BarHoverDetail,
  type BarSelectDetail,
} from "../../internal/charts/events.js";

export interface BarRow {
  label: string;
  value: number;
  /** Optional right-aligned meta label (e.g. "$8.2B"). */
  meta?: string;
  /** Optional per-row color override — named token or arbitrary CSS color. */
  color?: string;
}

const GRID_STOPS = [0, 0.25, 0.5, 0.75, 1] as const;

/**
 * Build a BarRow[] from `<ce-bar-row>` slot-children of the given parent.
 * Non-ce-bar-row children are gracefully ignored per CDR-006.
 */
function rowsFromSlotChildren(parent: HTMLElement, fallbackColor: string): BarRow[] {
  const result: BarRow[] = [];
  for (const child of Array.from(parent.children)) {
    if (child.tagName.toLowerCase() !== "ce-bar-row") continue;
    const el = child as HTMLElement & { value?: number; color?: string };
    const value = Number(el.getAttribute("value") ?? el.value ?? 0);
    const color = el.getAttribute("color") ?? el.color ?? fallbackColor;
    // Read label slot: first element with slot="label", else text content of label slot
    const labelEl = el.querySelector<HTMLElement>("[slot='label']");
    const label = labelEl ? (labelEl.textContent?.trim() ?? "") : el.textContent?.trim() ?? "";
    // Read meta slot
    const metaEl = el.querySelector<HTMLElement>("[slot='meta']");
    const meta = metaEl ? (metaEl.textContent?.trim() ?? "") : undefined;
    result.push({
      label,
      value,
      color: color || undefined,
      meta: meta || undefined,
    });
  }
  return result;
}

/**
 * `<ce-bar-chart>` — animated horizontal bar chart.
 *
 * Two ways to provide row data (CDR-005 — resolution order):
 *   1. `data` JSON prop non-empty → current behaviour, fully preserved.
 *   2. `<ce-bar-row>` slot children → parent reads value/color as attributes
 *      and consumes label/meta slot HTML; both modes render identically.
 *   3. Neither → empty state.
 *
 * Per-row `color` accepts both named tokens and arbitrary CSS values via
 * `resolveColor()`. Non-`ce-bar-row` slot children are left in light DOM
 * and ignored by the data-resolution path (CDR-006).
 */
export class CeBarChart extends CecElement {
  static override styles = css`
    :host {
      display: block;
      --ce-bar-track-h: 18px;
      --ce-bar-radius: 4px;
      --ce-bar-fade: var(--ce-transition, 200ms cubic-bezier(0.16, 1, 0.3, 1));
      --ce-bar-hover-tint: color-mix(in srgb, var(--ce-text) 8%, transparent);
      --ce-bar-tooltip-bg: var(--ce-surface);
      --ce-bar-tooltip-fg: var(--ce-text);
      --ce-bar-tooltip-border: var(--ce-border);
      --ce-bar-grid: color-mix(in srgb, var(--ce-text) 12%, transparent);
      --ce-bar-grid-fg: var(--ce-muted);
    }
    :host([compact]) { --ce-bar-track-h: 12px; }
    :host([sparkline]) { --ce-bar-track-h: 10px; }

    .ce-rows {
      list-style: none;
      margin: 0;
      padding: 0;
      /* Shared grid so every row's label column has the same width — bars
         line up at the same x regardless of label length. */
      display: grid;
      grid-template-columns: var(--ce-bar-label-width, auto) 1fr auto;
      column-gap: var(--ce-space-3);
      row-gap: var(--ce-space-2);
    }
    :host([compact]) .ce-rows { row-gap: 2px; }
    .ce-row {
      position: relative;
      display: grid;
      grid-template-columns: subgrid;
      grid-column: 1 / -1;
      align-items: center;
      outline: none;
    }

    .ce-row:hover .ce-track,
    .ce-row:focus-visible .ce-track {
      background: var(--ce-bar-hover-tint);
    }
    .ce-row:focus-visible {
      box-shadow: 0 0 0 2px var(--ce-color-blue, #4ea3ff);
      border-radius: var(--ce-bar-radius);
    }

    .ce-label {
      text-align: right;
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ce-track {
      height: var(--ce-bar-track-h);
      background: var(--ce-surface-2);
      border-radius: var(--ce-bar-radius);
      overflow: hidden;
      position: relative;
      transition: background var(--ce-bar-fade);
    }
    .ce-fill {
      height: 100%;
      border-radius: var(--ce-bar-radius);
      background: var(--ce-color-blue);
      display: flex;
      align-items: center;
      padding: 0 var(--ce-space-2);
      color: var(--ce-text);
      font-size: var(--ce-text-xs);
      font-weight: 600;
      white-space: nowrap;
      transition: width var(--ce-bar-fade);
    }
    :host(:not([animated])) .ce-fill { transition: none; }
    :host(:not([animated])) .ce-track { transition: none; }

    .ce-meta {
      color: var(--ce-muted);
      font-size: var(--ce-text-xs);
      font-variant-numeric: tabular-nums;
    }

    .ce-tooltip {
      position: absolute;
      bottom: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%) translateY(4px);
      background: var(--ce-bar-tooltip-bg);
      color: var(--ce-bar-tooltip-fg);
      border: 1px solid var(--ce-bar-tooltip-border);
      border-radius: var(--ce-bar-radius);
      padding: var(--ce-space-1, 4px) var(--ce-space-2);
      font-size: var(--ce-text-xs);
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition:
        opacity var(--ce-bar-fade),
        transform var(--ce-bar-fade);
      z-index: 1;
      box-shadow: var(--ce-shadow, 0 2px 6px rgba(0, 0, 0, 0.15));
    }
    .ce-row:hover .ce-tooltip,
    .ce-row:focus-visible .ce-tooltip,
    .ce-row[data-active] .ce-tooltip {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    .ce-empty {
      padding: var(--ce-space-4) var(--ce-space-2);
      text-align: center;
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
    }

    /* gridlines + ticks: rendered as a separate strip after the rows so the
       layout column geometry matches the .ce-row track column. */
    .ce-grid {
      display: grid;
      grid-template-columns: var(--ce-bar-label-width, auto) 1fr auto;
      gap: var(--ce-space-3);
      margin-top: var(--ce-space-1, 4px);
    }
    .ce-grid-spacer { /* mirrors label column */ }
    .ce-grid-ticks {
      position: relative;
      height: 1.4em;
      font-size: var(--ce-text-xs);
      color: var(--ce-bar-grid-fg);
      font-variant-numeric: tabular-nums;
    }
    .ce-grid-tick {
      position: absolute;
      top: 0;
      transform: translateX(-50%);
    }
    .ce-grid-tick:first-child { transform: translateX(0); }
    .ce-grid-tick:last-child { transform: translateX(-100%); }

    /* gridlines drawn behind every track */
    :host([gridlines]) .ce-track {
      background-image: linear-gradient(
        to right,
        var(--ce-bar-grid) 1px,
        transparent 1px
      );
      background-size: 25% 100%;
      background-position: 0 0;
    }

    /* sparkline mode collapses the grid down to a single bar strip */
    :host([sparkline]) {
      display: inline-block;
      vertical-align: middle;
    }
    :host([sparkline]) .ce-rows {
      display: flex;
      gap: 2px;
      width: var(--ce-bar-spark-width, 120px);
      height: var(--ce-bar-track-h);
    }
    :host([sparkline]) .ce-row {
      display: block;
      flex: 1 1 auto;
      margin: 0;
      height: 100%;
    }
    :host([sparkline]) .ce-label,
    :host([sparkline]) .ce-meta {
      display: none;
    }
    :host([sparkline]) .ce-track {
      height: 100%;
      background: var(--ce-surface-2);
    }
    :host([sparkline]) .ce-fill {
      padding: 0;
      color: transparent;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property(jsonProp<BarRow[]>([])) data: BarRow[] = [];
  @property({ type: Number }) max = 0;

  /** Rows derived from <ce-bar-row> slot children. Updated by MutationObserver. */
  @state() private _slotRows: BarRow[] = [];

  /** MutationObserver watching direct children for ce-bar-row changes. */
  #childObserver: MutationObserver | null = null;

  @property({ type: String, reflect: true }) color = "blue";
  @property({ type: String, attribute: "label-width" }) labelWidth = "auto";
  @property({ type: Boolean, reflect: true }) compact = false;
  @property({ type: Boolean, reflect: true, attribute: "animated" }) animated = true;
  @property({ type: Boolean, attribute: "show-values" }) showValues = true;
  @property({ type: Boolean, reflect: true }) gridlines = false;
  @property({ type: Boolean, reflect: true }) sparkline = false;
  /** Number formatter for the inline value. Defaults to locale-aware integers. */
  @property({ attribute: false }) format: (v: number) => string = (v) =>
    formatNumber(v);
  @property({ type: String, attribute: "empty-text" }) emptyText = "No data";

  override connectedCallback(): void {
    super.connectedCallback();
    this.#childObserver = new MutationObserver(() => {
      this._slotRows = rowsFromSlotChildren(this, this.color);
    });
    this.#childObserver.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["value", "color"],
    });
    // Read initial children (may already be present when upgraded).
    this._slotRows = rowsFromSlotChildren(this, this.color);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#childObserver?.disconnect();
    this.#childObserver = null;
  }

  override updated(): void {
    this.style.setProperty("--ce-bar-label-width", this.labelWidth);
    // Reduced-motion gate: when the user prefers no motion, force the
    // transition off regardless of the `animated` prop.
    const fade = gateMotion(
      "var(--ce-transition, 200ms cubic-bezier(0.16, 1, 0.3, 1))",
      "0s"
    );
    this.style.setProperty("--ce-bar-fade", fade);
  }

  /** Resolved rows: data[] takes priority, else slot children, else []. */
  get #rows(): BarRow[] {
    return this.data && this.data.length > 0 ? this.data : this._slotRows;
  }

  get #effectiveMax(): number {
    if (this.max > 0) return this.max;
    let m = 0;
    for (const row of this.#rows) if (row.value > m) m = row.value;
    return m || 1;
  }

  #emit<T>(name: string, detail: T): void {
    this.dispatchEvent(
      new CustomEvent<T>(name, {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  #onEnter = (row: BarRow, index: number) => () => {
    this.#emit<BarHoverDetail<BarRow>>(CHART_HOVER, {
      kind: "row",
      row,
      index,
    });
  };

  #onLeave = () => {
    this.#emit(CHART_LEAVE, {});
  };

  #onSelect = (row: BarRow, index: number) => (e: Event) => {
    if (e instanceof KeyboardEvent) {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
    }
    this.#emit<BarSelectDetail<BarRow>>(CHART_SELECT, {
      row,
      index,
      originalEvent: e,
    });
  };

  override render() {
    const rows = this.#rows;
    if (!rows || rows.length === 0) {
      return html`<div class="ce-empty">${this.emptyText}</div>`;
    }
    const max = this.#effectiveMax;
    const showLabels = !this.sparkline;
    const showTooltip = !this.sparkline;
    return html`
      <ol class="ce-rows" role=${this.sparkline ? "img" : "list"}>
        ${rows.map((row, index) => {
          const pct = Math.max(0, Math.min(100, (row.value / max) * 100));
          const fill = resolveColor(row.color ?? this.color);
          const valueText = this.format(row.value);
          const tooltipText = row.meta
            ? `${row.label}: ${valueText} · ${row.meta}`
            : `${row.label}: ${valueText}`;
          return html`
            <li
              class="ce-row"
              tabindex="0"
              @pointerenter=${this.#onEnter(row, index)}
              @focus=${this.#onEnter(row, index)}
              @pointerleave=${this.#onLeave}
              @blur=${this.#onLeave}
              @click=${this.#onSelect(row, index)}
              @keydown=${this.#onSelect(row, index)}
            >
              ${showLabels
                ? html`<span class="ce-label" title=${row.label}>${row.label}</span>`
                : nothing}
              <div
                class="ce-track"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax=${max}
                aria-valuenow=${row.value}
                aria-label=${row.label}
              >
                <div
                  class="ce-fill"
                  style="width:${pct}%; background:${fill}"
                >
                  ${this.showValues && showLabels ? valueText : nothing}
                </div>
              </div>
              ${showLabels
                ? html`<span class="ce-meta">${row.meta ?? ""}</span>`
                : nothing}
              ${showTooltip
                ? html`<div class="ce-tooltip" role="tooltip">${tooltipText}</div>`
                : nothing}
            </li>
          `;
        })}
      </ol>
      ${this.gridlines && !this.sparkline
        ? html`
            <div class="ce-grid" aria-hidden="true">
              <span class="ce-grid-spacer"></span>
              <div class="ce-grid-ticks">
                ${GRID_STOPS.map(
                  (s) => html`
                    <span class="ce-grid-tick" style="left:${s * 100}%">
                      ${this.format(s * max)}
                    </span>
                  `
                )}
              </div>
              <span class="ce-grid-spacer"></span>
            </div>
          `
        : nothing}
    `;
  }
}
