import { html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<lesson-confidence>` — 1-5 confidence rating widget for metacognitive awareness.
 *
 * Attributes:
 *   label     — prompt text (default: "How confident are you?")
 *   submitted — boolean (reflect); auto-set after rating
 *
 * Events:
 *   lesson-confidence-rate — { rating: number }
 *
 * Methods:
 *   reset() — clears rating, removes submitted
 */
export class LessonConfidence extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-4) var(--ce-space-5);
      margin: var(--ce-space-3) 0;
    }
    .lco-label {
      font-size: var(--ce-text-sm);
      color: var(--ce-muted);
      margin-bottom: var(--ce-space-3);
    }
    .lco-buttons {
      display: flex;
      gap: var(--ce-space-2);
      align-items: center;
    }
    .lco-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid var(--ce-border);
      background: var(--ce-surface-2);
      color: var(--ce-text);
      font-weight: 700;
      font-size: var(--ce-text-sm);
      cursor: pointer;
      transition: all var(--ce-transition-fast);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .lco-btn:hover:not(:disabled) {
      border-color: var(--ce-color-blue);
    }
    .lco-btn.selected {
      background: var(--ce-color-blue);
      border-color: var(--ce-color-blue);
      color: var(--ce-text-inverse);
    }
    .lco-btn:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .lco-btn.selected:disabled {
      opacity: 1;
    }
    .lco-scale {
      display: flex;
      justify-content: space-between;
      margin-top: var(--ce-space-1);
    }
    .lco-scale-label {
      font-size: var(--ce-text-xs);
      color: var(--ce-muted);
    }
    .lco-result {
      margin-top: var(--ce-space-2);
      font-size: var(--ce-text-sm);
      color: var(--ce-color-blue);
      font-weight: 600;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) label = "How confident are you?";
  @property({ type: Boolean, reflect: true }) submitted = false;

  @state() private _rating = 0;

  reset(): void {
    this._rating = 0;
    this.submitted = false;
    this.requestUpdate();
  }

  #pick(rating: number): void {
    if (this.submitted) return;
    this._rating = rating;
    this.submitted = true;
    this.dispatchEvent(
      new CustomEvent("lesson-confidence-rate", {
        bubbles: true,
        composed: true,
        detail: { rating },
      })
    );
  }

  override render() {
    return html`
      <div class="lco-label">${this.label}</div>
      <div class="lco-buttons">
        ${[1, 2, 3, 4, 5].map(
          (n) => html`
            <button
              type="button"
              class="lco-btn${this._rating === n ? " selected" : ""}"
              ?disabled=${this.submitted}
              @click=${() => this.#pick(n)}
            >${n}</button>
          `
        )}
      </div>
      <div class="lco-scale">
        <span class="lco-scale-label">Not sure</span>
        <span class="lco-scale-label">Very sure</span>
      </div>
      ${this.submitted
        ? html`<div class="lco-result">Rated: ${this._rating}/5</div>`
        : nothing}
    `;
  }
}
