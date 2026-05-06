import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type CeSummarySection =
  | "counts"
  | "avg"
  | "top-liked"
  | "top-disliked"
  | "distribution";

interface ItemStateLite {
  item: string;
  label?: string;
  thumbs?: "up" | "down" | null;
  stars?: number;
  bookmarked?: boolean;
  dismissed?: boolean;
  comment?: string;
  updatedAt?: number;
}

interface SinkLike extends HTMLElement {
  subject?: string;
  getState?: () => Record<string, ItemStateLite>;
}

/**
 * `<ce-feedback-summary>` — read-only aggregated stats panel.
 *
 * Walks up to the nearest <ce-feedback-sink>, listens to ce-feedback-state
 * events from it, and re-renders. Plain HTML (no internal-component
 * dependency) consuming --ce-* tokens.
 */
export class CeFeedbackSummary extends CecElement {
  static override styles = css`
    :host {
      display: block;
      color: var(--ce-text);
      font: inherit;
      margin: var(--ce-space-3) 0;
    }
    .ce-summary__sections {
      display: flex;
      gap: var(--ce-space-3);
      flex-wrap: wrap;
      align-items: flex-start;
    }
    .ce-summary__section {
      background: var(--ce-bg-elevated, var(--ce-surface-2));
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-md, var(--ce-radius-sm));
      padding: var(--ce-space-2) var(--ce-space-3);
      min-width: 120px;
    }
    .ce-summary__title {
      font-size: var(--ce-text-xs);
      color: var(--ce-text-dim, var(--ce-muted));
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: var(--ce-space-1);
    }
    .ce-summary__counts {
      display: flex;
      gap: var(--ce-space-2);
      flex-wrap: wrap;
    }
    .ce-summary__count {
      display: inline-flex;
      align-items: baseline;
      gap: 4px;
      font-variant-numeric: tabular-nums;
    }
    .ce-summary__count-num {
      font-size: var(--ce-text-lg, 18px);
      font-weight: 600;
    }
    .ce-summary__count-label {
      font-size: var(--ce-text-xs);
      color: var(--ce-text-dim, var(--ce-muted));
    }
    .ce-summary__avg {
      font-size: 22px;
      font-weight: 600;
      color: var(--ce-gold, var(--ce-color-amber));
    }
    .ce-summary__top {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .ce-summary__top-item {
      display: flex;
      gap: var(--ce-space-2);
      font-size: var(--ce-text-sm);
    }
    .ce-summary__top-item code {
      font-family: var(--ce-font-mono);
      color: var(--ce-text);
    }
    .ce-summary__dist {
      display: flex;
      gap: 6px;
      align-items: end;
      height: 36px;
    }
    .ce-summary__dist-bar {
      width: 14px;
      background: var(--ce-gold, var(--ce-color-amber));
      border-radius: 3px;
      min-height: 2px;
    }
    .ce-summary__dist-num {
      font-size: var(--ce-text-xs);
      color: var(--ce-text-dim, var(--ce-muted));
      text-align: center;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String })
  subject = "";

  @property({ type: String })
  show = "counts avg";

  @property({ type: Number, attribute: "top-n" })
  topN = 3;

  @property({ type: Boolean })
  live = true;

  @state() private _state: Record<string, ItemStateLite> = {};

  #sink: SinkLike | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.#sink = this.#findSink();
    if (this.#sink) {
      // Initial pull
      const fn = this.#sink.getState;
      if (typeof fn === "function") {
        try {
          this._state = fn.call(this.#sink) ?? {};
        } catch {
          /* ignore */
        }
      }
      if (this.live) {
        this.#sink.addEventListener(
          "ce-feedback-state",
          this.#onSinkState as EventListener
        );
      }
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.#sink) {
      this.#sink.removeEventListener(
        "ce-feedback-state",
        this.#onSinkState as EventListener
      );
    }
  }

  override willUpdate(_changed: PropertyValues<this>): void {
    // No special setup
  }

  #findSink(): SinkLike | null {
    let node: Element | null = this.parentElement;
    while (node && node.tagName !== "BODY") {
      if (node.tagName.toLowerCase() === "ce-feedback-sink") {
        return node as SinkLike;
      }
      node = node.parentElement;
    }
    return null;
  }

  #onSinkState = (e: CustomEvent<{ state: Record<string, ItemStateLite> }>): void => {
    const subj = (this.#sink?.getAttribute?.("subject") ?? "").trim();
    if (this.subject && subj && this.subject !== subj) return;
    this._state = e.detail?.state ?? {};
  };

  #sections(): CeSummarySection[] {
    return this.show
      .split(/\s+/)
      .filter(Boolean)
      .filter((s): s is CeSummarySection =>
        ["counts", "avg", "top-liked", "top-disliked", "distribution"].includes(s)
      );
  }

  override render() {
    const sections = this.#sections();
    return html`
      <div class="ce-summary__sections">
        ${sections.map((s) => this.#renderSection(s))}
      </div>
    `;
  }

  #renderSection(section: CeSummarySection): TemplateResult {
    switch (section) {
      case "counts":
        return this.#renderCounts();
      case "avg":
        return this.#renderAvg();
      case "top-liked":
        return this.#renderTop("liked");
      case "top-disliked":
        return this.#renderTop("disliked");
      case "distribution":
        return this.#renderDistribution();
    }
  }

  #items(): ItemStateLite[] {
    return Object.values(this._state ?? {});
  }

  #renderCounts(): TemplateResult {
    const items = this.#items();
    const liked = items.filter((i) => i.thumbs === "up").length;
    const disliked = items.filter((i) => i.thumbs === "down").length;
    const bookmarked = items.filter((i) => i.bookmarked).length;
    const dismissed = items.filter((i) => i.dismissed).length;
    const rated = items.filter((i) => typeof i.stars === "number" && i.stars > 0).length;
    return html`
      <div class="ce-summary__section">
        <div class="ce-summary__title">Counts</div>
        <div class="ce-summary__counts">
          <span class="ce-summary__count" title="Liked">
            <span class="ce-summary__count-num">${liked}</span>
            <span class="ce-summary__count-label">liked</span>
          </span>
          <span class="ce-summary__count" title="Disliked">
            <span class="ce-summary__count-num">${disliked}</span>
            <span class="ce-summary__count-label">disliked</span>
          </span>
          <span class="ce-summary__count" title="Bookmarked">
            <span class="ce-summary__count-num">${bookmarked}</span>
            <span class="ce-summary__count-label">bookmarked</span>
          </span>
          <span class="ce-summary__count" title="Dismissed">
            <span class="ce-summary__count-num">${dismissed}</span>
            <span class="ce-summary__count-label">dismissed</span>
          </span>
          <span class="ce-summary__count" title="Rated">
            <span class="ce-summary__count-num">${rated}</span>
            <span class="ce-summary__count-label">rated</span>
          </span>
        </div>
      </div>
    `;
  }

  #renderAvg(): TemplateResult {
    const items = this.#items().filter((i) => typeof i.stars === "number" && (i.stars as number) > 0);
    let avg = "—";
    if (items.length) {
      const sum = items.reduce((acc, i) => acc + (i.stars ?? 0), 0);
      avg = (sum / items.length).toFixed(1);
    }
    return html`
      <div class="ce-summary__section">
        <div class="ce-summary__title">Avg rating</div>
        <div class="ce-summary__avg">${avg}</div>
      </div>
    `;
  }

  #renderTop(kind: "liked" | "disliked"): TemplateResult {
    const items = this.#items();
    const filtered =
      kind === "liked"
        ? items.filter((i) => i.thumbs === "up" || (i.stars ?? 0) >= 4)
        : items.filter((i) => i.thumbs === "down" || (typeof i.stars === "number" && i.stars > 0 && i.stars <= 2));
    const score = (i: ItemStateLite): number => {
      const tBoost = i.thumbs === (kind === "liked" ? "up" : "down") ? 5 : 0;
      const s = i.stars ?? 0;
      return kind === "liked" ? tBoost + s : tBoost + (5 - s);
    };
    const sorted = [...filtered].sort((a, b) => score(b) - score(a)).slice(0, this.topN);
    const title = kind === "liked" ? `Top liked` : `Top disliked`;
    return html`
      <div class="ce-summary__section">
        <div class="ce-summary__title">${title}</div>
        <div class="ce-summary__top">
          ${sorted.length === 0
            ? html`<span class="ce-summary__count-label">—</span>`
            : sorted.map(
                (i) => html`
                  <span class="ce-summary__top-item">
                    <code>${i.item}</code>
                    ${i.label ? html`<span class="ce-summary__count-label">${i.label}</span>` : ""}
                  </span>
                `
              )}
        </div>
      </div>
    `;
  }

  #renderDistribution(): TemplateResult {
    const items = this.#items();
    const buckets = [0, 0, 0, 0, 0]; // 1..5
    for (const i of items) {
      const s = typeof i.stars === "number" ? Math.round(i.stars) : 0;
      if (s >= 1 && s <= 5) buckets[s - 1]++;
    }
    const max = Math.max(1, ...buckets);
    return html`
      <div class="ce-summary__section">
        <div class="ce-summary__title">Distribution</div>
        <div class="ce-summary__dist">
          ${buckets.map(
            (n) => html`
              <div
                class="ce-summary__dist-bar"
                style="height: ${Math.round((n / max) * 32)}px"
                title="${n} rating${n === 1 ? "" : "s"}"
              ></div>
            `
          )}
        </div>
        <div style="display:flex;gap:6px;">
          ${buckets.map(
            (_, idx) => html`<span class="ce-summary__dist-num" style="width:14px">${idx + 1}</span>`
          )}
        </div>
      </div>
    `;
  }
}
