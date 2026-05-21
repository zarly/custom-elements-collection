import { html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type CeToolResultStatus = "ok" | "error" | "empty";

/**
 * `<ce-tool-result>` — standalone display of a tool/function return value.
 *
 * The pure-presentation counterpart to `<ce-tool-call>`. Use it when showing
 * the result without the collapsible call header — e.g. in agent traces,
 * detached result panels, or streaming output surfaces.
 *
 * Attributes:
 *   name        — optional tool/function name in the header label (monospace)
 *   status      — "ok" (default) | "error" | "empty"; drives left-border accent
 *   duration-ms — optional wall-clock duration; humanized like ce-tool-call
 *   compact     — boolean; tighter padding for inline-trace placement
 *
 * Slots:
 *   (default) — the result content (often a <pre> JSON dump, string, or rich content)
 *   error     — error details, shown ONLY when status="error" (replaces default)
 *   meta      — optional metadata footer (e.g. a <ce-chip> indicating cached/streamed)
 */
export class CeToolResult extends CecElement {
  static override styles = css`
    :host {
      display: block;
      border: 1px solid var(--ce-border);
      border-left: 3px solid var(--ce-color-green);
      border-radius: var(--ce-radius);
      background: var(--ce-surface);
      padding: var(--ce-space-3);
      margin: var(--ce-space-2) 0;
      position: relative;
      color: var(--ce-text);
    }
    :host([status="error"]) {
      border-left-color: var(--ce-color-red);
    }
    :host([status="empty"]) {
      border-left-color: var(--ce-border);
    }
    :host([compact]) {
      padding: var(--ce-space-2);
      font-size: var(--ce-text-sm);
    }

    /* Header row — only rendered when name or durationMs are set */
    .ce-tr__head {
      display: flex;
      align-items: center;
      gap: var(--ce-space-2);
      margin-bottom: var(--ce-space-2);
      font-size: var(--ce-text-sm);
    }
    .ce-tr__name {
      font-family: var(--ce-font-mono);
      font-weight: 600;
      color: var(--ce-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1 1 auto;
    }
    .ce-tr__duration {
      color: var(--ce-muted);
      font-size: var(--ce-text-xs);
      font-variant-numeric: tabular-nums;
      flex: 0 0 auto;
    }

    /* Default body slot */
    .ce-tr__body ::slotted(pre) {
      margin: 0;
      font-family: var(--ce-font-mono);
      font-size: var(--ce-text-sm);
      color: var(--ce-text);
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* Error slot — only rendered when status="error" */
    .ce-tr__error ::slotted(*) {
      color: var(--ce-color-red);
    }

    /* Empty placeholder — hidden when default slot has children */
    .ce-tr__empty {
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
      font-style: italic;
    }

    /* Meta footer */
    .ce-tr__meta {
      margin-top: var(--ce-space-2);
      padding-top: var(--ce-space-2);
      border-top: 1px solid var(--ce-border-soft);
      font-size: var(--ce-text-xs);
      color: var(--ce-muted);
    }
    .ce-tr__meta:not(:has(::slotted(*))) {
      display: none;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) name = "";
  @property({ type: String, reflect: true }) status: CeToolResultStatus = "ok";
  @property({ type: Number, attribute: "duration-ms" }) durationMs = NaN;
  @property({ type: Boolean, reflect: true }) compact = false;

  /**
   * Tracks whether the default slot has assigned content. When false and
   * status="empty", we render the "(no result)" placeholder.
   */
  @state() private _hasDefaultContent = false;

  #formatDuration(ms: number): string {
    if (!Number.isFinite(ms) || ms < 0) return "";
    if (ms < 1000) return `${Math.round(ms)} ms`;
    return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)} s`;
  }

  #onSlotChange = (e: Event): void => {
    const slot = e.target as HTMLSlotElement;
    const assigned = slot.assignedNodes({ flatten: true });
    // Count non-empty text nodes and elements
    this._hasDefaultContent = assigned.some(
      (n) => n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && n.textContent!.trim() !== "")
    );
  };

  override render() {
    const dur = this.#formatDuration(this.durationMs);
    const showHeader = !!(this.name || Number.isFinite(this.durationMs));
    const showEmptyPlaceholder =
      this.status === "empty" && !this._hasDefaultContent;

    return html`
      ${showHeader
        ? html`
            <div class="ce-tr__head">
              ${this.name ? html`<span class="ce-tr__name">${this.name}</span>` : nothing}
              ${dur ? html`<span class="ce-tr__duration">${dur}</span>` : nothing}
            </div>
          `
        : nothing}

      ${this.status === "error"
        ? html`<div class="ce-tr__error"><slot name="error"></slot></div>`
        : html`
            <div class="ce-tr__body">
              <slot @slotchange=${this.#onSlotChange}></slot>
              ${showEmptyPlaceholder
                ? html`<span class="ce-tr__empty">(no result)</span>`
                : nothing}
            </div>
          `}

      <div class="ce-tr__meta"><slot name="meta"></slot></div>
    `;
  }
}
