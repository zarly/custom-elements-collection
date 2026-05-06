import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-abbr>` — abbreviation with tooltip-style expansion.
 *
 * Attributes:
 *   title — full text to expose on hover/focus.
 *
 * Slot: default — the abbreviation glyph (e.g. "API").
 */
export class CeAbbr extends CecElement {
  static override styles = css`
    :host {
      display: inline;
      cursor: help;
      text-decoration: underline dotted var(--ce-muted);
      text-underline-offset: 2px;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) title = "";

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
  }

  override updated(): void {
    if (this.title) {
      this.setAttribute("aria-label", this.title);
    }
  }

  override render() {
    return html`<slot></slot>`;
  }
}
