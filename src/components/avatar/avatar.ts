import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, type CecColor, type CecSize } from "../../core/index.js";

/**
 * `<ce-avatar>` — circular or square user identity primitive.
 *
 * Renders an image when `src` is set; falls back to monogram initials derived
 * from `name`; falls back to a neutral placeholder when neither is provided.
 *
 * Attributes:
 *   src     — image URL
 *   alt     — image alt text (defaults to `name`)
 *   name    — full name used to derive monogram initials (first letter of up to 2 tokens)
 *   size    — "sm" | "md" | "lg"   (default "md")
 *   shape   — "circle" | "square"  (default "circle")
 *   color   — CecColor tint for the initials fallback background
 *
 * Slot: default — overrides initials with arbitrary content (e.g. an icon).
 */
export class CeAvatar extends CecElement {
  static override styles = css`
    :host {
      --_size: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--_size);
      height: var(--_size);
      flex-shrink: 0;
      border-radius: 50%;
      background: var(--ce-surface-2);
      color: var(--ce-text);
      font-size: calc(var(--_size) * 0.42);
      font-weight: 700;
      line-height: 1;
      overflow: hidden;
      border: 1px solid var(--ce-border-soft);
      box-sizing: border-box;
      user-select: none;
      vertical-align: middle;
    }

    :host([size="sm"]) { --_size: 24px; }
    :host([size="md"]) { --_size: 32px; }
    :host([size="lg"]) { --_size: 48px; }

    :host([shape="square"]) { border-radius: var(--ce-radius-sm); }

    :host([color="green"])  { background: var(--ce-color-green-bg);  color: var(--ce-color-green);  }
    :host([color="red"])    { background: var(--ce-color-red-bg);    color: var(--ce-color-red);    }
    :host([color="amber"])  { background: var(--ce-color-amber-bg);  color: var(--ce-color-amber);  }
    :host([color="blue"])   { background: var(--ce-color-blue-bg);   color: var(--ce-color-blue);   }
    :host([color="purple"]) { background: var(--ce-color-purple-bg); color: var(--ce-color-purple); }
    :host([color="cyan"])   { background: var(--ce-color-cyan-bg);   color: var(--ce-color-cyan);   }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .ce-avatar__initials {
      display: inline-block;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true }) src = "";
  @property({ type: String }) alt = "";
  @property({ type: String }) name = "";
  @property({ type: String, reflect: true }) size: CecSize = "md";
  @property({ type: String, reflect: true }) shape: "circle" | "square" = "circle";
  @property({ type: String, reflect: true }) color: CecColor | null = null;

  #initials(): string {
    if (!this.name) return "";
    const parts = this.name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0] ?? "").join("");
  }

  override render() {
    if (this.src) {
      return html`<img src=${this.src} alt=${this.alt || this.name || ""} loading="lazy" />`;
    }
    const initials = this.#initials();
    return html`
      <slot>
        ${initials
          ? html`<span class="ce-avatar__initials" aria-hidden="true">${initials}</span>`
          : nothing}
      </slot>
    `;
  }
}
