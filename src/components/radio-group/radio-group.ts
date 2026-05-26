import { html, css, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

export interface RadioOption {
  /** Underlying value emitted in change events. */
  value: string;
  /** Human-readable label. */
  label: string;
  /** Optional secondary text — only rendered in the `card` variant. */
  hint?: string;
  /** Disable this option individually. */
  disabled?: boolean;
}

type Variant = "classic" | "segmented" | "card";

/**
 * `<ce-radio-group>` — single-select group with three visual variants:
 *
 *   - `classic`  — traditional radio circles + inline label.
 *   - `segmented`— joined-button group (think iOS segmented control).
 *   - `card`     — option-as-card with optional hint line.
 *
 * Attributes:
 *   name      — form-control name (echoed in `ce-change` detail).
 *   value     — currently selected value.
 *   variant   — one of "classic" | "segmented" | "card" (default "classic").
 *   vertical  — boolean; stack options vertically.
 *   disabled  — boolean; disables the whole group.
 *
 * Property:
 *   options[] — array of { value, label, hint?, disabled? }. Settable as a JS
 *               property OR as a JSON-encoded attribute (per ADR string-props rule).
 *
 * Events:
 *   ce-change — { name, value } when the user picks a different option.
 *
 * A11y:
 *   Host has role="radiogroup". Each rendered option has role="radio" +
 *   aria-checked. Arrow keys and Home/End move focus + selection (roving
 *   tabindex). Space/Enter select the focused option.
 */
export class CeRadioGroup extends CecElement {
  static override styles = css`
    :host {
      display: inline-flex;
      gap: var(--ce-space-2);
      flex-wrap: wrap;
      vertical-align: middle;
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
    }
    :host([vertical]) {
      flex-direction: column;
      align-items: stretch;
    }
    :host([variant="card"]) {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--ce-space-3);
    }
    :host([variant="card"][vertical]) {
      grid-template-columns: 1fr;
    }
    :host([variant="segmented"]) {
      display: inline-flex;
      gap: 0;
      border-radius: var(--ce-radius-sm);
      overflow: hidden;
      border: 1px solid var(--ce-border);
      background: var(--ce-surface-2);
      flex-wrap: nowrap;
    }
    :host([variant="segmented"][vertical]) {
      flex-direction: column;
    }

    button {
      font: inherit;
      color: inherit;
      cursor: pointer;
      background: transparent;
      border: 0;
      padding: 0;
      text-align: left;
    }
    button[disabled] {
      cursor: not-allowed;
      opacity: 0.55;
    }
    button:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
      border-radius: var(--ce-radius-sm);
    }

    /* ---- classic ---- */
    .opt-classic {
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-2);
      padding: var(--ce-space-1) var(--ce-space-2);
    }
    .circle {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 1.5px solid var(--ce-border-strong);
      background: var(--ce-surface-2);
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background var(--ce-transition), border-color var(--ce-transition);
    }
    .opt-classic[aria-checked="true"] .circle {
      border-color: var(--ce-color-blue);
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--ce-color-blue);
      transform: scale(0);
      transition: transform var(--ce-transition);
    }
    .opt-classic[aria-checked="true"] .dot {
      transform: scale(1);
    }

    /* ---- segmented ---- */
    .opt-seg {
      flex: 1 1 0;
      padding: var(--ce-space-2) var(--ce-space-3);
      font-weight: 500;
      text-align: center;
      border-right: 1px solid var(--ce-border);
      transition: background var(--ce-transition), color var(--ce-transition);
      white-space: nowrap;
    }
    :host([variant="segmented"][vertical]) .opt-seg {
      border-right: 0;
      border-bottom: 1px solid var(--ce-border);
    }
    .opt-seg:last-child { border-right: 0; }
    :host([variant="segmented"][vertical]) .opt-seg:last-child {
      border-bottom: 0;
    }
    .opt-seg:hover:not([disabled]):not([aria-checked="true"]) {
      background: var(--ce-state-hover, var(--ce-surface-3));
    }
    .opt-seg[aria-checked="true"] {
      background: var(--ce-color-blue);
      color: var(--ce-text-inverse);
    }

    /* ---- card ---- */
    .opt-card {
      display: block;
      padding: var(--ce-space-3) var(--ce-space-4);
      border: 1.5px solid var(--ce-border);
      border-radius: var(--ce-radius);
      background: var(--ce-surface);
      transition: border-color var(--ce-transition), background var(--ce-transition),
        box-shadow var(--ce-transition);
    }
    .opt-card:hover:not([disabled]):not([aria-checked="true"]) {
      border-color: var(--ce-border-strong);
    }
    .opt-card[aria-checked="true"] {
      border-color: var(--ce-color-blue);
      background: var(--ce-state-selected, var(--ce-surface-2));
      box-shadow: 0 0 0 1px var(--ce-color-blue) inset;
    }
    .opt-card-row {
      display: flex;
      align-items: center;
      gap: var(--ce-space-2);
      font-weight: 600;
    }
    .opt-card .hint {
      display: block;
      margin-top: var(--ce-space-1);
      color: var(--ce-muted);
      font-size: var(--ce-text-xs);
      font-weight: 400;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) name = "";
  @property({ type: String }) value = "";
  @property({ type: String, reflect: true })
  variant: Variant = "classic";
  @property({ type: Boolean, reflect: true }) vertical = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  @property(jsonProp<RadioOption[]>([], "options"))
  options: RadioOption[] = [];

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "radiogroup");
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("variant") && !["classic", "segmented", "card"].includes(this.variant)) {
      this.variant = "classic";
    }
  }

  /** Resolve the "current" option for roving tabindex purposes. */
  #currentIndex(): number {
    const i = this.options.findIndex((o) => o.value === this.value && !o.disabled);
    if (i >= 0) return i;
    // Fall back to the first non-disabled option.
    return this.options.findIndex((o) => !o.disabled);
  }

  #select(index: number): void {
    const o = this.options[index];
    if (!o || o.disabled || this.disabled) return;
    if (this.value === o.value) return;
    this.value = o.value;
    this.dispatchEvent(
      new CustomEvent("ce-change", {
        bubbles: true,
        composed: true,
        detail: { name: this.name, value: this.value },
      })
    );
  }

  #focusOption(index: number): void {
    const node = this.renderRoot.querySelectorAll<HTMLButtonElement>("[role='radio']")[index];
    if (node) node.focus();
  }

  #onKey = (e: KeyboardEvent, idx: number): void => {
    const len = this.options.length;
    if (len === 0) return;
    let next = idx;
    let isMove = false;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = this.#nextEnabled(idx, +1);
        isMove = true;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = this.#nextEnabled(idx, -1);
        isMove = true;
        break;
      case "Home":
        next = this.#firstEnabled();
        isMove = true;
        break;
      case "End":
        next = this.#lastEnabled();
        isMove = true;
        break;
      case " ":
      case "Enter":
        e.preventDefault();
        this.#select(idx);
        return;
      default:
        return;
    }
    if (isMove && next !== idx && next >= 0) {
      e.preventDefault();
      this.#select(next);
      // After selection the rerender re-runs; focus the new node next tick.
      this.updateComplete.then(() => this.#focusOption(next));
    }
  };

  #nextEnabled(from: number, dir: 1 | -1): number {
    const n = this.options.length;
    for (let step = 1; step <= n; step++) {
      const j = (from + dir * step + n * step) % n;
      if (!this.options[j].disabled) return j;
    }
    return from;
  }
  #firstEnabled(): number {
    for (let i = 0; i < this.options.length; i++) if (!this.options[i].disabled) return i;
    return 0;
  }
  #lastEnabled(): number {
    for (let i = this.options.length - 1; i >= 0; i--) if (!this.options[i].disabled) return i;
    return this.options.length - 1;
  }

  override render() {
    const cur = this.#currentIndex();
    const variant: Variant = ["classic", "segmented", "card"].includes(this.variant)
      ? this.variant
      : "classic";

    return this.options.map((o, i) => {
      const checked = o.value === this.value;
      const tabindex = i === cur ? 0 : -1;
      const disabled = this.disabled || !!o.disabled;
      const onClick = () => this.#select(i);
      const onKey = (e: KeyboardEvent) => this.#onKey(e, i);

      if (variant === "segmented") {
        return html`<button
          type="button"
          role="radio"
          class="opt-seg"
          aria-checked=${checked ? "true" : "false"}
          tabindex=${tabindex}
          ?disabled=${disabled}
          @click=${onClick}
          @keydown=${onKey}
        >${o.label}</button>`;
      }
      if (variant === "card") {
        return html`<button
          type="button"
          role="radio"
          class="opt-card"
          aria-checked=${checked ? "true" : "false"}
          tabindex=${tabindex}
          ?disabled=${disabled}
          @click=${onClick}
          @keydown=${onKey}
        >
          <span class="opt-card-row">
            <span class="circle" aria-hidden="true"><span class="dot"></span></span>
            <span>${o.label}</span>
          </span>
          ${o.hint ? html`<span class="hint">${o.hint}</span>` : ""}
        </button>`;
      }
      // classic
      return html`<button
        type="button"
        role="radio"
        class="opt-classic"
        aria-checked=${checked ? "true" : "false"}
        tabindex=${tabindex}
        ?disabled=${disabled}
        @click=${onClick}
        @keydown=${onKey}
      >
        <span class="circle" aria-hidden="true"><span class="dot"></span></span>
        <span>${o.label}</span>
      </button>`;
    });
  }
}
