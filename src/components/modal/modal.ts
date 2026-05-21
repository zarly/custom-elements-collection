import { html, css, type PropertyValues } from "lit";
import { property, query } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-modal>` — a themed modal dialog wrapping the native `<dialog>` element.
 *
 * Usage:
 *
 *   <ce-modal title="Welcome" open>
 *     <p>Body content here.</p>
 *   </ce-modal>
 *
 *   <ce-modal title="Confirm action" open>
 *     <p>Are you sure?</p>
 *     <ce-button slot="footer">Cancel</ce-button>
 *     <ce-button slot="footer">Confirm</ce-button>
 *   </ce-modal>
 *
 * Attributes:
 *   open         — boolean; shows/hides the modal.
 *   title        — string; rendered as the modal header.
 *   dismissible  — boolean; default true. When false, ESC and backdrop-click are suppressed.
 *
 * Slots:
 *   (default) — modal body content.
 *   footer    — action area (right-aligned).
 *
 * Methods:
 *   show()  — opens the modal.
 *   close() — closes the modal.
 *
 * Events:
 *   ce-modal-open  — fires after the modal becomes visible.
 *   ce-modal-close — fires after the modal closes.
 */
export class CeModal extends CecElement {
  static override styles = css`
    :host {
      display: contents;
    }

    dialog {
      padding: 0;
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      background: var(--ce-surface);
      color: var(--ce-text);
      box-shadow: var(--ce-shadow-lg);
      max-width: min(90vw, 560px);
      width: 100%;
      outline: none;
    }

    dialog::backdrop {
      background: rgba(0, 0, 0, 0.55);
    }

    .ce-modal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--ce-space-4) var(--ce-space-5);
      border-bottom: 1px solid var(--ce-border);
    }

    .ce-modal__title {
      margin: 0;
      font-size: var(--ce-text-md);
      font-weight: 700;
      color: var(--ce-text);
    }

    .ce-modal__close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: var(--ce-radius-sm);
      color: var(--ce-muted);
      cursor: pointer;
      font-size: var(--ce-text-md);
      line-height: 1;
      transition: background var(--ce-transition), color var(--ce-transition);
    }

    .ce-modal__close:hover {
      background: var(--ce-state-hover);
      color: var(--ce-text);
    }

    .ce-modal__close:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }

    .ce-modal__body {
      padding: var(--ce-space-4) var(--ce-space-5);
    }

    .ce-modal__footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--ce-space-2);
      padding: var(--ce-space-3) var(--ce-space-5);
      border-top: 1px solid var(--ce-border);
    }

    .ce-modal__footer:not(:has(::slotted(*))) {
      display: none;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String, reflect: true })
  title = "";

  @property({ type: Boolean, reflect: true })
  dismissible = true;

  @query("dialog")
  private _dialog!: HTMLDialogElement;

  /** The element that had focus before the modal opened. */
  private _previousFocus: Element | null = null;

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has("open")) {
      if (this.open) {
        this._openDialog();
      } else {
        this._closeDialog();
      }
    }
  }

  /** Opens the modal programmatically. */
  show(): void {
    this.open = true;
  }

  /** Closes the modal programmatically. */
  close(): void {
    this.open = false;
  }

  private _openDialog(): void {
    if (!this._dialog) return;
    if (this._dialog.open) return;
    this._previousFocus = document.activeElement;
    this._dialog.showModal();
    this.dispatchEvent(
      new CustomEvent("ce-modal-open", { bubbles: true, composed: true })
    );
  }

  private _closeDialog(): void {
    if (!this._dialog) return;
    if (!this._dialog.open) return;
    this._dialog.close();
    // Return focus to the invoker
    if (this._previousFocus && this._previousFocus instanceof HTMLElement) {
      if (document.contains(this._previousFocus)) {
        this._previousFocus.focus();
      }
    }
    this._previousFocus = null;
    this.dispatchEvent(
      new CustomEvent("ce-modal-close", { bubbles: true, composed: true })
    );
  }

  private _onDialogClick(e: MouseEvent): void {
    if (!this.dismissible) return;
    // Backdrop click: the click lands on the <dialog> element itself, not its content
    if (e.target === this._dialog) {
      this.close();
    }
  }

  private _onDialogCancel(e: Event): void {
    // Native ESC fires "cancel" on the dialog element
    e.preventDefault();
    if (this.dismissible) {
      this.close();
    }
  }

  override render() {
    return html`
      <dialog
        aria-modal="true"
        aria-label=${this.title || "Dialog"}
        @click=${this._onDialogClick}
        @cancel=${this._onDialogCancel}
      >
        <div class="ce-modal__header">
          <h2 class="ce-modal__title">${this.title}</h2>
          ${this.dismissible
            ? html`
                <button
                  type="button"
                  class="ce-modal__close"
                  aria-label="Close"
                  @click=${() => this.close()}
                >
                  ✕
                </button>
              `
            : ""}
        </div>
        <div class="ce-modal__body">
          <slot></slot>
        </div>
        <div class="ce-modal__footer">
          <slot name="footer"></slot>
        </div>
      </dialog>
    `;
  }
}
