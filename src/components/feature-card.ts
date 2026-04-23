import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, type CecColor } from "../core/index.js";

/**
 * `<ce-feature-card>` — icon + title + body + optional CTA.
 *
 * Attributes:
 *   icon   — emoji/character icon
 *   title  — title text
 *   color  — accent color (default neutral)
 *   cta    — CTA text; renders as a button
 *   href   — if set with cta, renders as a link
 *
 * Events:
 *   ce-feature-cta — fires on CTA click (when href not set)
 */
export class CeFeatureCard extends CecElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--ce-space-2);
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-4) var(--ce-space-5);
      transition: border-color var(--ce-transition);
    }
    :host(:hover) { border-color: var(--ce-border-strong); }

    .ce-feature__icon {
      width: 38px;
      height: 38px;
      border-radius: var(--ce-radius-sm);
      background: var(--ce-surface-2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    :host([color="green"])  .ce-feature__icon { background: var(--ce-color-green-bg);  color: var(--ce-color-green);  }
    :host([color="red"])    .ce-feature__icon { background: var(--ce-color-red-bg);    color: var(--ce-color-red);    }
    :host([color="amber"])  .ce-feature__icon { background: var(--ce-color-amber-bg);  color: var(--ce-color-amber);  }
    :host([color="blue"])   .ce-feature__icon { background: var(--ce-color-blue-bg);   color: var(--ce-color-blue);   }
    :host([color="purple"]) .ce-feature__icon { background: var(--ce-color-purple-bg); color: var(--ce-color-purple); }
    :host([color="cyan"])   .ce-feature__icon { background: var(--ce-color-cyan-bg);   color: var(--ce-color-cyan);   }

    .ce-feature__title {
      font-size: var(--ce-text-md);
      font-weight: 700;
      color: var(--ce-text);
    }
    .ce-feature__body {
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
      flex: 1;
    }
    .ce-feature__cta {
      align-self: flex-start;
      margin-top: var(--ce-space-2);
      background: transparent;
      color: var(--ce-color-blue);
      border: 1px solid var(--ce-color-blue-border);
      border-radius: var(--ce-radius-sm);
      padding: 6px 12px;
      cursor: pointer;
      font: inherit;
      font-weight: 600;
      font-size: var(--ce-text-sm);
      text-decoration: none;
      transition: background var(--ce-transition-fast);
    }
    .ce-feature__cta:hover { background: var(--ce-color-blue-bg); }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) icon = "";
  @property({ type: String }) override title = "";
  @property({ type: String }) cta = "";
  @property({ type: String }) href = "";
  @property({ type: String, reflect: true }) color: CecColor = "neutral";

  override render() {
    return html`
      ${this.icon
        ? html`<div class="ce-feature__icon" aria-hidden="true">${this.icon}</div>`
        : nothing}
      <div class="ce-feature__title">${this.title}</div>
      <div class="ce-feature__body"><slot></slot></div>
      ${this.cta
        ? this.href
          ? html`<a class="ce-feature__cta" href=${this.href}>${this.cta}</a>`
          : html`<button class="ce-feature__cta" type="button" @click=${this.#emit}>
              ${this.cta}
            </button>`
        : nothing}
    `;
  }

  #emit = (): void => {
    this.dispatchEvent(
      new CustomEvent("ce-feature-cta", { bubbles: true, composed: true })
    );
  };
}
