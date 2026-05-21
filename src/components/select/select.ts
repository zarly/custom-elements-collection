import { html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

export interface SelectOption {
  /** Underlying value emitted in change events. */
  value: string;
  /** Human-readable label. Falls back to `value` when omitted. */
  label?: string;
  /** Disable this option individually. */
  disabled?: boolean;
  /** Optional optgroup label — adjacent options sharing the same group are folded under it. */
  group?: string;
}

/**
 * `<ce-select>` — labelled single-select dropdown over a native `<select>`.
 *
 * Accepts options as a JSON-on-attribute array (`options='[…]'`) OR as slotted
 * `<option>` / `<optgroup>` children (CDR-005 dual mode). Mirrors `ce-input`'s
 * label / help / error / prefix-suffix slot layout for consistency across forms.
 *
 * Attributes:
 *   value, name, label, help, error, placeholder
 *   required, disabled, invalid (boolean, reflected)
 *
 * Slots:
 *   prefix    — leading inline content inside the field shell
 *   suffix    — trailing inline content (replaces the default chevron when used)
 *   (default) — `<option>` / `<optgroup>` children for the slot-mode authoring path
 *
 * Events:
 *   ce-change — { name, value } when the user picks a different option
 */
export class CeSelect extends CecElement {
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
      position: relative;
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
    select {
      flex: 1;
      min-width: 0;
      appearance: none;
      -webkit-appearance: none;
      background: transparent;
      border: 0;
      outline: 0;
      padding: var(--ce-inset-lg);
      padding-right: var(--ce-space-6);
      color: var(--ce-text);
      font: inherit;
      font-size: var(--ce-text-sm);
      cursor: pointer;
    }
    select:disabled { cursor: not-allowed; }
    .prefix, .suffix {
      display: flex;
      align-items: center;
      padding: 0 var(--ce-space-2);
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
    }
    .chev {
      position: absolute;
      right: var(--ce-space-3);
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
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
    /* Slot-mode authoring path: hide user-supplied <option>/<optgroup> from light DOM
       because we materialise them inside our shadow <select>. */
    ::slotted(option),
    ::slotted(optgroup) {
      display: none;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) value = "";
  @property({ type: String }) name = "";
  @property({ type: String }) label = "";
  @property({ type: String }) help = "";
  @property({ type: String }) error = "";
  @property({ type: String }) placeholder = "";
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) invalid = false;

  @property(jsonProp<SelectOption[]>([], "options"))
  options: SelectOption[] = [];

  @state() private _id = `cs${Math.random().toString(36).slice(2, 8)}`;
  @state() private _slotted: SelectOption[] = [];

  /** Collect options from light-DOM <option>/<optgroup> children. */
  #readSlottedOptions(): SelectOption[] {
    const out: SelectOption[] = [];
    for (const node of Array.from(this.children)) {
      if (node instanceof HTMLOptGroupElement) {
        const group = node.label || "";
        for (const opt of Array.from(node.children)) {
          if (opt instanceof HTMLOptionElement) {
            out.push({
              value: opt.value,
              label: opt.textContent?.trim() || opt.value,
              disabled: opt.disabled,
              group,
            });
          }
        }
      } else if (node instanceof HTMLOptionElement) {
        out.push({
          value: node.value,
          label: node.textContent?.trim() || node.value,
          disabled: node.disabled,
        });
      }
    }
    return out;
  }

  #onSlotChange = (): void => {
    this._slotted = this.#readSlottedOptions();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this._slotted = this.#readSlottedOptions();
  }

  #effectiveOptions(): SelectOption[] {
    return this.options.length ? this.options : this._slotted;
  }

  #renderOptions() {
    const opts = this.#effectiveOptions();
    // Fold consecutive same-group options under <optgroup>.
    const out: unknown[] = [];
    let currentGroup: string | null = null;
    let buf: SelectOption[] = [];
    const flush = () => {
      if (!buf.length) return;
      const items = buf.map(
        (o) => html`<option value=${o.value} ?disabled=${!!o.disabled}>${o.label ?? o.value}</option>`,
      );
      if (currentGroup) {
        out.push(html`<optgroup label=${currentGroup}>${items}</optgroup>`);
      } else {
        out.push(...items);
      }
      buf = [];
    };
    for (const o of opts) {
      const g = o.group || null;
      if (g !== currentGroup) {
        flush();
        currentGroup = g;
      }
      buf.push(o);
    }
    flush();
    return out;
  }

  #onChange = (e: Event): void => {
    this.value = (e.target as HTMLSelectElement).value;
    this.dispatchEvent(
      new CustomEvent("ce-change", {
        bubbles: true,
        composed: true,
        detail: { name: this.name, value: this.value },
      }),
    );
  };

  override render() {
    const showErr = !!this.error;
    return html`
      <div class="row">
        ${this.label
          ? html`<label for=${this._id}
              >${this.label}${this.required ? html`<span aria-hidden="true"> *</span>` : ""}</label
            >`
          : ""}
        <div class="field">
          <span class="prefix"><slot name="prefix"></slot></span>
          <select
            id=${this._id}
            name=${this.name}
            ?required=${this.required}
            ?disabled=${this.disabled}
            aria-invalid=${this.invalid || showErr ? "true" : "false"}
            aria-describedby=${showErr ? this._id + "-err" : this.help ? this._id + "-help" : ""}
            .value=${this.value}
            @change=${this.#onChange}
          >
            ${this.placeholder
              ? html`<option value="" disabled ?selected=${this.value === ""}>${this.placeholder}</option>`
              : nothing}
            ${this.#renderOptions()}
          </select>
          <slot @slotchange=${this.#onSlotChange} hidden></slot>
          <span class="suffix"><slot name="suffix">▾</slot></span>
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
