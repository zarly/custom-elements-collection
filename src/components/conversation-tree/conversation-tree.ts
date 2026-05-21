import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-conversation-tree>` — compact prev/next branch picker for forked LLM
 * conversations.
 *
 * Renders:  [label?]  ‹  N / M  ›
 *
 * Attributes:
 *   index    — 1-based current branch (clamped to [1, total])
 *   total    — total branch count (0 or <1 treated as 1)
 *   label    — optional descriptive label before the controls (e.g. "Response")
 *   disabled — disables both buttons
 *
 * Events:
 *   ce-branch-prev   — { index } after going prev (only when prev is enabled)
 *   ce-branch-next   — { index } after going next (only when next is enabled)
 *   ce-branch-select — { index } emitted on every change (both prev and next)
 *
 * Slots:
 *   (default)  — overrides the auto-generated "N / M" counter
 *   prev-icon  — overrides the ‹ icon
 *   next-icon  — overrides the › icon
 *
 * Keyboard:
 *   ArrowLeft  on host → prev (if enabled)
 *   ArrowRight on host → next (if enabled)
 */
export class CeConversationTree extends CecElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-2);
      padding: var(--ce-inset-xs) var(--ce-space-2);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-pill);
      background: var(--ce-surface-2);
      font-size: var(--ce-text-xs);
      font-family: var(--ce-font-sans);
      color: var(--ce-text);
      box-sizing: border-box;
      outline: none;
    }

    :host(:focus-visible) {
      box-shadow: var(--ce-focus-ring);
    }

    .label {
      color: var(--ce-muted);
      margin-right: var(--ce-space-1);
      white-space: nowrap;
    }

    .btn {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: var(--ce-radius-sm);
      cursor: pointer;
      color: var(--ce-text);
      background: transparent;
      transition: background var(--ce-transition-fast);
      flex-shrink: 0;
    }

    .btn:hover:not([disabled]) {
      background: var(--ce-state-hover);
    }

    .btn:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }

    .btn[disabled],
    .btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }

    .btn svg {
      width: 12px;
      height: 12px;
      flex-shrink: 0;
    }

    .counter {
      font-variant-numeric: tabular-nums;
      color: var(--ce-text);
      white-space: nowrap;
      user-select: none;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  /** 1-based current branch index. Clamped to [1, total]. */
  @property({ type: Number, reflect: true })
  index = 1;

  /** Total branch count. Values < 1 are treated as 1. */
  @property({ type: Number, reflect: true })
  total = 1;

  /** Optional descriptive label rendered before the controls. */
  @property({ type: String })
  label = "";

  /** Disables both nav buttons when true. */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  // ── Lifecycle ────────────────────────────────────────────

  override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("total") || changed.has("index")) {
      this.#clamp();
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("keydown", this.#onKeydown);
    if (!this.hasAttribute("tabindex")) {
      this.setAttribute("tabindex", "0");
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this.#onKeydown);
  }

  // ── Internal helpers ─────────────────────────────────────

  #safeTotal(): number {
    return Math.max(1, this.total || 1);
  }

  #clamp(): void {
    const t = this.#safeTotal();
    const clamped = Math.max(1, Math.min(this.index, t));
    if (clamped !== this.index) {
      this.index = clamped;
    }
  }

  #isPrevDisabled(): boolean {
    return this.disabled || this.index <= 1;
  }

  #isNextDisabled(): boolean {
    return this.disabled || this.index >= this.#safeTotal();
  }

  #goPrev(): void {
    if (this.#isPrevDisabled()) return;
    this.index = this.index - 1;
    const newIndex = this.index;
    this.#emit("ce-branch-prev", newIndex);
    this.#emit("ce-branch-select", newIndex);
  }

  #goNext(): void {
    if (this.#isNextDisabled()) return;
    this.index = this.index + 1;
    const newIndex = this.index;
    this.#emit("ce-branch-next", newIndex);
    this.#emit("ce-branch-select", newIndex);
  }

  #emit(name: string, index: number): void {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail: { index },
        bubbles: true,
        composed: true,
      })
    );
  }

  #onKeydown = (ev: KeyboardEvent): void => {
    if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      this.#goPrev();
    } else if (ev.key === "ArrowRight") {
      ev.preventDefault();
      this.#goNext();
    }
  };

  // ── Render ───────────────────────────────────────────────

  override render() {
    const total = this.#safeTotal();
    const prevDisabled = this.#isPrevDisabled();
    const nextDisabled = this.#isNextDisabled();

    return html`
      ${this.label ? html`<span class="label">${this.label}</span>` : nothing}

      <button
        type="button"
        class="btn"
        aria-label="Previous branch"
        ?disabled=${prevDisabled}
        @click=${this.#goPrev}
      >
        <slot name="prev-icon">
          <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M7.5 2L4 6l3.5 4"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </slot>
      </button>

      <span class="counter" aria-live="polite" aria-atomic="true">
        <slot>${this.index} / ${total}</slot>
      </span>

      <button
        type="button"
        class="btn"
        aria-label="Next branch"
        ?disabled=${nextDisabled}
        @click=${this.#goNext}
      >
        <slot name="next-icon">
          <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M4.5 2L8 6l-3.5 4"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </slot>
      </button>
    `;
  }
}
