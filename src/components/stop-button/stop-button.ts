import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type CeStopVariant = "primary" | "secondary" | "ghost";

/**
 * `<ce-stop-button>` — emits a stop-generation intent for chat surfaces.
 *
 * Attributes:
 *   label    — visible button label (default "Stop")
 *   variant  — "primary" | "secondary" | "ghost" (default "secondary")
 *   disabled — disables the button; click does NOT emit the event
 *
 * Slot:
 *   (default) — overrides the icon + label content.
 *
 * Events:
 *   ce-chat-stop — bubbles, composed, no detail payload. Does NOT fire when disabled.
 */
export class CeStopButton extends CecElement {
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
    button:hover { border-color: var(--ce-color-red); }
    button:focus-visible { outline: none; box-shadow: var(--ce-focus-ring); }

    :host([variant="primary"]) button {
      background: var(--ce-color-red-bg);
      color: var(--ce-color-red);
      border-color: var(--ce-color-red-border);
    }
    :host([variant="primary"]) button:hover {
      background: var(--ce-color-red-bg);
      border-color: var(--ce-color-red);
    }
    :host([variant="ghost"]) button {
      background: transparent;
      border-color: transparent;
      color: var(--ce-text);
    }
    :host([variant="ghost"]) button:hover {
      background: var(--ce-state-hover);
    }

    :host([disabled]) button,
    button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      pointer-events: none;
    }

    .ce-stop__icon {
      width: 14px;
      height: 14px;
      flex: 0 0 auto;
    }
    .ce-stop__default { display: inline-flex; align-items: center; gap: var(--ce-space-2); }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) label = "Stop";
  @property({ type: String, reflect: true }) variant: CeStopVariant = "secondary";
  @property({ type: Boolean, reflect: true }) disabled = false;

  override render() {
    return html`<button
      type="button"
      ?disabled=${this.disabled}
      @click=${this.#onClick}
      @keydown=${this.#onKeydown}
    >
      <slot>
        <span class="ce-stop__default">
          <svg class="ce-stop__icon" viewBox="0 0 16 16" aria-hidden="true">
            <rect x="3" y="3" width="10" height="10" rx="1.5" fill="currentColor" />
          </svg>
          <span>${this.label}</span>
        </span>
      </slot>
    </button>`;
  }

  #onClick = (): void => {
    if (this.disabled) return;
    this.dispatchEvent(
      new CustomEvent("ce-chat-stop", { bubbles: true, composed: true, detail: {} })
    );
  };

  #onKeydown = (e: KeyboardEvent): void => {
    if (this.disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.dispatchEvent(
        new CustomEvent("ce-chat-stop", { bubbles: true, composed: true, detail: {} })
      );
    }
  };
}
