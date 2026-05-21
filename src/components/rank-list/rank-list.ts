import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

export interface RankItem {
  /** Display label. */
  label: string;
  /** Optional secondary descriptor. */
  hint?: string;
  /** Optional numeric score; rendered right-aligned. */
  score?: number | string;
  /** Optional movement vs previous period: + = up, - = down, "=" = unchanged. */
  delta?: number | string;
}

/**
 * `<ce-rank-list>` — ranked list with positions, optional score column, and
 * optional movement deltas.
 *
 * Accepts a JSON `items` array or slotted `<li>` children (CDR-005). The
 * positional rank (#1, #2, …) is computed from list order so authors don't
 * have to renumber on reorder. The top three items get medal accent colors
 * by default (gold / silver / bronze); turn off with `flat`.
 *
 * Attributes:
 *   items   — JSON array of { label, hint?, score?, delta? }
 *   start   — first rank number (default 1)
 *   flat    — disable the top-3 medal accents
 *
 * Slots:
 *   (default) — `<li>` children for the slot-mode authoring path
 */
export class CeRankList extends CecElement {
  static override styles = css`
    :host {
      display: block;
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
    }
    ol {
      list-style: none;
      counter-reset: rank var(--ce-rank-start, 0);
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--ce-space-1);
    }
    li {
      counter-increment: rank;
      display: grid;
      grid-template-columns: auto 1fr auto auto;
      align-items: center;
      gap: var(--ce-space-3);
      padding: var(--ce-inset-md) var(--ce-space-3);
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-sm);
      transition: border-color var(--ce-transition);
    }
    li:hover { border-color: var(--ce-border-strong); }
    .rank {
      width: var(--ce-sz-md);
      height: var(--ce-sz-md);
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--ce-surface-3);
      color: var(--ce-text);
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      font-size: var(--ce-text-xs);
      flex: 0 0 auto;
    }
    li:nth-child(1) .rank,
    li[data-medal="gold"] .rank   { background: var(--ce-color-amber); color: var(--ce-text-inverse); }
    li:nth-child(2) .rank,
    li[data-medal="silver"] .rank { background: var(--ce-border-strong); color: var(--ce-text-inverse); }
    li:nth-child(3) .rank,
    li[data-medal="bronze"] .rank { background: var(--ce-color-red); color: var(--ce-text-inverse); }
    :host([flat]) .rank,
    :host([flat]) li:nth-child(1) .rank,
    :host([flat]) li:nth-child(2) .rank,
    :host([flat]) li:nth-child(3) .rank {
      background: var(--ce-surface-3);
      color: var(--ce-text);
    }

    .body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .label {
      font-weight: 600;
      color: var(--ce-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .hint {
      color: var(--ce-muted);
      font-size: var(--ce-text-xs);
    }

    .score {
      font-variant-numeric: tabular-nums;
      color: var(--ce-text);
      font-weight: 700;
    }
    .delta {
      font-variant-numeric: tabular-nums;
      font-size: var(--ce-text-xs);
      padding: var(--ce-inset-xs) var(--ce-space-2);
      border-radius: var(--ce-radius-pill);
      background: var(--ce-surface-2);
      color: var(--ce-muted);
    }
    .delta[data-dir="up"]    { color: var(--ce-color-green); background: var(--ce-color-green-bg); }
    .delta[data-dir="down"]  { color: var(--ce-color-red);   background: var(--ce-color-red-bg); }
    .delta[data-dir="even"]  { color: var(--ce-muted);       background: var(--ce-surface-2); }

    ::slotted(li) {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: var(--ce-space-3);
      padding: var(--ce-inset-md) var(--ce-space-3);
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-sm);
      list-style: none;
    }
    ::slotted(li)::before {
      content: "#" counter(rank);
      counter-increment: rank;
      font-weight: 700;
      color: var(--ce-text);
      font-variant-numeric: tabular-nums;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property(jsonProp<RankItem[]>([], "items"))
  items: RankItem[] = [];

  @property({ type: Number }) start = 1;
  @property({ type: Boolean, reflect: true }) flat = false;

  #deltaDir(d?: number | string): "up" | "down" | "even" {
    if (d === undefined || d === null || d === "") return "even";
    if (typeof d === "number") {
      if (d > 0) return "up";
      if (d < 0) return "down";
      return "even";
    }
    const s = String(d).trim();
    if (s === "=" || s === "0") return "even";
    if (s.startsWith("+")) return "up";
    if (s.startsWith("-") || s.startsWith("−")) return "down";
    const n = Number(s);
    if (Number.isFinite(n)) {
      if (n > 0) return "up";
      if (n < 0) return "down";
    }
    return "even";
  }

  #formatDelta(d?: number | string): string {
    if (d === undefined || d === null || d === "") return "";
    if (typeof d === "number") {
      if (d > 0) return `▲ ${d}`;
      if (d < 0) return `▼ ${Math.abs(d)}`;
      return "—";
    }
    const dir = this.#deltaDir(d);
    if (dir === "even") return "—";
    const num = String(d).replace(/^[+\-−]/, "");
    return dir === "up" ? `▲ ${num}` : `▼ ${num}`;
  }

  override render() {
    const start = Number.isFinite(this.start) ? Math.floor(this.start) : 1;
    const offsetStyle = `--ce-rank-start: ${start - 1}`;
    if (this.items.length === 0) {
      return html`<ol style=${offsetStyle}>
        <slot></slot>
      </ol>`;
    }
    return html`<ol style=${offsetStyle}>
      ${this.items.map((it, i) => {
        const rank = start + i;
        const dir = this.#deltaDir(it.delta);
        const deltaText = this.#formatDelta(it.delta);
        return html`<li>
          <span class="rank" aria-label=${`Rank ${rank}`}>#${rank}</span>
          <span class="body">
            <span class="label">${it.label}</span>
            ${it.hint ? html`<span class="hint">${it.hint}</span>` : nothing}
          </span>
          ${it.score !== undefined && it.score !== ""
            ? html`<span class="score">${it.score}</span>`
            : html`<span></span>`}
          ${deltaText
            ? html`<span class="delta" data-dir=${dir}>${deltaText}</span>`
            : html`<span></span>`}
        </li>`;
      })}
    </ol>`;
  }
}
