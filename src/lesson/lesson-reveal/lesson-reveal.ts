import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<lesson-reveal>` — flashcard that reveals the back on click.
 *
 * Attributes:
 *   front       — question or term text
 *   back        — answer or definition text
 *   front-label — label above front (default: "Question")
 *   back-label  — label above back (default: "Answer")
 *
 * Events:
 *   lesson-reveal-flip — { flipped: boolean }
 *
 * Methods:
 *   reset() — returns to front state
 */
export class LessonReveal extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-5);
      margin: var(--ce-space-3) 0;
      cursor: pointer;
      user-select: none;
    }
    :host(:hover) {
      border-color: var(--ce-color-blue);
    }
    :host([data-flipped]) {
      border-color: var(--ce-color-green);
    }
    .lr2-label {
      font-size: var(--ce-text-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--ce-muted);
      margin-bottom: var(--ce-space-2);
      font-weight: 700;
    }
    .lr2-label.back {
      color: var(--ce-color-green);
    }
    .lr2-text {
      font-size: var(--ce-text-lg);
      color: var(--ce-text);
      line-height: var(--ce-line-relaxed);
    }
    .lr2-hint {
      margin-top: var(--ce-space-3);
      font-size: var(--ce-text-xs);
      color: var(--ce-muted);
      text-align: right;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) front = "";
  @property({ type: String }) back = "";
  @property({ type: String, attribute: "front-label" }) frontLabel = "Question";
  @property({ type: String, attribute: "back-label" }) backLabel = "Answer";

  @state() private _flipped = false;

  reset(): void {
    this._flipped = false;
    this.removeAttribute("data-flipped");
    this.requestUpdate();
  }

  #handleClick(): void {
    this._flipped = !this._flipped;
    if (this._flipped) {
      this.setAttribute("data-flipped", "");
    } else {
      this.removeAttribute("data-flipped");
    }
    this.dispatchEvent(
      new CustomEvent("lesson-reveal-flip", {
        bubbles: true,
        composed: true,
        detail: { flipped: this._flipped },
      })
    );
  }

  override render() {
    if (this._flipped) {
      return html`
        <div class="lr2-label back">${this.backLabel}</div>
        <div class="lr2-text">${this.back}</div>
        <div class="lr2-hint">← Click to reset</div>
      `;
    }
    return html`
      <div class="lr2-label">${this.frontLabel}</div>
      <div class="lr2-text">${this.front}</div>
      <div class="lr2-hint">Click to reveal →</div>
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
