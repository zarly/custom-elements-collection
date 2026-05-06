import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-textarea>` — multi-line input with auto-grow and label.
 *
 * Attributes:
 *   value, name, rows, max-rows, placeholder, label, help, error, disabled, required
 *
 * Events:
 *   ce-input  — { value } per keystroke
 *   ce-change — { value } on commit
 */
export class CeTextarea extends CecElement {
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
      background: var(--ce-surface-2);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-sm);
      transition: border-color var(--ce-transition), box-shadow var(--ce-transition);
    }
    .field:focus-within {
      border-color: var(--ce-color-blue);
      box-shadow: var(--ce-focus-ring);
    }
    textarea {
      display: block;
      width: 100%;
      box-sizing: border-box;
      background: transparent;
      border: 0;
      outline: 0;
      padding: var(--ce-inset-lg);
      color: var(--ce-text);
      font: inherit;
      font-size: var(--ce-text-sm);
      resize: vertical;
      line-height: var(--ce-line-snug);
    }
    textarea::placeholder { color: var(--ce-muted); }
    .help { font-size: var(--ce-text-xs); color: var(--ce-muted); }
    .err  { font-size: var(--ce-text-xs); color: var(--ce-color-red); }
    :host([invalid]) .field { border-color: var(--ce-color-red); }
    :host([disabled]) { opacity: 0.6; pointer-events: none; }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) value = "";
  @property({ type: String }) name = "";
  @property({ type: Number }) rows = 3;
  @property({ type: Number, attribute: "max-rows" }) maxRows = 10;
  @property({ type: String }) placeholder = "";
  @property({ type: String }) label = "";
  @property({ type: String }) help = "";
  @property({ type: String }) error = "";
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) invalid = false;

  @state() private _id = `ct${Math.random().toString(36).slice(2, 8)}`;

  #autoGrow(ta: HTMLTextAreaElement): void {
    ta.style.height = "auto";
    const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 16;
    const max = lineHeight * this.maxRows + 16;
    ta.style.height = Math.min(ta.scrollHeight, max) + "px";
  }

  #onInput(e: InputEvent): void {
    const ta = e.target as HTMLTextAreaElement;
    this.value = ta.value;
    this.#autoGrow(ta);
    this.dispatchEvent(
      new CustomEvent("ce-input", {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      })
    );
  }

  #onChange(e: Event): void {
    this.value = (e.target as HTMLTextAreaElement).value;
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
          <textarea
            id=${this._id}
            name=${this.name}
            rows=${this.rows}
            placeholder=${this.placeholder}
            ?required=${this.required}
            ?disabled=${this.disabled}
            .value=${this.value}
            aria-invalid=${this.invalid || showErr ? "true" : "false"}
            aria-describedby=${showErr ? this._id + "-err" : this.help ? this._id + "-help" : ""}
            @input=${this.#onInput}
            @change=${this.#onChange}
          ></textarea>
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
