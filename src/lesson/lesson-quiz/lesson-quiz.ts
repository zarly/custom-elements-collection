import { html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

/**
 * `<lesson-quiz>` — multiple-choice quiz.
 *
 * Two shapes:
 *
 * 1. **Single-question (attribute) shape** — set the `question`, `options`,
 *    `correct`, and `explanation` attributes. The quiz renders one question
 *    inline and fires `lesson-quiz-answer` on pick.
 *
 * 2. **Multi-question (slotted) shape** — leave `question` empty and slot
 *    one or more `<lesson-question>` children. Each question manages its
 *    own answer state. Setting `interactive` on the quiz cascades to all
 *    `<lesson-question>` descendants so authors can opt the whole batch
 *    in (CDR-004).
 *
 * Events:
 *   lesson-quiz-answer — { index, correct } (single-question shape only)
 */
export class LessonQuiz extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-4) var(--ce-space-5);
      margin: var(--ce-space-3) 0;
    }
    :host([container]) {
      background: transparent;
      border: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--ce-space-3);
    }
    .lq-q {
      font-weight: 700;
      font-size: var(--ce-text-md);
      margin-bottom: var(--ce-space-3);
      color: var(--ce-text);
    }
    .lq-opts { display: flex; flex-direction: column; gap: var(--ce-space-2); }
    .lq-opt {
      background: var(--ce-bg);
      border: 1px solid var(--ce-border);
      color: var(--ce-text);
      text-align: left;
      padding: var(--ce-space-2) var(--ce-space-4);
      border-radius: var(--ce-radius-sm);
      cursor: pointer;
      font: inherit;
      transition: border-color var(--ce-transition-fast);
    }
    .lq-opt:hover { border-color: var(--ce-color-blue); }
    .lq-opt.correct {
      border-color: var(--ce-color-green);
      background: var(--ce-color-green-bg);
    }
    .lq-opt.wrong {
      border-color: var(--ce-color-red);
      background: var(--ce-color-red-bg);
    }
    .lq-opt.shown-correct {
      border-color: var(--ce-color-green);
      outline: 2px dashed var(--ce-color-green);
    }
    .lq-opt:disabled { cursor: default; }

    .lq-explain {
      margin-top: var(--ce-space-3);
      padding-top: var(--ce-space-3);
      border-top: 1px solid var(--ce-border-soft);
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) question = "";
  @property(jsonProp<string[]>([], "options")) options: string[] = [];
  @property({ type: Number }) correct = 0;
  @property({ type: String }) explanation = "";
  @property({ type: Boolean, reflect: true }) interactive = false;
  @property({ type: Boolean, reflect: true }) container = false;

  @state() private _picked: number | null = null;

  override updated(changed: Map<string, unknown>): void {
    if (changed.has("question")) {
      this.container = !this.question;
    }
    if (changed.has("interactive")) {
      this.#cascadeInteractive();
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.container = !this.question;
  }

  reset(): void {
    this._picked = null;
  }

  #cascadeInteractive(): void {
    for (const q of this.querySelectorAll(":scope > lesson-question")) {
      if (this.interactive) {
        q.setAttribute("interactive", "");
      } else {
        q.removeAttribute("interactive");
      }
    }
  }

  #onSlotChange = (): void => {
    this.#cascadeInteractive();
  };

  #pick(i: number): void {
    if (this._picked !== null) return;
    this._picked = i;
    this.dispatchEvent(
      new CustomEvent("lesson-quiz-answer", {
        bubbles: true,
        composed: true,
        detail: { index: i, correct: i === this.correct },
      })
    );
  }

  override render() {
    // Container shape — no question attribute set, render slotted children
    // (lesson-question, narrative HTML, etc.) per CDR-006 composition.
    if (!this.question) {
      return html`<slot @slotchange=${this.#onSlotChange}></slot>`;
    }
    return html`
      <div class="lq-q">${this.question}</div>
      <div class="lq-opts">
        ${this.options.map((opt, i) => {
          let cls = "lq-opt";
          if (this._picked !== null) {
            if (i === this._picked) cls += i === this.correct ? " correct" : " wrong";
            else if (i === this.correct) cls += " shown-correct";
          }
          return html`<button
            type="button"
            class=${cls}
            ?disabled=${this._picked !== null}
            @click=${() => this.#pick(i)}
          >${opt}</button>`;
        })}
      </div>
      ${this._picked !== null && this.explanation
        ? html`<div class="lq-explain">${this.explanation}</div>`
        : nothing}
    `;
  }
}
