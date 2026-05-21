import { html, css, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-suggestion-chip>` — tappable follow-up-prompt chip.
 *
 * Emits `ce-suggestion-select` when selected (click or Enter/Space).
 * Distinct from `<ce-chip>` which is a non-interactive status display.
 *
 * Attributes:
 *   value    — payload in the emitted event; falls back to trimmed textContent
 *   disabled — non-interactive; greyed out
 *   selected — visually highlighted (already chosen)
 *   icon     — optional leading emoji or short text rendered before the slot
 *
 * Slots:
 *   (default) — chip label text (the prompt)
 *   icon      — overrides the `icon` attribute with richer content (SVG etc.)
 *
 * Events:
 *   ce-suggestion-select — { value: string }; bubbles, composed
 */
export class CeSuggestionChip extends CecElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-2);
      padding: var(--ce-inset-xs) var(--ce-space-3);
      border-radius: var(--ce-radius-pill);
      border: 1px solid var(--ce-border);
      background: var(--ce-surface-2);
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
      font-family: var(--ce-font-sans);
      line-height: var(--ce-line-snug);
      white-space: nowrap;
      cursor: pointer;
      transition:
        background var(--ce-transition-fast),
        border-color var(--ce-transition-fast),
        color var(--ce-transition-fast);
      user-select: none;
    }

    :host(:hover:not([disabled])) {
      background: var(--ce-state-hover);
      border-color: var(--ce-color-blue);
    }

    :host(:focus-visible) {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }

    :host([selected]) {
      background: var(--ce-color-blue-bg);
      border-color: var(--ce-color-blue-border);
      color: var(--ce-color-blue);
    }

    :host([disabled]) {
      opacity: 0.55;
      cursor: not-allowed;
      pointer-events: none;
    }

    .ce-sc__icon {
      display: inline-flex;
      align-items: center;
      flex: 0 0 auto;
      font-style: normal;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String })
  value = "";

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  selected = false;

  @property({ type: String })
  icon = "";

  override connectedCallback(): void {
    super.connectedCallback();
    this.#syncA11y();
    this.addEventListener("click", this.#onClick);
    this.addEventListener("keydown", this.#onKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("click", this.#onClick);
    this.removeEventListener("keydown", this.#onKeyDown);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("disabled")) {
      this.#syncA11y();
    }
  }

  #syncA11y(): void {
    // role=button is always present — required for AT regardless of state
    this.setAttribute("role", "button");
    if (this.disabled) {
      this.setAttribute("aria-disabled", "true");
      this.removeAttribute("tabindex");
    } else {
      this.setAttribute("tabindex", "0");
      this.removeAttribute("aria-disabled");
    }
  }

  override render() {
    return html`
      <slot name="icon">
        ${this.icon
          ? html`<span class="ce-sc__icon" aria-hidden="true">${this.icon}</span>`
          : ""}
      </slot>
      <slot></slot>
    `;
  }

  #resolveValue(): string {
    return this.value.trim() !== ""
      ? this.value
      : (this.textContent ?? "").trim();
  }

  #onClick = (): void => {
    if (this.disabled) return;
    this.#emit();
  };

  #onKeyDown = (e: KeyboardEvent): void => {
    if (this.disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.#emit();
    }
  };

  #emit(): void {
    this.dispatchEvent(
      new CustomEvent("ce-suggestion-select", {
        bubbles: true,
        composed: true,
        detail: { value: this.#resolveValue() },
      })
    );
  }
}
