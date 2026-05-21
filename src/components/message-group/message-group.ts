import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type CeMessageGroupRole = "user" | "assistant" | "system" | "tool";

/**
 * `<ce-message-group>` — cluster consecutive same-role chat messages with shared metadata.
 *
 * Renders a group-level avatar and header (author + timestamp) exactly once, then
 * stacks slotted message children (typically `<ce-chat-bubble>`) with tightened
 * inter-bubble spacing. Role-driven alignment mirrors `<ce-chat-bubble>`:
 * user groups align right, all others left.
 *
 * Attributes:
 *   role       — "user" | "assistant" | "system" | "tool" (default "assistant")
 *   author     — optional group-level author; rendered once in the group header
 *   timestamp  — optional group-level timestamp; rendered once in the group header
 *   compact    — boolean; tightens spacing between clustered bubbles
 *
 * Slots:
 *   (default) — the messages (typically ce-chat-bubble elements, but any element works)
 *   avatar    — group-level avatar rendered once on the role-aligned side
 *   header    — optional group header rendered above the messages
 *
 * No events — this is a pure layout component.
 */
export class CeMessageGroup extends CecElement {
  static override styles = css`
    :host {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--ce-space-3);
      margin: var(--ce-space-4) 0;
      align-items: start;
    }

    /* User role: flip to right-aligned layout */
    :host([role="user"]) {
      grid-template-columns: 1fr auto;
    }
    :host([role="user"]) .ce-mg__avatar {
      order: 2;
    }
    :host([role="user"]) .ce-mg__body {
      order: 1;
    }

    /* Avatar slot — 40×40 circle, same chrome as ce-chat-bubble */
    .ce-mg__avatar {
      flex: 0 0 auto;
      width: var(--ce-sz-lg);
      height: var(--ce-sz-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--ce-radius-pill);
      overflow: hidden;
      background: var(--ce-surface-2);
      color: var(--ce-muted);
      font-size: var(--ce-text-md);
      align-self: start;
    }
    /* Hide the avatar column entirely when the slot is empty */
    .ce-mg__avatar:not(:has(::slotted(*))) {
      display: none;
    }

    /* Body column: header + messages stack */
    .ce-mg__body {
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    /* Auto-generated group header (author + timestamp from props) */
    .ce-mg__head {
      display: flex;
      align-items: baseline;
      gap: var(--ce-space-2);
      margin-bottom: var(--ce-space-2);
      font-size: var(--ce-text-xs);
      color: var(--ce-muted);
      flex-wrap: wrap;
    }
    .ce-mg__author {
      font-weight: 700;
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
    }
    .ce-mg__time {
      color: var(--ce-muted);
      margin-left: auto;
    }

    /* Named header slot (takes priority visually, sits above messages) */
    .ce-mg__header-slot {
      margin-bottom: var(--ce-space-2);
    }

    /* Messages stack */
    .ce-mg__messages {
      display: flex;
      flex-direction: column;
      gap: var(--ce-space-2);
    }

    /* Compact mode: tighten inter-bubble gap */
    :host([compact]) .ce-mg__messages {
      gap: var(--ce-space-1);
    }

    /*
     * Tighten margin on follow-up bubbles slotted directly.
     * ce-chat-bubble sets margin: var(--ce-space-3) 0 on :host; reduce it for
     * non-first children so the group gap alone controls spacing. The internal
     * avatar/head suppression is handled by setting ce-chat-bubble[follow-up]
     * imperatively on slot change (see #syncFollowUp).
     */
    ::slotted(ce-chat-bubble + ce-chat-bubble) {
      margin-top: 0;
    }
    ::slotted(ce-chat-bubble:not(:first-of-type)) {
      margin-top: 0;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  /**
   * Group role — drives alignment and slot ordering.
   * Overrides LitElement's inherited `role` accessor so the attribute
   * is the chat role (same pattern as CeChatBubble).
   */
  @property({ type: String, reflect: true })
  override role: CeMessageGroupRole = "assistant";

  /** Optional group-level author name; rendered once in the group header. */
  @property({ type: String }) author = "";

  /** Optional group-level timestamp; rendered once in the group header. */
  @property({ type: String }) timestamp = "";

  /** Tighter spacing between clustered bubbles when true. */
  @property({ type: Boolean, reflect: true }) compact = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", this.role);
    if (!this.hasAttribute("aria-roledescription")) {
      this.setAttribute("aria-roledescription", "message group");
    }
  }

  override render() {
    const showHead = !!(this.author || this.timestamp);
    return html`
      <div class="ce-mg__avatar">
        <slot name="avatar"></slot>
      </div>
      <div class="ce-mg__body">
        <slot name="header" class="ce-mg__header-slot"></slot>
        ${showHead
          ? html`<div class="ce-mg__head">
              ${this.author
                ? html`<span class="ce-mg__author">${this.author}</span>`
                : nothing}
              ${this.timestamp
                ? html`<span class="ce-mg__time">${this.timestamp}</span>`
                : nothing}
            </div>`
          : nothing}
        <div class="ce-mg__messages">
          <slot @slotchange=${this.#onSlotChange}></slot>
        </div>
      </div>
    `;
  }

  #onSlotChange = (e: Event): void => {
    const slot = e.target as HTMLSlotElement;
    this.#syncFollowUp(slot);
  };

  /**
   * Mark every slotted `ce-chat-bubble` after the first with `follow-up`
   * so the bubble suppresses its avatar / head / top margin. The host of
   * the group remains free to slot non-bubble elements; those are skipped.
   */
  #syncFollowUp(slot: HTMLSlotElement): void {
    const assigned = slot.assignedElements({ flatten: false });
    let seenBubble = false;
    for (const el of assigned) {
      if (el.tagName.toLowerCase() !== "ce-chat-bubble") continue;
      if (!seenBubble) {
        el.removeAttribute("follow-up");
        seenBubble = true;
      } else {
        if (!el.hasAttribute("follow-up")) el.setAttribute("follow-up", "");
      }
    }
  }
}
