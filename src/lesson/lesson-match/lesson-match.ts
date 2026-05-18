import { html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

/**
 * `<lesson-match>` — pair-matching exercise.
 *
 * The learner clicks one item from the left column, then one from the right
 * column. A correct pair locks in green; an incorrect pair flashes red and
 * resets. Once every pair is matched, `submitted` reflects on the host and
 * `lesson-match-complete` fires once.
 *
 * Attributes:
 *   pairs       — JSON [{left, right}, ...]
 *   left-label  — optional column header (default: "")
 *   right-label — optional column header (default: "")
 *   submitted   — boolean (reflect); auto-set when all pairs matched
 *
 * Events:
 *   lesson-match-pair     — { left, right, correct }   per attempt
 *   lesson-match-complete — { attempts: number }       once, after final pair
 */
type Pair = { left: string; right: string };

export class LessonMatch extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-4) var(--ce-space-5);
      margin: var(--ce-space-3) 0;
    }
    .lm-head {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--ce-space-4);
      margin-bottom: var(--ce-space-3);
    }
    .lm-col-label {
      font-size: var(--ce-text-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--ce-muted);
      font-weight: 700;
    }
    .lm-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--ce-space-3) var(--ce-space-4);
    }
    .lm-col {
      display: flex;
      flex-direction: column;
      gap: var(--ce-space-2);
    }
    .lm-item {
      display: block;
      width: 100%;
      text-align: left;
      padding: var(--ce-space-3) var(--ce-space-4);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-sm);
      background: var(--ce-surface-2);
      color: var(--ce-text);
      font: inherit;
      font-size: var(--ce-text-sm);
      cursor: pointer;
      transition: all var(--ce-transition-fast);
    }
    .lm-item:hover:not(:disabled) {
      border-color: var(--ce-color-blue);
    }
    .lm-item.selected {
      border-color: var(--ce-color-blue);
      background: var(--ce-color-blue);
      color: var(--ce-text-inverse);
    }
    .lm-item.correct {
      border-color: var(--ce-color-green);
      background: var(--ce-color-green);
      color: var(--ce-text-inverse);
      cursor: default;
    }
    .lm-item.wrong {
      border-color: var(--ce-color-red);
      background: var(--ce-color-red);
      color: var(--ce-text-inverse);
    }
    .lm-item:disabled {
      opacity: 0.55;
      cursor: default;
    }
    .lm-item.correct:disabled {
      opacity: 1;
    }
    .lm-result {
      margin-top: var(--ce-space-3);
      font-size: var(--ce-text-sm);
      color: var(--ce-color-green);
      font-weight: 600;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property(jsonProp<Pair[]>([], "pairs")) pairs: Pair[] = [];
  @property({ type: String, attribute: "left-label" }) leftLabel = "";
  @property({ type: String, attribute: "right-label" }) rightLabel = "";
  @property({ type: Boolean, reflect: true }) submitted = false;

  @state() private _selectedLeft: string | null = null;
  @state() private _selectedRight: string | null = null;
  @state() private _matched = new Set<string>();
  @state() private _wrongLeft: string | null = null;
  @state() private _wrongRight: string | null = null;
  @state() private _attempts = 0;

  reset(): void {
    this._selectedLeft = null;
    this._selectedRight = null;
    this._matched = new Set<string>();
    this._wrongLeft = null;
    this._wrongRight = null;
    this._attempts = 0;
    this.submitted = false;
    this.requestUpdate();
  }

  #shuffleSeed(items: string[]): string[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor((Math.sin(i * 9301) + 1) * (i + 1) / 2);
      const k = Math.min(i, Math.max(0, j));
      [out[i], out[k]] = [out[k], out[i]];
    }
    return out;
  }

  #pickLeft(left: string): void {
    if (this.submitted) return;
    if (this._matched.has(left)) return;
    this._wrongLeft = null;
    this._wrongRight = null;
    this._selectedLeft = left;
    this.#tryResolve();
  }

  #pickRight(right: string): void {
    if (this.submitted) return;
    if (this.#isRightMatched(right)) return;
    this._wrongLeft = null;
    this._wrongRight = null;
    this._selectedRight = right;
    this.#tryResolve();
  }

  #isRightMatched(right: string): boolean {
    for (const p of this.pairs) {
      if (this._matched.has(p.left) && p.right === right) return true;
    }
    return false;
  }

  #tryResolve(): void {
    if (this._selectedLeft == null || this._selectedRight == null) return;
    const left = this._selectedLeft;
    const right = this._selectedRight;
    this._attempts += 1;
    const pair = this.pairs.find((p) => p.left === left);
    const correct = pair !== undefined && pair.right === right;

    this.dispatchEvent(
      new CustomEvent("lesson-match-pair", {
        bubbles: true,
        composed: true,
        detail: { left, right, correct },
      })
    );

    if (correct) {
      this._matched = new Set([...this._matched, left]);
      this._selectedLeft = null;
      this._selectedRight = null;
      if (this._matched.size === this.pairs.length) {
        this.submitted = true;
        this.dispatchEvent(
          new CustomEvent("lesson-match-complete", {
            bubbles: true,
            composed: true,
            detail: { attempts: this._attempts },
          })
        );
      }
    } else {
      this._wrongLeft = left;
      this._wrongRight = right;
      this._selectedLeft = null;
      this._selectedRight = null;
    }
  }

  override render() {
    if (!this.pairs.length) return nothing;

    const lefts = this.pairs.map((p) => p.left);
    const rights = this.#shuffleSeed(this.pairs.map((p) => p.right));

    const leftClass = (item: string): string => {
      if (this._matched.has(item)) return " correct";
      if (this._wrongLeft === item) return " wrong";
      if (this._selectedLeft === item) return " selected";
      return "";
    };
    const rightClass = (item: string): string => {
      if (this.#isRightMatched(item)) return " correct";
      if (this._wrongRight === item) return " wrong";
      if (this._selectedRight === item) return " selected";
      return "";
    };

    return html`
      ${this.leftLabel || this.rightLabel
        ? html`
          <div class="lm-head">
            <div class="lm-col-label">${this.leftLabel}</div>
            <div class="lm-col-label">${this.rightLabel}</div>
          </div>
        `
        : nothing}
      <div class="lm-grid">
        <div class="lm-col">
          ${lefts.map(
            (item) => html`
              <button
                type="button"
                class="lm-item${leftClass(item)}"
                ?disabled=${this._matched.has(item) || this.submitted}
                @click=${() => this.#pickLeft(item)}
              >${item}</button>
            `
          )}
        </div>
        <div class="lm-col">
          ${rights.map(
            (item) => html`
              <button
                type="button"
                class="lm-item${rightClass(item)}"
                ?disabled=${this.#isRightMatched(item) || this.submitted}
                @click=${() => this.#pickRight(item)}
              >${item}</button>
            `
          )}
        </div>
      </div>
      ${this.submitted
        ? html`<div class="lm-result">All ${this.pairs.length} pairs matched in ${this._attempts} attempts.</div>`
        : nothing}
    `;
  }
}
