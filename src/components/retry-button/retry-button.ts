import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type CeRetryVariant = "primary" | "secondary" | "ghost";

/**
 * `<ce-retry-button>` — emits a "regenerate" intent for chat surfaces.
 *
 * Attributes:
 *   label    — visible button label (default "Retry")
 *   variant  — "primary" | "secondary" | "ghost" (default "secondary")
 *
 * Slot:
 *   (default) — overrides the icon + label content.
 *
 * Events:
 *   ce-retry — bubbles, no detail.
 */
export class CeRetryButton extends CecElement {
  static override styles = css`
    :host { display: inline-block; }
    button {
      font: inherit;
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-2);
      padding: var(--ce-inset-sm) var(--ce-space-3);
      border-radius: var(--ce-radius-sm);
      border: 1px solid var(--ce-border);
      cursor: pointer;
      color: var(--ce-text);
      background: var(--ce-surface-2);
      transition: background var(--ce-transition-fast), border-color var(--ce-transition-fast),
        color var(--ce-transition-fast);
    }
    button:hover { border-color: var(--ce-color-blue); }
    button:focus-visible { outline: none; box-shadow: var(--ce-focus-ring); }

    :host([variant="primary"]) button {
      background: var(--ce-color-blue-bg);
      color: var(--ce-color-blue);
      border-color: var(--ce-color-blue-border);
    }
    :host([variant="primary"]) button:hover {
      background: var(--ce-color-blue-bg);
      border-color: var(--ce-color-blue);
    }
    :host([variant="ghost"]) button {
      background: transparent;
      border-color: transparent;
      color: var(--ce-text);
    }
    :host([variant="ghost"]) button:hover {
      background: var(--ce-state-hover);
    }

    .ce-retry__icon {
      width: 14px;
      height: 14px;
      flex: 0 0 auto;
    }
    /* Hide the default fallback when slotted content exists */
    .ce-retry__default { display: inline-flex; align-items: center; gap: var(--ce-space-2); }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) label = "Retry";
  @property({ type: String, reflect: true }) variant: CeRetryVariant = "secondary";

  override render() {
    return html`<button type="button" @click=${this.#onClick}>
      <slot>
        <span class="ce-retry__default">
          <svg class="ce-retry__icon" viewBox="0 0 16 16" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 8a5 5 0 1 1 1.46 3.54M3 4v3.5h3.5"
            />
          </svg>
          <span>${this.label}</span>
        </span>
      </slot>
    </button>`;
  }

  #onClick = (): void => {
    this.dispatchEvent(
      new CustomEvent("ce-retry", { bubbles: true, composed: true })
    );
  };
}
