import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-confirm>` — inline yes/no confirmation prompt.
 *
 * Attributes:
 *   prompt        — string question (overridable via slot)
 *   confirm-label — primary button label (default "Confirm")
 *   cancel-label  — secondary button label (default "Cancel")
 *   variant       — "default" | "danger"
 *
 * Events:
 *   ce-confirm — when the user accepts
 *   ce-cancel  — when the user cancels
 */
export class CeConfirm extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface-2);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-3) var(--ce-space-4);
      color: var(--ce-text);
    }
    :host([variant="danger"]) {
      border-color: var(--ce-color-red-border);
      background: var(--ce-color-red-bg);
    }
    .row {
      display: flex;
      align-items: center;
      gap: var(--ce-space-3);
      flex-wrap: wrap;
    }
    .prompt { flex: 1; font-size: var(--ce-text-sm); }
    .actions { display: flex; gap: var(--ce-space-2); }
    button {
      padding: 6px 14px;
      font: inherit;
      font-weight: 600;
      font-size: var(--ce-text-sm);
      border-radius: var(--ce-radius-sm);
      border: 1px solid transparent;
      cursor: pointer;
      transition: background var(--ce-transition), border-color var(--ce-transition);
    }
    button.primary {
      background: var(--ce-color-blue);
      /* stylelint-disable-next-line color-no-hex -- on-accent text on saturated primary action */
      color: #fff;
    }
    :host([variant="danger"]) button.primary {
      background: var(--ce-color-red);
    }
    button.secondary {
      background: transparent;
      border-color: var(--ce-border);
      color: var(--ce-text);
    }
    button.secondary:hover { background: var(--ce-state-hover); }
    button:focus-visible { outline: 0; box-shadow: var(--ce-focus-ring); }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) prompt = "Are you sure?";
  @property({ type: String, attribute: "confirm-label" }) confirmLabel = "Confirm";
  @property({ type: String, attribute: "cancel-label" }) cancelLabel = "Cancel";
  @property({ type: String, reflect: true })
  variant: "default" | "danger" = "default";

  #emit(name: "ce-confirm" | "ce-cancel"): void {
    this.dispatchEvent(
      new CustomEvent(name, { bubbles: true, composed: true })
    );
  }

  override render() {
    return html`
      <div class="row" role="alertdialog" aria-label=${this.prompt}>
        <div class="prompt"><slot name="prompt">${this.prompt}</slot></div>
        <div class="actions">
          <button
            class="secondary"
            type="button"
            @click=${() => this.#emit("ce-cancel")}
          >
            ${this.cancelLabel}
          </button>
          <button
            class="primary"
            type="button"
            @click=${() => this.#emit("ce-confirm")}
          >
            ${this.confirmLabel}
          </button>
        </div>
      </div>
    `;
  }
}
