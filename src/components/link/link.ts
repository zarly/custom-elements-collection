import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-link>` — themed anchor wrapper.
 *
 * Renders an internal <a> with consistent themed underline and focus ring,
 * plus optional affordances for external links (target=_blank + ↗ glyph and
 * rel=noopener noreferrer) and downloads.
 *
 * Attributes:
 *   href      — destination URL (required for a real link)
 *   external  — boolean; opens in a new tab and appends a small ↗ glyph
 *   download  — optional filename hint; also passed through to the underlying <a>
 *   tone      — "default" | "subtle" — subtle drops the underline until hover
 *
 * Slot: default — link text and inline content.
 */
export class CeLink extends CecElement {
  static override styles = css`
    :host {
      display: inline;
    }
    a {
      color: var(--ce-color-blue);
      text-decoration: underline;
      text-underline-offset: 2px;
      text-decoration-thickness: 1px;
      border-radius: 2px;
      transition: color var(--ce-transition);
    }
    a:hover {
      color: var(--ce-text);
    }
    a:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }
    :host([tone="subtle"]) a {
      color: inherit;
      text-decoration-color: var(--ce-border-soft);
    }
    :host([tone="subtle"]) a:hover {
      color: var(--ce-color-blue);
      text-decoration-color: currentColor;
    }
    .ce-link__ext {
      display: inline-block;
      margin-left: 2px;
      font-size: 0.8em;
      vertical-align: baseline;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true }) href = "";
  @property({ type: Boolean, reflect: true }) external = false;
  @property({ type: String, reflect: true }) download: string | null = null;
  @property({ type: String, reflect: true }) tone: "default" | "subtle" = "default";

  override render() {
    const target = this.external ? "_blank" : null;
    const rel = this.external ? "noopener noreferrer" : null;
    return html`<a
      href=${this.href || "#"}
      target=${target ?? nothing}
      rel=${rel ?? nothing}
      download=${this.download ?? nothing}
    >
      <slot></slot>
      ${this.external
        ? html`<span class="ce-link__ext" aria-hidden="true">↗</span>`
        : nothing}
    </a>`;
  }
}
