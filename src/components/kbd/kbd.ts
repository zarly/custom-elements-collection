import { html, css } from "lit";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-kbd>` — themed keyboard-key visual.
 *
 * Renders the slotted text as a small key cap (e.g. ⌘ K) with a subtle
 * border and inset shadow. Multi-key chords are composed with regular HTML
 * — drop multiple `<ce-kbd>` next to each other and separate with a plus
 * sign:
 *
 *   <ce-kbd>⌘</ce-kbd>+<ce-kbd>K</ce-kbd>
 *
 * No attributes — keep the surface small (CDR-001).
 *
 * Slot: default — the key label.
 */
export class CeKbd extends CecElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.6em;
      padding: 1px var(--ce-space-2);
      font-family: var(--ce-font-mono);
      font-size: var(--ce-text-xs);
      line-height: 1.4;
      color: var(--ce-text);
      background: var(--ce-surface-2);
      border: 1px solid var(--ce-border);
      border-bottom-width: 2px;
      border-radius: var(--ce-radius-sm);
      box-shadow: inset 0 -1px 0 var(--ce-border-soft);
      vertical-align: middle;
      white-space: nowrap;
      user-select: none;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "text");
    }
  }

  override render() {
    return html`<slot></slot>`;
  }
}
