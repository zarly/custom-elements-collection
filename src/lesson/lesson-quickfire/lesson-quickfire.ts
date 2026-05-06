import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

export interface QuickfireRound {
  /** Prompt text. Use ___ for blank-style. */
  prompt: string;
  options: string[];
  correct: string;
}

/**
 * `<lesson-quickfire>` — timed practice. Shows rounds in sequence,
 * tracks score, displays a timer per round.
 *
 * Provide:
 *   rounds   — QuickfireRound[]
 *   timer    — seconds per round (default 8)
 *
 * Events:
 *   lesson-quickfire-done — { score, total }
 */
export class LessonQuickfire extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-5);
      margin: var(--ce-space-3) 0;
    }
    .qf-meta {
      display: flex;
      justify-content: space-between;
      font-size: var(--ce-text-xs);
      color: var(--ce-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: var(--ce-space-2);
    }
    .qf-prompt {
      font-size: var(--ce-text-lg);
      font-weight: 700;
      text-align: center;
      margin: var(--ce-space-3) 0;
      color: var(--ce-text);
    }
    .qf-opts { display: flex; gap: var(--ce-space-2); justify-content: center; flex-wrap: wrap; }
    .qf-btn {
      background: var(--ce-surface-2);
      border: 2px solid var(--ce-border);
      color: var(--ce-text);
      padding: 10px 22px;
      border-radius: var(--ce-radius-sm);
      cursor: pointer;
      font: inherit;
      font-weight: 600;
      transition: all var(--ce-transition-fast);
    }
    .qf-btn:hover { border-color: var(--ce-color-blue); }
    .qf-btn.flash-correct { background: var(--ce-color-green); color: var(--ce-text-inverse); border-color: var(--ce-color-green); }
    .qf-btn.flash-wrong { background: var(--ce-color-red); color: var(--ce-text-inverse); border-color: var(--ce-color-red); }
    .qf-timer {
      height: 4px;
      background: var(--ce-border-soft);
      border-radius: 2px;
      overflow: hidden;
      margin-top: var(--ce-space-3);
    }
    .qf-timer-fill {
      height: 100%;
      background: var(--ce-color-cyan);
      transition: width 0.1s linear;
    }
    .qf-done {
      text-align: center;
      padding: var(--ce-space-5);
    }
    .qf-score {
      font-size: var(--ce-text-3xl);
      font-weight: 800;
      color: var(--ce-color-green);
    }
    .qf-restart {
      margin-top: var(--ce-space-4);
      background: var(--ce-color-blue);
      color: var(--ce-text-inverse);
      border: none;
      padding: 8px 18px;
      border-radius: var(--ce-radius-sm);
      cursor: pointer;
      font: inherit;
      font-weight: 600;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property(jsonProp<QuickfireRound[]>([], "rounds")) rounds: QuickfireRound[] = [];
  @property({ type: Number }) timer = 8;

  @state() private _idx = 0;
  @state() private _score = 0;
  @state() private _flash: { value: string; correct: boolean } | null = null;
  @state() private _timeLeft = 0;
  @state() private _done = false;

  #intervalId: ReturnType<typeof setInterval> | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.#startRound();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#stopTimer();
  }

  reset(): void {
    this._idx = 0;
    this._score = 0;
    this._done = false;
    this._flash = null;
    this.#startRound();
  }

  #startRound(): void {
    if (this.rounds.length === 0) {
      this._done = true;
      return;
    }
    this._timeLeft = this.timer;
    this.#stopTimer();
    this.#intervalId = setInterval(() => {
      this._timeLeft -= 0.1;
      if (this._timeLeft <= 0) {
        this.#advance();
      }
    }, 100);
  }

  #stopTimer(): void {
    if (this.#intervalId !== null) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
    }
  }

  #pick(opt: string): void {
    const round = this.rounds[this._idx];
    if (!round) return;
    const isCorrect = opt === round.correct;
    if (isCorrect) this._score++;
    this._flash = { value: opt, correct: isCorrect };
    this.#stopTimer();
    setTimeout(() => this.#advance(), 600);
  }

  #advance(): void {
    this.#stopTimer();
    this._flash = null;
    if (this._idx + 1 >= this.rounds.length) {
      this._done = true;
      this.dispatchEvent(
        new CustomEvent("lesson-quickfire-done", {
          bubbles: true,
          composed: true,
          detail: { score: this._score, total: this.rounds.length },
        })
      );
      return;
    }
    this._idx++;
    this.#startRound();
  }

  override render() {
    if (this._done) {
      return html`
        <div class="qf-done">
          <div class="qf-meta">Quickfire complete</div>
          <div class="qf-score">${this._score} / ${this.rounds.length}</div>
          <button class="qf-restart" type="button" @click=${() => this.reset()}>
            Try again
          </button>
        </div>
      `;
    }
    const round = this.rounds[this._idx];
    if (!round) return html``;
    const timerPct = Math.max(0, (this._timeLeft / this.timer) * 100);
    return html`
      <div class="qf-meta">
        <span>Round ${this._idx + 1} / ${this.rounds.length}</span>
        <span>Score ${this._score}</span>
      </div>
      <div class="qf-prompt">${round.prompt}</div>
      <div class="qf-opts">
        ${round.options.map((opt) => {
          let cls = "qf-btn";
          if (this._flash) {
            if (this._flash.value === opt) {
              cls += this._flash.correct ? " flash-correct" : " flash-wrong";
            }
          }
          return html`<button
            type="button"
            class=${cls}
            ?disabled=${this._flash !== null}
            @click=${() => this.#pick(opt)}
          >${opt}</button>`;
        })}
      </div>
      <div class="qf-timer"><div class="qf-timer-fill" style="width:${timerPct}%"></div></div>
    `;
  }
}
