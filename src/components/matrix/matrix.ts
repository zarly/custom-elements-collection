import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

export interface MatrixItem {
  /** Display label. */
  label: string;
  /** Quadrant index 0..3 mapping to top-left, top-right, bottom-left, bottom-right. */
  quadrant: 0 | 1 | 2 | 3;
  /** Optional secondary label / detail. */
  hint?: string;
}

/**
 * `<ce-matrix>` — 2×2 quadrant chart (priority / Eisenhower / impact-effort).
 *
 * Renders a 2×2 grid with configurable axis labels, quadrant captions, and
 * items placed into one of the four quadrants. Accepts JSON `items` or
 * slotted children with a `data-quadrant="0..3"` attribute (CDR-005).
 *
 * Attributes:
 *   items         — JSON array of { label, quadrant: 0|1|2|3, hint? }
 *   x-label       — bottom axis label (default "Effort")
 *   y-label       — left axis label (default "Impact")
 *   x-low         — left x marker (default "Low")
 *   x-high        — right x marker (default "High")
 *   y-low         — bottom y marker (default "Low")
 *   y-high        — top y marker (default "High")
 *   q-labels      — JSON array of 4 strings labelling the quadrants
 *                   (default ["Quick wins","Big bets","Fill-ins","Money pits"])
 *
 * Quadrant order is reading-order: 0=TL, 1=TR, 2=BL, 3=BR.
 */
export class CeMatrix extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-4);
      color: var(--ce-text);
    }

    .frame {
      display: grid;
      grid-template-columns: auto 1fr;
      grid-template-rows: 1fr auto;
      gap: var(--ce-space-2);
    }
    .y-axis {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      text-align: center;
      color: var(--ce-muted);
      font-size: var(--ce-text-xs);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 700;
      padding: var(--ce-space-3) 0;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: var(--ce-space-2);
      min-height: 320px;
    }
    .x-axis {
      grid-column: 2;
      text-align: center;
      color: var(--ce-muted);
      font-size: var(--ce-text-xs);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 700;
      padding-top: var(--ce-space-2);
    }
    .quadrant {
      background: var(--ce-surface-2);
      border: 1px solid var(--ce-border-soft);
      border-radius: var(--ce-radius-sm);
      padding: var(--ce-space-3);
      display: flex;
      flex-direction: column;
      gap: var(--ce-space-2);
      position: relative;
      min-height: 0;
    }
    .quadrant[data-q="0"] { background: var(--ce-color-green-bg); border-color: var(--ce-color-green-border); }
    .quadrant[data-q="1"] { background: var(--ce-color-blue-bg);  border-color: var(--ce-color-blue-border); }
    .quadrant[data-q="2"] { background: var(--ce-color-amber-bg); border-color: var(--ce-color-amber-border); }
    .quadrant[data-q="3"] { background: var(--ce-color-red-bg);   border-color: var(--ce-color-red-border); }

    .q-head {
      font-weight: 700;
      font-size: var(--ce-text-sm);
      color: var(--ce-text);
      display: flex;
      align-items: center;
      gap: var(--ce-space-2);
    }
    .q-axis-hint {
      margin-left: auto;
      color: var(--ce-muted);
      font-size: var(--ce-text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--ce-space-1);
      flex: 1 1 auto;
      min-height: 0;
    }
    li {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: var(--ce-inset-md) var(--ce-space-2);
      background: var(--ce-surface);
      border: 1px solid var(--ce-border-soft);
      border-radius: var(--ce-radius-sm);
      font-size: var(--ce-text-sm);
      color: var(--ce-text);
    }
    li .hint {
      color: var(--ce-muted);
      font-size: var(--ce-text-xs);
    }
    ::slotted([data-quadrant]) {
      /* User-placed items: hide the originals (we move them into the matching quadrant via the slot map). */
      display: none;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property(jsonProp<MatrixItem[]>([], "items"))
  items: MatrixItem[] = [];

  @property({ attribute: "x-label", type: String }) xLabel = "Effort";
  @property({ attribute: "y-label", type: String }) yLabel = "Impact";
  @property({ attribute: "x-low", type: String }) xLow = "Low";
  @property({ attribute: "x-high", type: String }) xHigh = "High";
  @property({ attribute: "y-low", type: String }) yLow = "Low";
  @property({ attribute: "y-high", type: String }) yHigh = "High";

  @property(jsonProp<string[]>(["Quick wins", "Big bets", "Fill-ins", "Money pits"], "q-labels"))
  qLabels: string[] = ["Quick wins", "Big bets", "Fill-ins", "Money pits"];

  override connectedCallback(): void {
    super.connectedCallback();
    this.#routeChildren();
  }

  #routeChildren = (): void => {
    for (const ch of Array.from(this.children)) {
      const v = ch.getAttribute("data-quadrant");
      if (v === null) continue;
      const q = Number(v);
      if (Number.isFinite(q) && q >= 0 && q <= 3) {
        ch.setAttribute("slot", `q${q}`);
      }
    }
  };

  #renderJsonItemsFor(q: number) {
    const list = this.items.filter((it) => Number(it.quadrant) === q);
    if (!list.length) return nothing;
    return html`<ul>
      ${list.map(
        (it) => html`<li>
          <span>${it.label}</span>
          ${it.hint ? html`<span class="hint">${it.hint}</span>` : nothing}
        </li>`,
      )}
    </ul>`;
  }

  #axisHint(q: number): string {
    // Show "high impact / low effort" style hint per quadrant.
    switch (q) {
      case 0:
        return `${this.yHigh} ${this.yLabel.toLowerCase()} · ${this.xLow} ${this.xLabel.toLowerCase()}`;
      case 1:
        return `${this.yHigh} ${this.yLabel.toLowerCase()} · ${this.xHigh} ${this.xLabel.toLowerCase()}`;
      case 2:
        return `${this.yLow} ${this.yLabel.toLowerCase()} · ${this.xLow} ${this.xLabel.toLowerCase()}`;
      case 3:
        return `${this.yLow} ${this.yLabel.toLowerCase()} · ${this.xHigh} ${this.xLabel.toLowerCase()}`;
      default:
        return "";
    }
  }

  override render() {
    const cells = [0, 1, 2, 3].map((q) => {
      const label = this.qLabels[q] ?? "";
      return html`<div class="quadrant" data-q=${q}>
        <header class="q-head">
          <span>${label}</span>
          <span class="q-axis-hint" aria-hidden="true">${this.#axisHint(q)}</span>
        </header>
        ${this.items.length
          ? this.#renderJsonItemsFor(q)
          : html`<ul>
              <slot name=${`q${q}`} @slotchange=${this.#routeChildren}></slot>
            </ul>`}
      </div>`;
    });
    return html`
      <div class="frame" role="figure" aria-label="2x2 matrix">
        <div class="y-axis">${this.yHigh} ← ${this.yLabel} → ${this.yLow}</div>
        <div class="grid">${cells}</div>
        <div class="x-axis">${this.xLow} ← ${this.xLabel} → ${this.xHigh}</div>
      </div>
    `;
  }
}
