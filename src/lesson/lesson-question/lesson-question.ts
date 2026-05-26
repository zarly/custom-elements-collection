import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";
import type { LessonOption } from "../lesson-option/lesson-option.js";

/**
 * `<lesson-question>` — one multiple-choice question with slotted options.
 *
 * Authors compose `<lesson-option>` children (and optionally a
 * `<lesson-note>` hint) inside the default slot. By default the question
 * renders statically with the correct option highlighted — useful for
 * read-only study guides and `vis/` documents.
 *
 * When `interactive` is set (CDR-004 opt-in), options flip to clickable
 * `<button>` and the question listens for `lesson-option-pick` from its
 * children. On the first pick it locks all options, marks the picked one
 * + reveals the correct one, then fires `lesson-question-answer`.
 *
 * Attributes:
 *   prompt       — the question text
 *   interactive  — opt-in stateful behaviour
 *
 * Events:
 *   lesson-question-answer — { value, correct, index }
 */
export class LessonQuestion extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-4) var(--ce-space-5);
      margin: var(--ce-space-3) 0;
    }
    .lq-prompt {
      font-weight: 700;
      font-size: var(--ce-text-md);
      margin-bottom: var(--ce-space-3);
      color: var(--ce-text);
    }
    .lq-list {
      display: flex;
      flex-direction: column;
      gap: var(--ce-space-2);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) prompt = "";
  @property({ type: Boolean, reflect: true }) interactive = false;
  @property({ type: Boolean, reflect: true }) answered = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("lesson-option-pick", this.#onPick as EventListener);
    // Apply mode to children that are already present at upgrade time.
    queueMicrotask(() => this.#syncChildren());
  }

  override disconnectedCallback(): void {
    this.removeEventListener("lesson-option-pick", this.#onPick as EventListener);
    super.disconnectedCallback();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has("interactive") || changed.has("answered")) {
      this.#syncChildren();
    }
  }

  reset(): void {
    this.answered = false;
    for (const opt of this.#options()) {
      opt.picked = false;
      opt.revealed = false;
    }
    this.#syncChildren();
  }

  #options(): LessonOption[] {
    return Array.from(this.querySelectorAll(":scope > lesson-option")) as LessonOption[];
  }

  #syncChildren(): void {
    const opts = this.#options();
    for (const opt of opts) {
      // In static (non-interactive) mode we eagerly reveal so the correct
      // answer shows on read-only renders. Once answered, also reveal.
      const shouldReveal = !this.interactive || this.answered;
      opt.interactive = this.interactive && !this.answered;
      opt.revealed = shouldReveal;
    }
  }

  #onPick = (e: Event): void => {
    if (!this.interactive || this.answered) return;
    const target = e.target as Element | null;
    if (!target || target.tagName !== "LESSON-OPTION") return;
    const detail = (e as CustomEvent).detail as { value: string; correct: boolean };
    const opts = this.#options();
    const index = opts.indexOf(target as LessonOption);
    if (index < 0) return;
    e.stopPropagation();
    (target as LessonOption).picked = true;
    this.answered = true;
    this.#syncChildren();
    this.dispatchEvent(
      new CustomEvent("lesson-question-answer", {
        bubbles: true,
        composed: true,
        detail: { value: detail.value, correct: detail.correct, index },
      })
    );
  };

  #onSlotChange = (): void => {
    this.#syncChildren();
  };

  override render() {
    return html`
      ${this.prompt
        ? html`<div class="lq-prompt">${this.prompt}</div>`
        : ""}
      <div class="lq-list">
        <slot @slotchange=${this.#onSlotChange}></slot>
      </div>
    `;
  }
}
