import { html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<lesson-myth>` — myth-busting card: presents a misconception, reveals the truth on click.
 *
 * Attributes:
 *   myth        — the false belief
 *   truth       — the correct statement
 *   explanation — optional longer explanation (shown below truth after reveal)
 *
 * Events:
 *   lesson-myth-reveal — {} — fires when truth is first revealed
 *
 * Methods:
 *   reset() — returns to myth view
 */
export class LessonMyth extends CecElement {
  static override styles = css`
    :host {
      display: block;
      margin: var(--ce-space-3) 0;
      cursor: pointer;
    }
    :host([data-revealed]) {
      cursor: default;
    }
    .lm-card {
      border-radius: var(--ce-radius);
      padding: var(--ce-space-5);
      transition: all var(--ce-transition-fast);
    }
    .lm-card.myth-view {
      background: var(--ce-color-red-bg);
      border: 1px solid var(--ce-color-red);
    }
    .lm-card.truth-view {
      background: var(--ce-color-green-bg);
      border: 1px solid var(--ce-color-green);
      cursor: default;
    }
    .lm-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      font-size: var(--ce-text-sm);
      margin-bottom: var(--ce-space-2);
    }
    .lm-badge.myth {
      color: var(--ce-color-red);
    }
    .lm-badge.truth {
      color: var(--ce-color-green);
    }
    .lm-text {
      font-size: var(--ce-text-md);
      color: var(--ce-text);
    }
    .lm-explanation {
      margin-top: var(--ce-space-3);
      font-size: var(--ce-text-sm);
      color: var(--ce-muted);
      border-top: 1px solid var(--ce-border-soft);
      padding-top: var(--ce-space-2);
    }
    .lm-prompt {
      margin-top: var(--ce-space-3);
      font-size: var(--ce-text-xs);
      color: var(--ce-muted);
      text-align: right;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) myth = "";
  @property({ type: String }) truth = "";
  @property({ type: String }) explanation = "";

  @state() private _revealed = false;
  #firedReveal = false;

  reset(): void {
    this._revealed = false;
    this.#firedReveal = false;
    this.removeAttribute("data-revealed");
    this.requestUpdate();
  }

  #handleClick(): void {
    if (this._revealed) return;
    this._revealed = true;
    this.setAttribute("data-revealed", "");
    if (!this.#firedReveal) {
      this.#firedReveal = true;
      this.dispatchEvent(
        new CustomEvent("lesson-myth-reveal", {
          bubbles: true,
          composed: true,
          detail: {},
        })
      );
    }
  }

  override render() {
    if (this._revealed) {
      return html`
        <div class="lm-card truth-view">
          <div class="lm-badge truth">✓ Truth</div>
          <div class="lm-text">${this.truth}</div>
          ${this.explanation
            ? html`<div class="lm-explanation">${this.explanation}</div>`
            : nothing}
        </div>
      `;
    }
    return html`
      <div class="lm-card myth-view">
        <div class="lm-badge myth">✗ Myth</div>
        <div class="lm-text">${this.myth}</div>
        <div class="lm-prompt">Tap to reveal the truth →</div>
      </div>
    `;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("click", this.#handleClick.bind(this));
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("click", this.#handleClick.bind(this));
  }
}
