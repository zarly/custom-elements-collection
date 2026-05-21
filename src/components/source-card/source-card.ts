import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-source-card>` — a single retrieved source card for RAG/agent surfaces.
 *
 * Renders title + hostname + optional snippet/score in a clickable card shape.
 * Sits next to `ce-citation` (inline footnote-style reference) as the panel
 * companion: where a citation lives inside prose, a source card lives in a
 * sidebar / list of "what the model retrieved".
 *
 * Attributes (all reflected when relevant):
 *   url         — link target; wraps the title in <a> when set
 *   title       — primary heading (falls back to slotted title)
 *   site        — display label for the source (host, publisher, repo)
 *   icon        — optional emoji/icon string rendered before the site label
 *   score       — relevance score 0..1 OR 0..100; rendered as a small pill
 *   index       — ordinal position ([1], [2]…) used to wire to inline citations
 *
 * Slots:
 *   title     — overrides the title attribute (rich markup ok)
 *   (default) — snippet / preview text
 *   meta      — extra inline metadata next to site (date, author…)
 *   footer    — actions, secondary controls
 */
export class CeSourceCard extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-3) var(--ce-space-4);
      transition: border-color var(--ce-transition), box-shadow var(--ce-transition),
        transform var(--ce-transition);
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
    }
    :host(:hover) {
      border-color: var(--ce-border-strong);
      box-shadow: var(--ce-shadow);
    }

    .row-top {
      display: flex;
      align-items: center;
      gap: var(--ce-space-2);
      margin-bottom: var(--ce-space-1);
      color: var(--ce-muted);
      font-size: var(--ce-text-xs);
      min-width: 0;
    }
    .icon { flex: 0 0 auto; }
    .site {
      flex: 1 1 auto;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .index {
      flex: 0 0 auto;
      font-variant-numeric: tabular-nums;
      color: var(--ce-muted);
      font-weight: 600;
    }
    .score {
      flex: 0 0 auto;
      padding: var(--ce-inset-xs) var(--ce-space-2);
      border-radius: var(--ce-radius-pill);
      background: var(--ce-color-blue-bg);
      color: var(--ce-color-blue);
      font-weight: 600;
      font-size: var(--ce-text-xs);
      font-variant-numeric: tabular-nums;
    }

    .title {
      font-weight: 600;
      font-size: var(--ce-text-md);
      color: var(--ce-text);
      line-height: var(--ce-line-snug);
      margin: 0;
    }
    .title a {
      color: inherit;
      text-decoration: none;
    }
    .title a:hover {
      text-decoration: underline;
      color: var(--ce-color-blue);
    }
    .title a:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
      border-radius: var(--ce-radius-sm);
    }

    .body {
      margin-top: var(--ce-space-1);
      color: var(--ce-muted);
      line-height: var(--ce-line-normal);
    }
    .body ::slotted(*) { margin: 0; }

    .meta {
      margin-left: var(--ce-space-2);
      color: var(--ce-dim);
      font-size: var(--ce-text-xs);
    }
    .meta:not(:has(::slotted(*))) { display: none; }

    .footer {
      margin-top: var(--ce-space-2);
      padding-top: var(--ce-space-2);
      border-top: 1px solid var(--ce-border-soft);
      color: var(--ce-muted);
      font-size: var(--ce-text-xs);
    }
    .footer:not(:has(::slotted(*))) { display: none; }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) url = "";
  @property({ type: String }) title = "";
  @property({ type: String }) site = "";
  @property({ type: String }) icon = "";
  @property({ type: Number }) score = NaN;
  @property({ type: Number }) index = NaN;

  #formatScore(s: number): string {
    if (!Number.isFinite(s)) return "";
    // Accept either 0..1 or 0..100; normalize for display
    if (s <= 1) return `${Math.round(s * 100)}%`;
    return `${Math.round(s)}%`;
  }

  #hostFromUrl(): string {
    if (!this.url) return "";
    try {
      return new URL(this.url).host;
    } catch {
      return "";
    }
  }

  override render() {
    const score = this.#formatScore(this.score);
    const site = this.site || this.#hostFromUrl();
    const indexLabel = Number.isFinite(this.index) ? `[${this.index}]` : "";

    const titleInner = this.url
      ? html`<a href=${this.url} rel="noreferrer noopener" target="_blank"
          ><slot name="title">${this.title}</slot></a
        >`
      : html`<slot name="title">${this.title}</slot>`;

    return html`
      <div class="row-top">
        ${indexLabel ? html`<span class="index">${indexLabel}</span>` : nothing}
        ${this.icon ? html`<span class="icon" aria-hidden="true">${this.icon}</span>` : nothing}
        <span class="site">${site}</span>
        <span class="meta"><slot name="meta"></slot></span>
        ${score ? html`<span class="score" aria-label="Relevance score">${score}</span>` : nothing}
      </div>
      <h4 class="title">${titleInner}</h4>
      <div class="body"><slot></slot></div>
      <div class="footer"><slot name="footer"></slot></div>
    `;
  }
}
