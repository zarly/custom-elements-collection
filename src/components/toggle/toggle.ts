import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-toggle>` — switch (on/off).
 *
 * Attributes:
 *   checked  — boolean
 *   disabled — boolean
 *   label    — string (rendered next to the switch)
 *   name     — form-control name (reserved for future form-association)
 *
 * Events: ce-change — { checked }
 */
export class CeToggle extends CecElement {
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
    :host([disabled]) {
      cursor: not-allowed;
      opacity: 0.55;
    }
    .track {
      position: relative;
      width: 36px;
      height: 20px;
      background: var(--ce-surface-3);
      border: 1px solid var(--ce-border);
      border-radius: 999px;
      transition: background var(--ce-transition), border-color var(--ce-transition);
      flex: 0 0 auto;
    }
    .knob {
      position: absolute;
      top: 1px;
      left: 1px;
      width: 16px;
      height: 16px;
      background: var(--ce-text);
      border-radius: 50%;
      transition: transform var(--ce-transition);
    }
    :host([checked]) .track {
      background: var(--ce-color-blue);
      border-color: var(--ce-color-blue);
    }
    :host([checked]) .knob {
      transform: translateX(16px);
      /* stylelint-disable-next-line color-no-hex -- on-accent knob; always contrasts against saturated blue track */
      background: #fff;
    }
    :host(:focus-visible) .track {
      box-shadow: var(--ce-focus-ring);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: Boolean, reflect: true }) checked = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: String }) label = "";
  @property({ type: String }) name = "";

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
    this.setAttribute("role", "switch");
    this.setAttribute("aria-checked", String(this.checked));
    this.addEventListener("click", this.#onClick);
    this.addEventListener("keydown", this.#onKey);
  }

  override updated() {
    this.setAttribute("aria-checked", String(this.checked));
  }

  #toggle(): void {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.dispatchEvent(
      new CustomEvent("ce-change", {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked },
      })
    );
  }

  #onClick = (_e: Event): void => this.#toggle();

  #onKey = (e: KeyboardEvent): void => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      this.#toggle();
    }
  };

  override render() {
    return html`
      <span class="track" aria-hidden="true">
        <span class="knob"></span>
      </span>
      ${this.label ? html`<span>${this.label}</span>` : ""}
      <slot></slot>
    `;
  }
}
