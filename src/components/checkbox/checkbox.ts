import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-checkbox>` — accessible checkbox with semantic theming.
 *
 * Attributes:
 *   checked       — boolean
 *   indeterminate — boolean (visual third state; cleared on user toggle)
 *   disabled      — boolean
 *   label         — string label
 *   name, value   — form-control attributes (reserved)
 *
 * Events: ce-change — { checked }
 */
export class CeCheckbox extends CecElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-2);
      vertical-align: middle;
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
      cursor: pointer;
    }
    :host([disabled]) { cursor: not-allowed; opacity: 0.55; }
    .box {
      width: 16px;
      height: 16px;
      border-radius: var(--ce-radius-sm);
      border: 1.5px solid var(--ce-border-strong);
      background: var(--ce-surface-2);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      transition: background var(--ce-transition), border-color var(--ce-transition);
    }
    :host([checked]) .box,
    :host([indeterminate]) .box {
      background: var(--ce-color-blue);
      border-color: var(--ce-color-blue);
    }
    .check, .dash {
      stroke: #fff;
      stroke-width: 2.5;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
      visibility: hidden;
    }
    :host([checked]) .check { visibility: visible; }
    :host([indeterminate]) .dash { visibility: visible; }
    :host([indeterminate]) .check { visibility: hidden; }

    :host(:focus-visible) .box {
      box-shadow: var(--ce-focus-ring);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: Boolean, reflect: true }) checked = false;
  @property({ type: Boolean, reflect: true }) indeterminate = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: String }) label = "";
  @property({ type: String }) name = "";
  @property({ type: String }) value = "";

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "checkbox");
    if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
    this.#updateAria();
    this.addEventListener("click", this.#onClick);
    this.addEventListener("keydown", this.#onKey);
  }

  override updated() {
    this.#updateAria();
  }

  #updateAria(): void {
    if (this.indeterminate) this.setAttribute("aria-checked", "mixed");
    else this.setAttribute("aria-checked", String(this.checked));
  }

  #toggle(): void {
    if (this.disabled) return;
    if (this.indeterminate) {
      this.indeterminate = false;
      this.checked = true;
    } else {
      this.checked = !this.checked;
    }
    this.dispatchEvent(
      new CustomEvent("ce-change", {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked },
      })
    );
  }

  #onClick = (_e: Event) => this.#toggle();
  #onKey = (e: KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      this.#toggle();
    }
  };

  override render() {
    return html`
      <span class="box" aria-hidden="true">
        <svg viewBox="0 0 14 14" width="14" height="14">
          <path class="check" d="M3 7.5 L6 10 L11 4" />
          <line class="dash" x1="3" y1="7" x2="11" y2="7" />
        </svg>
      </span>
      ${this.label ? html`<span>${this.label}</span>` : ""}
      <slot></slot>
    `;
  }
}
