import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, jsonProp } from "../core/index.js";

/**
 * `<lesson-quiz>` — multiple-choice question with instant feedback.
 *
 * Provide:
 *   question — the question text
 *   options  — string[]
 *   correct  — index of the correct option
 *   explanation — shown after user picks
 *
 * Events:
 *   lesson-quiz-answer — { index, correct }
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

  @state() private _picked: number | null = null;

  reset(): void {
    this._picked = null;
  }

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
        : ""}
    `;
  }
}
