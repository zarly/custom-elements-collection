import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<lesson-note>` — callout aside for lesson content.
 *
 * Attributes:
 *   type — tip | info | key | warning | danger (default: info)
 *   icon — override the auto-selected icon
 */
export class LessonNote extends CecElement {
  static override styles = css`
    :host {
      display: block;
      margin: var(--ce-space-3) 0;
    }
    .ln-wrap {
      display: flex;
      gap: var(--ce-space-3);
      padding: var(--ce-space-4) var(--ce-space-5);
      border-left: 3px solid var(--ce-border);
      border-radius: var(--ce-radius);
      background: var(--ce-surface);
    }
    :host([type="tip"]) .ln-wrap {
      border-color: var(--ce-color-blue);
      background: var(--ce-color-blue-bg);
    }
    :host([type="info"]) .ln-wrap {
      border-color: var(--ce-color-cyan);
      background: var(--ce-surface-2);
    }
    :host([type="key"]) .ln-wrap {
      border-color: var(--ce-color-amber);
      background: var(--ce-color-amber-bg);
    }
    :host([type="warning"]) .ln-wrap {
      border-color: var(--ce-color-amber);
      background: var(--ce-color-amber-bg);
    }
    :host([type="danger"]) .ln-wrap {
      border-color: var(--ce-color-red);
      background: var(--ce-color-red-bg);
    }
    .ln-icon {
      flex: 0 0 auto;
      font-size: var(--ce-text-md);
    }
    .ln-body {
      color: var(--ce-text);
      font-size: var(--ce-text-base);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true }) type = "info";
  @property({ type: String }) icon = "";

  #autoIcon(): string {
    switch (this.type) {
      case "tip": return "💡";
      case "key": return "🔑";
      case "warning": return "⚠";
      case "danger": return "🚨";
      default: return "ℹ";
    }
  }

  override render() {
    const iconText = this.icon || this.#autoIcon();
    return html`
      <div class="ln-wrap">
        <span class="ln-icon" aria-hidden="true">${iconText}</span>
        <div class="ln-body"><slot></slot></div>
      </div>
    `;
  }
}
