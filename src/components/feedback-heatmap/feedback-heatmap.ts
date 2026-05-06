import { html, css, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-feedback-heatmap>` — small distribution visualisation for an aggregated
 * feedback `SubjectState` produced by <ce-feedback-sink>.
 *
 * Renders a horizontal bar of cells per item, color-coded by verdict:
 *   - thumbs="up"     → green
 *   - thumbs="down"   → red
 *   - bookmarked      → blue
 *   - dismissed       → amber
 *   - has comment     → purple
 *   - no signal       → muted
 *
 * Attributes:
 *   subject  — subject id (default: nearest <ce-feedback-sink>'s subject)
 *   max      — clamp the visible cell count (default 60)
 *   cell     — cell width in CSS px (default 12)
 *   gap      — cell gap in CSS px (default 2)
 *
 * The component subscribes to ce-feedback-state events from any ancestor
 * sink and re-renders.
 */
type Verdict = "up" | "down" | "bookmarked" | "dismissed" | "comment" | "none";

interface ItemState {
  thumbs?: "up" | "down" | null;
  bookmarked?: boolean;
  dismissed?: boolean;
  comment?: string;
  stars?: number;
  label?: string;
}

const VERDICT_COLOR: Record<Verdict, string> = {
  up: "var(--ce-color-green)",
  down: "var(--ce-color-red)",
  bookmarked: "var(--ce-color-blue)",
  dismissed: "var(--ce-color-amber)",
  comment: "var(--ce-color-purple)",
  none: "var(--ce-surface-3)",
};

export class CeFeedbackHeatmap extends CecElement {
  static override styles = css`
    :host {
      display: inline-block;
      vertical-align: middle;
      line-height: 0;
    }
    svg { display: block; overflow: visible; }
    .legend {
      display: flex;
      gap: var(--ce-space-3);
      flex-wrap: wrap;
      margin-top: var(--ce-space-2);
      font-family: var(--ce-font-sans);
      line-height: 1.2;
    }
    .legend span {
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-1);
      font-size: var(--ce-text-xs);
      color: var(--ce-muted);
    }
    .swatch {
      width: 10px;
      height: 10px;
      border-radius: 2px;
      display: inline-block;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) subject = "";
  @property({ type: Number }) max = 60;
  @property({ type: Number }) cell = 12;
  @property({ type: Number }) gap = 2;
  @property({ type: Boolean, attribute: "show-legend" })
  showLegend = false;

  @state() private _state: Record<string, ItemState> = {};

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("ce-feedback-state", this.#onState as EventListener);
    this.#hydrateFromSink();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("ce-feedback-state", this.#onState as EventListener);
  }

  #onState = (e: Event): void => {
    const detail = (e as CustomEvent).detail as { state?: Record<string, ItemState>; subject?: string };
    if (this.subject && detail?.subject && detail.subject !== this.subject) return;
    if (detail?.state) this._state = { ...detail.state };
  };

  #hydrateFromSink(): void {
    // Walk up to find a ce-feedback-sink and call its getState() if available.
    let node: Node | null = this.parentNode;
    while (node) {
      if ((node as HTMLElement).tagName === "CE-FEEDBACK-SINK") {
        const sink = node as HTMLElement & { getState?: () => Record<string, ItemState> };
        if (typeof sink.getState === "function") {
          try {
            this._state = sink.getState() || {};
          } catch {
            // ignore
          }
        }
        return;
      }
      node = (node as HTMLElement).parentNode;
    }
  }

  #verdict(item: ItemState): Verdict {
    if (item.thumbs === "up") return "up";
    if (item.thumbs === "down") return "down";
    if (item.bookmarked) return "bookmarked";
    if (item.dismissed) return "dismissed";
    if (item.comment) return "comment";
    return "none";
  }

  override render() {
    const entries = Object.entries(this._state).slice(0, this.max);
    const w = entries.length * (this.cell + this.gap);
    const h = this.cell + 4;
    const aria = `Feedback distribution: ${entries.length} item(s)`;

    return html`
      <svg
        width=${w}
        height=${h}
        viewBox=${`0 0 ${w || 1} ${h}`}
        role="img"
        aria-label=${aria}
      >
        ${entries.map(([id, item], i) => {
          const v = this.#verdict(item);
          return svg`<rect
            x=${i * (this.cell + this.gap)}
            y="0"
            width=${this.cell}
            height=${this.cell}
            rx="2"
            fill=${VERDICT_COLOR[v]}
          ><title>${id}: ${v}</title></rect>`;
        })}
      </svg>
      ${this.showLegend
        ? html`<div class="legend">
            ${(["up", "down", "bookmarked", "dismissed", "comment", "none"] as Verdict[]).map(
              (v) => html`
                <span>
                  <span class="swatch" style="background:${VERDICT_COLOR[v]}"></span>
                  ${v}
                </span>
              `
            )}
          </div>`
        : ""}
    `;
  }
}
