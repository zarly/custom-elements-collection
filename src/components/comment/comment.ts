import { html, css, type PropertyValues } from "lit";
import { property, query, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type CeCommentSubmitOn = "blur" | "enter" | "cmd-enter" | "manual";

let _commentIdCounter = 0;

/**
 * `<ce-comment>` — compact trigger that expands to an auto-growing
 * textarea with debounced change events and configurable submit semantics.
 *
 * Attributes (see meta).
 *
 * Events:
 *   ce-comment-change  { value }    — debounced per debounce-ms.
 *   ce-comment-commit  { value }    — fires per submit-on rule.
 *   ce-comment-expand  { expanded } — UI state change.
 */
export class CeComment extends CecElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: flex-start;
      gap: var(--ce-space-1);
      font: inherit;
      color: var(--ce-text);
    }
    :host([expanded]) {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      width: 100%;
      max-width: 480px;
    }

    .ce-comment__trigger {
      font: inherit;
      color: inherit;
      background: var(--ce-bg-elevated, var(--ce-surface-2));
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-md, var(--ce-radius-sm));
      padding: var(--ce-inset-xs) var(--ce-space-2);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-1);
      transition: background var(--ce-transition-fast),
        border-color var(--ce-transition-fast);
    }
    .ce-comment__trigger:hover {
      border-color: var(--ce-accent, var(--ce-color-purple));
    }
    .ce-comment__trigger:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }

    .ce-comment__panel {
      display: flex;
      flex-direction: column;
      gap: var(--ce-space-2);
      width: 100%;
    }

    textarea {
      font: inherit;
      color: inherit;
      background: var(--ce-bg-elevated, var(--ce-surface));
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-md, var(--ce-radius-sm));
      padding: var(--ce-inset-sm, var(--ce-space-2)) var(--ce-space-2);
      resize: none;
      width: 100%;
      box-sizing: border-box;
      line-height: 1.4;
      overflow: hidden;
    }
    textarea::placeholder {
      color: var(--ce-text-dim, var(--ce-muted));
    }
    textarea:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
      border-color: var(--ce-accent, var(--ce-color-purple));
    }

    .ce-comment__actions {
      display: flex;
      gap: var(--ce-space-2);
      justify-content: flex-end;
    }
    .ce-comment__btn {
      font: inherit;
      color: inherit;
      background: transparent;
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-sm);
      padding: var(--ce-inset-xs) var(--ce-space-2);
      cursor: pointer;
    }
    .ce-comment__btn--primary {
      background: var(--ce-accent, var(--ce-color-purple));
      /* stylelint-disable-next-line color-no-hex -- on-accent text on saturated accent background */
      color: #fff;
      border-color: var(--ce-accent, var(--ce-color-purple));
    }
    .ce-comment__btn:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  value = "";

  @property({ type: String })
  placeholder = "Why?";

  @property({ type: Number, attribute: "max-length" })
  maxLength = 2000;

  @property({ type: Number, attribute: "min-rows" })
  minRows = 2;

  @property({ type: Number, attribute: "max-rows" })
  maxRows = 8;

  @property({ type: Number, attribute: "debounce-ms" })
  debounceMs = 400;

  @property({ type: String, attribute: "submit-on" })
  submitOn: CeCommentSubmitOn = "blur";

  @property({ type: Boolean, reflect: true })
  expanded = false;

  @state() private _draft = "";

  @query("textarea") private _textarea?: HTMLTextAreaElement;

  #debounceTimer: ReturnType<typeof setTimeout> | null = null;
  readonly #textareaId = `ce-comment-ta-${++_commentIdCounter}`;

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.value && !this._draft) this._draft = this.value;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = null;
    }
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value")) {
      // Allow programmatic value updates to populate the draft buffer.
      if (this.value !== this._draft) {
        this._draft = this.value;
      }
    }
  }

  override updated(changed: PropertyValues): void {
    if (changed.has("expanded") && this.expanded && this._textarea) {
      // Focus + size on expansion.
      this._textarea.focus();
      this.#autoGrow();
    }
    if (changed.has("_draft" as PropertyKey) && this._textarea) {
      this.#autoGrow();
    }
  }

  override render() {
    if (!this.expanded) {
      const hasText = (this.value ?? "").length > 0;
      const triggerIcon = hasText ? "📝" : "💬";
      return html`
        <button
          type="button"
          class="ce-comment__trigger"
          aria-expanded="false"
          aria-controls=${this.#textareaId}
          @click=${this.#expand}
        >
          <slot name="trigger">${triggerIcon}</slot>
        </button>
      `;
    }

    return html`
      <div class="ce-comment__panel">
        <textarea
          id=${this.#textareaId}
          aria-label=${this.placeholder}
          aria-live="off"
          placeholder=${this.placeholder}
          rows=${this.minRows}
          maxlength=${this.maxLength}
          .value=${this._draft}
          @input=${this.#onInput}
          @keydown=${this.#onKeydown}
          @blur=${this.#onBlur}
        ></textarea>
        <div class="ce-comment__actions">
          <button
            type="button"
            class="ce-comment__btn"
            @click=${this.#cancel}
          >Cancel</button>
          <button
            type="button"
            class="ce-comment__btn ce-comment__btn--primary"
            @click=${this.#submit}
          >Submit</button>
        </div>
      </div>
    `;
  }

  // — auto-grow ——————————————————————————————

  #autoGrow(): void {
    const ta = this._textarea;
    if (!ta) return;
    // Reset to compute scrollHeight cleanly.
    ta.style.height = "auto";
    const styles = typeof window !== "undefined" ? window.getComputedStyle(ta) : null;
    const lineHeight = styles ? parseFloat(styles.lineHeight) || 20 : 20;
    const padTop = styles ? parseFloat(styles.paddingTop) || 0 : 0;
    const padBot = styles ? parseFloat(styles.paddingBottom) || 0 : 0;
    const maxPx = lineHeight * this.maxRows + padTop + padBot;
    const next = Math.min(ta.scrollHeight, maxPx);
    ta.style.height = `${next}px`;
    ta.style.overflow = ta.scrollHeight > maxPx ? "auto" : "hidden";
  }

  // — event handlers ————————————————————————

  #expand = (): void => {
    if (this.expanded) return;
    this.expanded = true;
    this.dispatchEvent(
      new CustomEvent("ce-comment-expand", {
        bubbles: true,
        composed: true,
        detail: { expanded: true },
      })
    );
  };

  #collapse(): void {
    if (!this.expanded) return;
    this.expanded = false;
    this.dispatchEvent(
      new CustomEvent("ce-comment-expand", {
        bubbles: true,
        composed: true,
        detail: { expanded: false },
      })
    );
  }

  #onInput = (e: Event): void => {
    const ta = e.currentTarget as HTMLTextAreaElement;
    let next = ta.value;
    if (next.length > this.maxLength) {
      next = next.slice(0, this.maxLength);
      ta.value = next;
    }
    this._draft = next;
    this.#scheduleDebounced();
  };

  #scheduleDebounced(): void {
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
    this.#debounceTimer = setTimeout(() => {
      this.#debounceTimer = null;
      this.value = this._draft;
      this.dispatchEvent(
        new CustomEvent("ce-comment-change", {
          bubbles: true,
          composed: true,
          detail: { value: this.value },
        })
      );
    }, Math.max(0, this.debounceMs));
  }

  #onKeydown = (e: KeyboardEvent): void => {
    if (this.submitOn === "enter" && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.#submit();
    } else if (this.submitOn === "cmd-enter" && e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      this.#submit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      this.#cancel();
    }
  };

  #onBlur = (): void => {
    if (this.submitOn === "blur") {
      this.#submit();
    }
  };

  #submit = (): void => {
    // Flush any pending debounce so .value is in sync.
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = null;
    }
    this.value = this._draft;
    this.dispatchEvent(
      new CustomEvent("ce-comment-commit", {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      })
    );
    // Mirror the change event too so listeners that only watch -change still see
    // the final value when typing finished faster than the debounce window.
    this.dispatchEvent(
      new CustomEvent("ce-comment-change", {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      })
    );
    if (this.submitOn !== "manual") this.#collapse();
  };

  #cancel = (): void => {
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = null;
    }
    this._draft = this.value;
    this.#collapse();
  };
}
