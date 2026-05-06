import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

/**
 * `<lesson-gap>` — fill-in-the-blank exercise.
 *
 * Provide:
 *   prompt   — the sentence with one literal placeholder marked as "___"
 *              (or pass via slot)
 *   options  — array of strings (the choices)
 *   correct  — the correct option (must be present in options)
 *   explanation — text shown when the user picks the correct answer
 *
 * Events:
 *   lesson-gap-answer — { value, correct: boolean }
 */
export class LessonGap extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-4) var(--ce-space-5);
      margin: var(--ce-space-3) 0;
    }
    .lg-prompt {
      font-size: var(--ce-text-md);
      color: var(--ce-text);
      margin-bottom: var(--ce-space-3);
      line-height: var(--ce-line-relaxed);
    }
    .lg-prompt .lg-blank {
      display: inline-block;
      min-width: 60px;
      border-bottom: 2px dashed var(--ce-color-amber);
      color: var(--ce-color-amber);
      text-align: center;
      padding: 0 6px;
    }
    .lg-prompt .lg-blank.filled { border-style: solid; color: var(--ce-text); }
    .lg-options { display: flex; flex-wrap: wrap; gap: var(--ce-space-2); }
    .lg-opt {
      background: var(--ce-surface-2);
      border: 1px solid var(--ce-border);
      color: var(--ce-text);
      padding: 6px 14px;
      border-radius: var(--ce-radius-sm);
      cursor: pointer;
      font: inherit;
      font-size: var(--ce-text-sm);
      transition: all var(--ce-transition-fast);
    }
    .lg-opt:hover { border-color: var(--ce-color-blue); }
    .lg-opt.correct {
      background: var(--ce-color-green);
      color: var(--ce-text-inverse);
      border-color: var(--ce-color-green);
    }
    .lg-opt.wrong {
      background: var(--ce-color-red);
      color: var(--ce-text-inverse);
      border-color: var(--ce-color-red);
    }
    .lg-opt:disabled { cursor: default; opacity: 0.85; }

    .lg-feedback {
      margin-top: var(--ce-space-3);
      padding: var(--ce-space-2) var(--ce-space-3);
      border-radius: var(--ce-radius-sm);
      font-size: var(--ce-text-sm);
      border-left: 3px solid var(--ce-border);
    }
    .lg-feedback.ok {
      border-color: var(--ce-color-green);
      background: var(--ce-color-green-bg);
      color: var(--ce-color-green);
    }
    .lg-feedback.bad {
      border-color: var(--ce-color-red);
      background: var(--ce-color-red-bg);
      color: var(--ce-color-red);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) prompt = "";
  @property(jsonProp<string[]>([], "options")) options: string[] = [];
  @property({ type: String }) correct = "";
  @property({ type: String }) explanation = "";

  @state() private _picked: string | null = null;
  @state() private _isCorrect = false;

  reset(): void {
    this._picked = null;
    this._isCorrect = false;
  }

  #pick(opt: string): void {
    if (this._picked) return;
    this._picked = opt;
    this._isCorrect = opt === this.correct;
    this.dispatchEvent(
      new CustomEvent("lesson-gap-answer", {
        bubbles: true,
        composed: true,
        detail: { value: opt, correct: this._isCorrect },
      })
    );
  }

  #renderPrompt() {
    const blankClass = this._picked ? "lg-blank filled" : "lg-blank";
    const filled = this._isCorrect ? this._picked : "___";
    const parts = this.prompt.split("___");
    if (parts.length < 2) {
      return html`${this.prompt}`;
    }
    return html`${parts[0]}<span class=${blankClass}>${filled}</span>${parts.slice(1).join("___")}`;
  }

  override render() {
    return html`
      <div class="lg-prompt">${this.prompt ? this.#renderPrompt() : html`<slot></slot>`}</div>
      <div class="lg-options">
        ${this.options.map((opt) => {
          const cls =
            this._picked === opt ? (this._isCorrect ? "lg-opt correct" : "lg-opt wrong") : "lg-opt";
          return html`<button
            type="button"
            class=${cls}
            ?disabled=${this._picked !== null}
            @click=${() => this.#pick(opt)}
          >${opt}</button>`;
        })}
      </div>
      ${this._picked === null
        ? ""
        : this._isCorrect
        ? html`<div class="lg-feedback ok">✓ Correct${this.explanation ? html` — ${this.explanation}` : ""}</div>`
        : html`<div class="lg-feedback bad">✗ Try again. Correct: <b>${this.correct}</b>${this.explanation ? html` — ${this.explanation}` : ""}</div>`}
    `;
  }
}
