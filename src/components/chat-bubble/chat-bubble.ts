import { html, css, nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type CeChatRole = "user" | "assistant" | "system" | "tool";

/**
 * `<ce-chat-bubble>` — single chat message with role-driven styling.
 *
 * Attributes:
 *   role        — "user" | "assistant" | "system" | "tool" (default "assistant")
 *   author      — display name (e.g. "Claude", "Alex")
 *   timestamp   — ISO-8601 string; rendered verbatim (host can format upstream)
 *   model       — optional model name (e.g. "opus-4.7")
 *   tokens      — optional token count; rendered in the footer when set
 *
 * Slots:
 *   (default) — message body
 *   avatar    — small avatar element shown beside the bubble
 *   footer    — extra footer content (rendered before the tokens chip)
 *
 * No events — bubbles are pure presentation.
 */
export class CeChatBubble extends CecElement {
  static override styles = css`
    :host {
      display: block;
      margin: var(--ce-space-3) 0;
      max-width: 100%;
    }
    .ce-bubble {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--ce-space-3);
      align-items: start;
    }
    /* Default (assistant/system/tool): avatar on the left */
    :host([role="user"]) .ce-bubble {
      grid-template-columns: 1fr auto;
    }
    :host([role="user"]) .ce-bubble__avatar { order: 2; }
    :host([role="user"]) .ce-bubble__content { order: 1; }

    .ce-bubble__avatar {
      flex: 0 0 auto;
      width: var(--ce-sz-lg);
      height: var(--ce-sz-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      overflow: hidden;
      background: var(--ce-surface-2);
      color: var(--ce-muted);
      font-size: var(--ce-text-md);
    }
    .ce-bubble__avatar:not(:has(::slotted(*))) {
      display: none;
    }

    .ce-bubble__content {
      min-width: 0;
      padding: var(--ce-space-3) var(--ce-space-4);
      border-radius: var(--ce-radius);
      border: 1px solid var(--ce-border);
      background: var(--ce-surface);
      color: var(--ce-text);
    }

    :host([role="assistant"]) .ce-bubble__content {
      background: var(--ce-color-blue-bg);
      border-color: var(--ce-color-blue-border);
    }
    :host([role="user"]) .ce-bubble__content {
      background: var(--ce-color-purple-bg);
      border-color: var(--ce-color-purple-border);
    }
    :host([role="system"]) .ce-bubble__content {
      background: var(--ce-surface-2);
      border-color: var(--ce-border);
    }
    :host([role="tool"]) .ce-bubble__content {
      background: var(--ce-color-amber-bg);
      border-color: var(--ce-color-amber-border);
    }

    .ce-bubble__head {
      display: flex;
      align-items: baseline;
      gap: var(--ce-space-2);
      margin-bottom: var(--ce-space-1);
      font-size: var(--ce-text-xs);
      flex-wrap: wrap;
    }
    .ce-bubble__author {
      font-weight: 700;
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
    }
    .ce-bubble__model {
      color: var(--ce-muted);
    }
    .ce-bubble__time {
      color: var(--ce-muted);
      margin-left: auto;
    }
    .ce-bubble__head:empty { display: none; }

    .ce-bubble__body ::slotted(*:first-child) { margin-top: 0; }
    .ce-bubble__body ::slotted(*:last-child) { margin-bottom: 0; }

    .ce-bubble__footer {
      margin-top: var(--ce-space-2);
      padding-top: var(--ce-space-2);
      border-top: 1px solid var(--ce-border-soft);
      display: flex;
      align-items: center;
      gap: var(--ce-space-2);
      color: var(--ce-muted);
      font-size: var(--ce-text-xs);
    }
    .ce-bubble__footer:not(:has(::slotted(*))):not([data-has-tokens]) {
      display: none;
    }
    .ce-bubble__tokens {
      margin-left: auto;
      font-variant-numeric: tabular-nums;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  override role: CeChatRole = "assistant";

  @property({ type: String }) author = "";
  @property({ type: String }) timestamp = "";
  @property({ type: String }) model = "";
  @property({ type: Number }) tokens: number | null = null;

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("author") || !this.hasAttribute("aria-label")) {
      if (this.author) {
        this.setAttribute("aria-label", `Message from ${this.author}`);
      }
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", this.role);
    // ARIA: a chat bubble is a self-contained article-like region.
    if (!this.hasAttribute("aria-roledescription")) {
      this.setAttribute("aria-roledescription", "message");
    }
  }

  override render() {
    const showHead = !!(this.author || this.model || this.timestamp);
    const showTokens = typeof this.tokens === "number" && Number.isFinite(this.tokens);
    return html`
      <div class="ce-bubble">
        <div class="ce-bubble__avatar"><slot name="avatar"></slot></div>
        <div class="ce-bubble__content">
          ${showHead
            ? html`<div class="ce-bubble__head">
                ${this.author
                  ? html`<span class="ce-bubble__author">${this.author}</span>`
                  : nothing}
                ${this.model
                  ? html`<span class="ce-bubble__model">${this.model}</span>`
                  : nothing}
                ${this.timestamp
                  ? html`<span class="ce-bubble__time">${this.timestamp}</span>`
                  : nothing}
              </div>`
            : nothing}
          <div class="ce-bubble__body"><slot></slot></div>
          <div class="ce-bubble__footer" ?data-has-tokens=${showTokens}>
            <slot name="footer"></slot>
            ${showTokens
              ? html`<span class="ce-bubble__tokens">${this.tokens} tokens</span>`
              : nothing}
          </div>
        </div>
      </div>
    `;
  }
}
