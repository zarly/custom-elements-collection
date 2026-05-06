import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-input>` — labelled text-style input with help and error slots.
 *
 * Attributes:
 *   value, name, type, placeholder, required, pattern, label, help, error
 *
 * Slots: prefix, suffix.
 *
 * Events: ce-input — { value } on every keystroke
 *         ce-change — { value } on commit (blur or Enter)
 */
export class CeInput extends CecElement {
  static override styles = css`
    :host {
      display: block;
    }
    .row {
      display: flex;
      flex-direction: column;
      gap: var(--ce-space-1);
    }
    label {
      font-size: var(--ce-text-sm);
      color: var(--ce-text);
      font-weight: 600;
    }
    .field {
      display: flex;
      align-items: stretch;
      background: var(--ce-surface-2);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-sm);
      transition: border-color var(--ce-transition), box-shadow var(--ce-transition);
    }
    .field:focus-within {
      border-color: var(--ce-color-blue);
      box-shadow: var(--ce-focus-ring);
    }
    input {
      flex: 1;
      min-width: 0;
      background: transparent;
      border: 0;
      outline: 0;
      padding: var(--ce-inset-lg);
      color: var(--ce-text);
      font: inherit;
      font-size: var(--ce-text-sm);
    }
    input::placeholder { color: var(--ce-muted); }
    .prefix, .suffix {
      display: flex;
      align-items: center;
      padding: 0 var(--ce-space-2);
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
    }
    .help { font-size: var(--ce-text-xs); color: var(--ce-muted); }
    .err  { font-size: var(--ce-text-xs); color: var(--ce-color-red); }
    :host([invalid]) .field {
      border-color: var(--ce-color-red);
    }
    :host([disabled]) {
      opacity: 0.6;
      pointer-events: none;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) value = "";
  @property({ type: String }) name = "";
  @property({ type: String }) type: "text" | "email" | "number" | "password" = "text";
  @property({ type: String }) placeholder = "";
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: String }) pattern = "";
  @property({ type: String }) label = "";
  @property({ type: String }) help = "";
  @property({ type: String }) error = "";
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) invalid = false;

  @state() private _id = `ci${Math.random().toString(36).slice(2, 8)}`;

  #onInput(e: InputEvent): void {
    this.value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(
      new CustomEvent("ce-input", {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      })
    );
  }

  #onChange(e: Event): void {
    this.value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(
      new CustomEvent("ce-change", {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      })
    );
  }

  override render() {
    const showErr = !!this.error;
    return html`
      <div class="row">
        ${this.label
          ? html`<label for=${this._id}>${this.label}${this.required ? html`<span aria-hidden="true"> *</span>` : ""}</label>`
          : ""}
        <div class="field">
          <span class="prefix"><slot name="prefix"></slot></span>
          <input
            id=${this._id}
            type=${this.type}
            name=${this.name}
            placeholder=${this.placeholder}
            ?required=${this.required}
            ?disabled=${this.disabled}
            pattern=${this.pattern || ""}
            .value=${this.value}
            aria-invalid=${this.invalid || showErr ? "true" : "false"}
            aria-describedby=${showErr ? this._id + "-err" : this.help ? this._id + "-help" : ""}
            @input=${this.#onInput}
            @change=${this.#onChange}
          />
          <span class="suffix"><slot name="suffix"></slot></span>
        </div>
        ${showErr
          ? html`<div id=${this._id + "-err"} class="err">${this.error}</div>`
          : this.help
          ? html`<div id=${this._id + "-help"} class="help">${this.help}</div>`
          : ""}
      </div>
    `;
  }
}
