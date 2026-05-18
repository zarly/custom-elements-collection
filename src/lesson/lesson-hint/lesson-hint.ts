import { html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

/**
 * `<lesson-hint>` — progressive hint disclosure.
 *
 * Attributes:
 *   hints — JSON string[] of hints to reveal one at a time
 *
 * Events:
 *   lesson-hint-show — { index: number; hint: string }
 *
 * Methods:
 *   (none; reveal-only, no reset by spec)
 */
export class LessonHint extends CecElement {
  static override styles = css`
    :host {
      display: block;
      margin: var(--ce-space-3) 0;
    }
    .lh-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-2);
      padding: 8px var(--ce-space-4);
      border: 1px solid var(--ce-color-blue);
      border-radius: var(--ce-radius-sm);
      background: transparent;
      color: var(--ce-color-blue);
      font: inherit;
      font-size: var(--ce-text-sm);
      cursor: pointer;
      transition: all var(--ce-transition-fast);
    }
    .lh-btn:hover:not(:disabled) {
      background: var(--ce-color-blue);
      color: var(--ce-text-inverse);
    }
    .lh-btn:disabled {
      opacity: 0.5;
      cursor: default;
      border-color: var(--ce-border);
      color: var(--ce-muted);
    }
    .lh-list {
      margin-top: var(--ce-space-3);
      display: flex;
      flex-direction: column;
      gap: var(--ce-space-2);
    }
    .lh-item {
      display: flex;
      gap: var(--ce-space-3);
      align-items: flex-start;
      padding: var(--ce-space-3) var(--ce-space-4);
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-sm);
      font-size: var(--ce-text-sm);
      color: var(--ce-text);
    }
    .lh-item.latest {
      border-color: var(--ce-color-blue);
      background: var(--ce-surface-2);
    }
    .lh-num {
      font-weight: 700;
      color: var(--ce-color-blue);
      flex: 0 0 auto;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property(jsonProp<string[]>([], "hints")) hints: string[] = [];

  @state() private _shown = 0;

  #showNext(): void {
    if (this._shown >= this.hints.length) return;
    const index = this._shown;
    const hint = this.hints[index];
    this._shown = index + 1;
    this.dispatchEvent(
      new CustomEvent("lesson-hint-show", {
        bubbles: true,
        composed: true,
        detail: { index, hint },
      })
    );
  }

  override render() {
    if (!this.hints.length) return nothing;

    const allShown = this._shown >= this.hints.length;
    const btnLabel = allShown
      ? "All hints shown"
      : `Show hint ${this._shown + 1} of ${this.hints.length}`;

    return html`
      <button
        type="button"
        class="lh-btn"
        ?disabled=${allShown}
        @click=${this.#showNext}
      >${btnLabel}</button>
      ${this._shown > 0
        ? html`
          <div class="lh-list">
            ${this.hints.slice(0, this._shown).map(
              (hint, i) => html`
                <div class="lh-item${i === this._shown - 1 ? " latest" : ""}">
                  <span class="lh-num">${i + 1}.</span>
                  <span>${hint}</span>
                </div>
              `
            )}
          </div>
        `
        : nothing}
    `;
  }
}
