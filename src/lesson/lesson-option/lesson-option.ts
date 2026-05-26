import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<lesson-option>` — single multiple-choice answer choice.
 *
 * Designed as a slotted child of `<lesson-question>`. The wrapping question
 * sets `interactive`, `picked`, and `revealed` on each option to drive
 * presentation; `lesson-option` itself emits `lesson-option-pick` on click
 * when it is interactive and not yet picked.
 *
 * Attributes:
 *   correct      — boolean; this option is the correct answer
 *   value        — opaque string id (defaults to text content for events)
 *   interactive  — boolean; render as a clickable button
 *   picked       — boolean (reflect); learner has chosen this option
 *   revealed     — boolean (reflect); show correct/wrong marking
 *
 * Events:
 *   lesson-option-pick — { value, correct }; bubbles + composed
 */
export class LessonOption extends CecElement {
  static override styles = css`
    :host {
      display: block;
    }
    .lo-row {
      display: flex;
      gap: var(--ce-space-3);
      align-items: baseline;
      padding: var(--ce-space-2) var(--ce-space-3);
      border-radius: var(--ce-radius-sm);
      border: 1px solid transparent;
      color: var(--ce-text);
      font: inherit;
      font-size: var(--ce-text-sm);
      background: transparent;
    }
    .lo-marker {
      flex: 0 0 auto;
      color: var(--ce-muted);
      width: 1.25em;
      text-align: center;
    }
    .lo-body {
      flex: 1 1 auto;
      text-align: left;
    }
    .lo-tag {
      flex: 0 0 auto;
      font-size: var(--ce-text-xs);
      color: var(--ce-muted);
    }
    button.lo-row {
      width: 100%;
      cursor: pointer;
      background: var(--ce-bg);
      border-color: var(--ce-border);
      transition: border-color var(--ce-transition-fast);
    }
    button.lo-row:hover:not(:disabled) {
      border-color: var(--ce-color-blue);
    }
    button.lo-row:disabled {
      cursor: default;
    }
    :host([revealed][correct]) .lo-row {
      background: var(--ce-color-green-bg);
      border-color: var(--ce-color-green);
    }
    :host([revealed][correct]) .lo-marker,
    :host([revealed][correct]) .lo-tag {
      color: var(--ce-color-green);
    }
    :host([picked]:not([correct])) .lo-row {
      background: var(--ce-color-red-bg);
      border-color: var(--ce-color-red);
    }
    :host([picked]:not([correct])) .lo-marker {
      color: var(--ce-color-red);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: Boolean, reflect: true }) correct = false;
  @property({ type: String }) value = "";
  @property({ type: Boolean, reflect: true }) interactive = false;
  @property({ type: Boolean, reflect: true }) picked = false;
  @property({ type: Boolean, reflect: true }) revealed = false;

  #onClick = (): void => {
    if (!this.interactive || this.picked || this.revealed) return;
    this.dispatchEvent(
      new CustomEvent("lesson-option-pick", {
        bubbles: true,
        composed: true,
        detail: { value: this.value || (this.textContent ?? "").trim(), correct: this.correct },
      })
    );
  };

  #marker(): string {
    if (this.picked && !this.correct) return "✗";
    if (this.revealed && this.correct) return "✓";
    return "○";
  }

  override render() {
    const tag =
      this.revealed && this.correct
        ? html`<span class="lo-tag">correct</span>`
        : "";
    const inner = html`
      <span class="lo-marker" aria-hidden="true">${this.#marker()}</span>
      <span class="lo-body"><slot></slot></span>
      ${tag}
    `;
    if (this.interactive) {
      return html`<button
        type="button"
        class="lo-row"
        ?disabled=${this.picked || this.revealed}
        @click=${this.#onClick}
      >${inner}</button>`;
    }
    return html`<div class="lo-row">${inner}</div>`;
  }
}
