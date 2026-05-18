import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";
import { CeHeatCell } from "../heat-cell/heat-cell.js";

/**
 * `<ce-heatmap>` — colored grid of cells.
 *
 * Two ways to supply data (CDR-005 — resolution order):
 *   1. `data` non-empty → JSON path (current behaviour, fully preserved).
 *   2. Else iterate `<ce-heat-row>` slot children, each containing
 *      `<ce-heat-cell>` children → read label / tone / title / textContent.
 *   3. Neither → empty state.
 *
 * JSON path supports widened cell shape: each cell may be a plain `number`
 * (original API, CDR-008 additive) OR a `CellInput` object:
 *   { value?: number; tone?: 1|2|3|4|5; title?: string }
 *
 * `tone` in a CellInput overrides the palette-derived alpha; it maps to the
 * same 1-5 ramp as `<ce-heat-cell tone="…">`.
 *
 * Provide:
 *   rows    — array of row labels (JSON mode)
 *   cols    — array of column labels (JSON mode or slot mode header)
 *   data    — 2D array (rows × cols) of number | CellInput (JSON mode)
 *   min, max — value range; default min=0, max=auto-detected
 *   palette  — "blue" | "green" | "amber" | "red" | "purple"
 */
export interface CellInput {
  value?: number;
  tone?: 1 | 2 | 3 | 4 | 5;
  title?: string;
}

export class CeHeatmap extends CecElement {
  static override styles = css`
    :host { display: block; overflow: auto; }
    table { border-collapse: collapse; font-size: var(--ce-text-sm); width: 100%; }
    th, td {
      padding: var(--ce-inset-md) var(--ce-space-2);
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
  @property(jsonProp<(number | CellInput)[][]>([])) data: (number | CellInput)[][] = [];
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 0;
  @property({ type: String, reflect: true }) palette: "blue" | "green" | "amber" | "red" | "purple" = "blue";

  /** Slot-derived rows updated by MutationObserver. */
  @state() private _slotRows: Array<{
    label: string;
    cells: Array<{ value: number; tone?: number; title?: string; text: string }>;
  }> = [];

  #childObserver: MutationObserver | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.#childObserver = new MutationObserver(() => {
      this._slotRows = this.#readSlotChildren();
      this.requestUpdate();
    });
    this.#childObserver.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["label", "tone", "title"],
    });
    this._slotRows = this.#readSlotChildren();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#childObserver?.disconnect();
    this.#childObserver = null;
  }

  /** Read `<ce-heat-row>` + `<ce-heat-cell>` children from light DOM. */
  #readSlotChildren() {
    const rows: Array<{
      label: string;
      cells: Array<{ value: number; tone?: number; title?: string; text: string }>;
    }> = [];
    for (const rowEl of Array.from(this.children)) {
      if (rowEl.tagName.toLowerCase() !== "ce-heat-row") continue;
      const label = rowEl.getAttribute("label") ?? "";
      const cells: Array<{ value: number; tone?: number; title?: string; text: string }> = [];
      for (const cellEl of Array.from(rowEl.children)) {
        if (cellEl.tagName.toLowerCase() !== "ce-heat-cell") continue;
        const toneAttr = cellEl.getAttribute("tone");
        const tone = toneAttr != null ? Number(toneAttr) : undefined;
        const title = cellEl.getAttribute("title") ?? undefined;
        const text = cellEl.textContent?.trim() ?? "";
        // Try to parse text as a number for palette scaling; fallback to 0.
        const value = parseFloat(text);
        cells.push({
          value: isNaN(value) ? 0 : value,
          tone: tone != null && !isNaN(tone) ? tone : undefined,
          title,
          text,
        });
      }
      rows.push({ label, cells });
    }
    return rows;
  }

  /** Extract the raw number from a cell (number or CellInput). */
  #cellValue(cell: number | CellInput): number {
    return typeof cell === "number" ? cell : (cell.value ?? 0);
  }

  get #effectiveMax(): number {
    if (this.max > 0) return this.max;
    let m = this.min;
    if (this.data && this.data.length > 0) {
      for (const row of this.data) for (const cell of row) {
        const v = this.#cellValue(cell);
        if (v > m) m = v;
      }
    } else {
      for (const row of this._slotRows) for (const cell of row.cells) {
        if (cell.value > m) m = cell.value;
      }
    }
    return m || 1;
  }

  #colorFor(value: number, toneOverride?: number): string {
    if (toneOverride != null) {
      // Tone override: map 1-5 → alpha 0.05 … 0.55
      const alpha = CeHeatCell.toneToAlpha(toneOverride);
      return this.#paletteRgba(alpha);
    }
    const max = this.#effectiveMax;
    const min = this.min;
    const range = Math.max(max - min, 1);
    const t = Math.max(0, Math.min(1, (value - min) / range));
    const alpha = 0.05 + t * 0.5;
    return this.#paletteRgba(alpha);
  }

  #paletteRgba(alpha: number): string {
    const map = {
      blue:   `88, 166, 255`,
      green:  `63, 185, 80`,
      amber:  `210, 153, 34`,
      red:    `248, 81, 73`,
      purple: `188, 140, 255`,
    } as const;
    return `rgba(${map[this.palette]}, ${alpha})`;
  }

  override render() {
    // Resolution order per CDR-005:
    // 1. data non-empty → JSON mode
    // 2. slot children present → slot mode
    // 3. empty state
    const useJson = this.data && this.data.length > 0;
    const useSlot = !useJson && this._slotRows.length > 0;

    if (!useJson && !useSlot) {
      return html`<table><thead><tr><th></th>${
        this.cols.map((c) => html`<th>${c}</th>`)
      }</tr></thead><tbody></tbody></table>`;
    }

    if (useJson) {
      return this.#renderJsonMode();
    }
    return this.#renderSlotMode();
  }

  #renderJsonMode() {
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
                ${(this.data[rIdx] ?? []).map((cell) => {
                  const v = this.#cellValue(cell);
                  const toneOverride =
                    typeof cell === "object" && cell !== null ? cell.tone : undefined;
                  const titleStr =
                    typeof cell === "object" && cell !== null
                      ? (cell.title ?? "")
                      : "";
                  const bg = this.#colorFor(v, toneOverride);
                  return html`<td
                    style="background:${bg}"
                    title=${titleStr || ""}
                  >${v}</td>`;
                })}
              </tr>
            `
          )}
        </tbody>
      </table>
    `;
  }

  #renderSlotMode() {
    // Derive col headers from cols[] or from the length of the first row's cells.
    const colHeaders = this.cols.length > 0
      ? this.cols
      : this._slotRows[0]?.cells.map((_, i) => String(i + 1)) ?? [];

    return html`
      <table>
        <thead>
          <tr>
            <th></th>
            ${colHeaders.map((c) => html`<th>${c}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${this._slotRows.map((row) => html`
            <tr>
              <th class="ce-heatmap__row-label">${row.label}</th>
              ${row.cells.map((cell) => {
                const bg = this.#colorFor(cell.value, cell.tone);
                return html`<td
                  style="background:${bg}"
                  title=${cell.title ?? ""}
                >${cell.text}</td>`;
              })}
            </tr>
          `)}
        </tbody>
      </table>
    `;
  }
}
