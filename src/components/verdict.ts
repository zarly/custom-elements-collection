import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../core/index.js";

export type VerdictType = "go" | "no-go" | "mixed" | "info";

/**
 * `<ce-verdict>` — decision banner with icon, title, and detail text.
 *
 * Attributes:
 *   type    — "go" (green) | "no-go" (red) | "mixed" (amber) | "info" (blue)
 *   title   — short verdict line (overrides slot name="title")
 *   detail  — supporting text (overrides default slot)
 *   icon    — optional override icon char; defaults by type (✓ ✗ ⚠ ℹ)
 */
export class CeVerdict extends CecElement {
  static override styles = css`
    :host {
      display: flex;
      gap: var(--ce-space-4);
      align-items: flex-start;
      padding: var(--ce-space-5);
      border-radius: var(--ce-radius);
      border: 1px solid var(--ce-color-blue-border);
      background: linear-gradient(135deg, var(--ce-color-blue-bg), transparent);
    }
    :host([type="go"]) {
      border-color: var(--ce-color-green-border);
      background: linear-gradient(135deg, var(--ce-color-green-bg), transparent);
    }
    :host([type="no-go"]) {
      border-color: var(--ce-color-red-border);
      background: linear-gradient(135deg, var(--ce-color-red-bg), transparent);
    }
    :host([type="mixed"]) {
      border-color: var(--ce-color-amber-border);
      background: linear-gradient(135deg, var(--ce-color-amber-bg), transparent);
    }
    .ce-verdict__icon {
      width: var(--ce-sz-lg);
      height: var(--ce-sz-lg);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--ce-text-xl);
      font-weight: 700;
      flex: 0 0 auto;
      background: var(--ce-color-blue-bg);
      color: var(--ce-color-blue);
    }
    :host([type="go"])    .ce-verdict__icon { background: var(--ce-color-green-bg);  color: var(--ce-color-green);  }
    :host([type="no-go"]) .ce-verdict__icon { background: var(--ce-color-red-bg);    color: var(--ce-color-red);    }
    :host([type="mixed"]) .ce-verdict__icon { background: var(--ce-color-amber-bg);  color: var(--ce-color-amber);  }

    .ce-verdict__body { min-width: 0; }
    .ce-verdict__title {
      font-weight: 700;
      font-size: var(--ce-text-md);
      margin-bottom: var(--ce-space-1);
      color: var(--ce-color-blue);
    }
    :host([type="go"])    .ce-verdict__title { color: var(--ce-color-green); }
    :host([type="no-go"]) .ce-verdict__title { color: var(--ce-color-red);   }
    :host([type="mixed"]) .ce-verdict__title { color: var(--ce-color-amber); }
    .ce-verdict__detail {
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true }) type: VerdictType = "info";
  @property({ type: String }) override title = "";
  @property({ type: String }) detail = "";
  @property({ type: String }) icon = "";

  get #defaultIcon(): string {
    switch (this.type) {
      case "go": return "✓";
      case "no-go": return "✗";
      case "mixed": return "⚠";
      default: return "ℹ";
    }
  }

  override render() {
    const iconChar = this.icon || this.#defaultIcon;
    return html`
      <div class="ce-verdict__icon" aria-hidden="true">${iconChar}</div>
      <div class="ce-verdict__body">
        ${this.title
          ? html`<div class="ce-verdict__title"><slot name="title">${this.title}</slot></div>`
          : nothing}
        <div class="ce-verdict__detail">
          <slot>${this.detail}</slot>
        </div>
      </div>
    `;
  }
}
