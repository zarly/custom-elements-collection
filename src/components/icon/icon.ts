import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, type CecSize } from "../../core/index.js";

/**
 * `<ce-icon>` — themed icon slot.
 *
 * The library does not ship an icon set; this is a sized box that carries
 * whatever the author provides via the default slot — an inline SVG, an
 * emoji glyph, an image, or a icon-font ligature. Consistent sizing and
 * currentColor inheritance make a heterogeneous icon pile look uniform.
 *
 * Attributes:
 *   size   — sm | md | lg
 *   label  — accessible name; when set the element is announced. When unset,
 *            the icon is decorative (aria-hidden=true).
 *
 * Slot: default — the icon content (SVG, emoji, glyph, image, ligature).
 */
export class CeIcon extends CecElement {
  static override styles = css`
    :host {
      --_size: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--_size);
      height: var(--_size);
      line-height: 1;
      color: currentColor;
      vertical-align: middle;
      flex-shrink: 0;
    }
    :host([size="sm"]) { --_size: 12px; }
    :host([size="md"]) { --_size: 16px; }
    :host([size="lg"]) { --_size: 24px; }

    ::slotted(svg) {
      width: 100%;
      height: 100%;
      display: block;
      fill: currentColor;
      stroke: currentColor;
    }
    ::slotted(img) {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: contain;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true }) size: CecSize = "md";
  @property({ type: String }) label = "";

  override connectedCallback(): void {
    super.connectedCallback();
    this.#syncAria();
  }

  override updated(): void {
    this.#syncAria();
  }

  #syncAria(): void {
    if (this.label) {
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", this.label);
      this.removeAttribute("aria-hidden");
    } else {
      this.removeAttribute("role");
      this.removeAttribute("aria-label");
      this.setAttribute("aria-hidden", "true");
    }
  }

  override render() {
    return html`<slot></slot>`;
  }
}
