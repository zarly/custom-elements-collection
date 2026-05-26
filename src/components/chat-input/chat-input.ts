import { html, css, nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-chat-input>` — Composite chat composer with auto-growing textarea,
 * send/stop/attach buttons, and Enter-to-submit behaviour.
 *
 * Usage:
 *
 *   <ce-chat-input placeholder="Ask anything…"></ce-chat-input>
 *
 *   <ce-chat-input busy allow-attach></ce-chat-input>
 *
 *   <ce-chat-input submit-on-enter="false">
 *     <div slot="prefix">…model picker…</div>
 *     <div slot="suffix">…character counter…</div>
 *   </ce-chat-input>
 *
 * Props:
 *   placeholder    — textarea placeholder (default "Type a message…")
 *   value          — live contents; settable by host for controlled use
 *   busy           — when true the send button becomes a stop button
 *   disabled       — disables the textarea and all buttons
 *   max-length     — hard character limit; 0 = unlimited
 *   allow-attach   — renders the attach (paperclip) button
 *   rows           — initial textarea row count (grows up to max-rows)
 *   max-rows       — upper bound for autogrow
 *   submit-on-enter — false → Enter inserts newline; only button submits
 *
 * Slots:
 *   prefix       — rendered above the textarea
 *   suffix       — rendered below the buttons row
 *   attach-icon  — override default paperclip SVG
 *   send-icon    — override default arrow-up SVG
 *   stop-icon    — override default square SVG
 *
 * Events:
 *   ce-chat-submit  { value: string } — non-empty submit
 *   ce-chat-stop    {}                — stop button clicked or Escape while busy
 *   ce-chat-attach  {}                — attach button clicked
 *   ce-chat-input   { value: string } — every textarea input
 */
export class CeChatInput extends CecElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--ce-font-sans);
      font-size: var(--ce-text-base);
    }

    .ce-chat-input {
      display: flex;
      flex-direction: column;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      transition: border-color var(--ce-transition-fast), box-shadow var(--ce-transition-fast);
    }

    .ce-chat-input:focus-within {
      border-color: var(--ce-border-strong);
      box-shadow: var(--ce-focus-ring);
    }

    /* ---- prefix slot ---- */
    .ce-chat-input__prefix {
      padding: var(--ce-space-2) var(--ce-space-3) 0;
    }
    .ce-chat-input__prefix:not(:has(::slotted(*))) {
      display: none;
    }

    /* ---- textarea ---- */
    .ce-chat-input__textarea {
      display: block;
      width: 100%;
      box-sizing: border-box;
      padding: var(--ce-space-3) var(--ce-space-3) var(--ce-space-2);
      background: transparent;
      border: 0;
      outline: none;
      resize: none;
      overflow-y: auto;
      color: var(--ce-text);
      font: inherit;
      line-height: var(--ce-line-normal);
      field-sizing: content; /* progressive enhancement */
      min-height: var(--ce-chat-input-min-height, 2.5rem);
      max-height: var(--ce-chat-input-max-height, 14rem);
    }

    .ce-chat-input__textarea::placeholder {
      color: var(--ce-muted);
    }

    /* ---- buttons row ---- */
    .ce-chat-input__actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--ce-space-2);
      padding: 0 var(--ce-space-2) var(--ce-space-2);
    }

    /* ---- shared button base ---- */
    .ce-chat-input__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: var(--ce-radius-sm);
      border: 1px solid transparent;
      cursor: pointer;
      transition: background var(--ce-transition-fast), border-color var(--ce-transition-fast),
        opacity var(--ce-transition-fast);
      flex: 0 0 auto;
      background: transparent;
      color: var(--ce-text);
    }
    .ce-chat-input__btn:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }
    .ce-chat-input__btn svg {
      width: 16px;
      height: 16px;
      pointer-events: none;
    }

    /* ---- attach button — ghost ---- */
    .ce-chat-input__btn--attach {
      color: var(--ce-muted);
    }
    .ce-chat-input__btn--attach:hover {
      background: var(--ce-state-hover);
      color: var(--ce-text);
    }

    /* ---- send button — blue ---- */
    .ce-chat-input__btn--send {
      background: var(--ce-color-blue-bg);
      color: var(--ce-color-blue);
      border-color: var(--ce-color-blue-border);
    }
    .ce-chat-input__btn--send:hover {
      border-color: var(--ce-color-blue);
    }
    .ce-chat-input__btn--send:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* ---- stop button — red ---- */
    .ce-chat-input__btn--stop {
      background: var(--ce-color-red-bg);
      color: var(--ce-color-red);
      border-color: var(--ce-color-red-border);
    }
    .ce-chat-input__btn--stop:hover {
      border-color: var(--ce-color-red);
    }

    /* ---- disabled state ---- */
    :host([disabled]) .ce-chat-input__textarea,
    :host([disabled]) .ce-chat-input__btn {
      opacity: 0.55;
      pointer-events: none;
    }

    /* ---- suffix slot ---- */
    .ce-chat-input__suffix {
      padding: 0 var(--ce-space-3) var(--ce-space-2);
    }
    .ce-chat-input__suffix:not(:has(::slotted(*))) {
      display: none;
    }

    /* ---- reduced motion ---- */
    @media (prefers-reduced-motion: reduce) {
      .ce-chat-input,
      .ce-chat-input__btn {
        transition: none;
      }
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  // ---- props ----

  @property({ type: String })
  placeholder = "Type a message…";

  // value is NOT reflected back to attribute (controlled-input pattern)
  @property({ type: String })
  value = "";

  @property({ type: Boolean, reflect: true })
  busy = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  // max-length NOT reflected
  @property({ type: Number, attribute: "max-length" })
  maxLength = 0;

  @property({ type: Boolean, reflect: true, attribute: "allow-attach" })
  allowAttach = false;

  // rows / max-rows NOT reflected
  @property({ type: Number })
  rows = 1;

  @property({ type: Number, attribute: "max-rows" })
  maxRows = 8;

  // submit-on-enter: NOT reflected. Boolean attr presence cannot represent "false"
  // ergonomically. Consumers set this property via JS or omit to accept the default.
  @property({ type: Boolean, attribute: "submit-on-enter" })
  submitOnEnter = true;

  // ---- internal state ----

  // Textarea reference — set once the shadow DOM has rendered
  #textarea: HTMLTextAreaElement | null = null;

  // Track whether field-sizing is supported, so we can fall back to JS autogrow.
  // Guarded for jsdom where the global `CSS` object is undefined.
  #fieldSizingSupported =
    typeof CSS !== "undefined" && typeof CSS.supports === "function"
      ? CSS.supports("field-sizing", "content")
      : false;

  override firstUpdated(changed: PropertyValues<this>): void {
    super.firstUpdated(changed);
    this.#textarea = this.renderRoot.querySelector<HTMLTextAreaElement>(".ce-chat-input__textarea");
    this.#syncTextarea();
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has("value") || changed.has("rows") || changed.has("maxRows")) {
      this.#syncTextarea();
    }
  }

  // ---- render ----

  override render() {
    const lineHeight = 1.55; // matches --ce-line-normal
    const baseFontPx = 14;   // matches --ce-text-base
    const minH = `${this.rows * lineHeight * baseFontPx + 20}px`;  // +20 for padding
    const maxH = `${this.maxRows * lineHeight * baseFontPx + 20}px`;

    return html`
      <div class="ce-chat-input">
        <div class="ce-chat-input__prefix">
          <slot name="prefix"></slot>
        </div>

        <textarea
          class="ce-chat-input__textarea"
          .value=${this.value}
          placeholder=${this.placeholder}
          ?disabled=${this.disabled}
          rows=${this.rows}
          maxlength=${this.maxLength > 0 ? this.maxLength : nothing}
          aria-label=${this.placeholder}
          style="min-height:${minH};max-height:${maxH}"
          @input=${this.#onInput}
          @keydown=${this.#onKeyDown}
        ></textarea>

        <div class="ce-chat-input__actions">
          ${this.allowAttach
            ? html`<button
                type="button"
                class="ce-chat-input__btn ce-chat-input__btn--attach"
                aria-label="Attach file"
                ?disabled=${this.disabled}
                @click=${this.#onAttach}
              >
                <slot name="attach-icon">
                  <!-- default paperclip SVG -->
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M13.5 7.5 7.707 13.293a4 4 0 0 1-5.657-5.657l6.364-6.364a2.5 2.5 0 0 1 3.535 3.535L5.586 11.14a1 1 0 0 1-1.414-1.414L9.879 4"
                    />
                  </svg>
                </slot>
              </button>`
            : nothing}

          ${this.busy
            ? html`<button
                type="button"
                class="ce-chat-input__btn ce-chat-input__btn--stop"
                aria-label="Stop generation"
                ?disabled=${this.disabled}
                @click=${this.#onStop}
              >
                <slot name="stop-icon">
                  <!-- default square (stop) SVG -->
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <rect
                      x="3"
                      y="3"
                      width="10"
                      height="10"
                      rx="1.5"
                      fill="currentColor"
                    />
                  </svg>
                </slot>
              </button>`
            : html`<button
                type="button"
                class="ce-chat-input__btn ce-chat-input__btn--send"
                aria-label="Send message"
                ?disabled=${this.disabled || !this.value.trim()}
                @click=${this.#onSend}
              >
                <slot name="send-icon">
                  <!-- default arrow-up SVG -->
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M8 12V4m0 0L4.5 7.5M8 4l3.5 3.5"
                    />
                  </svg>
                </slot>
              </button>`}
        </div>

        <div class="ce-chat-input__suffix">
          <slot name="suffix"></slot>
        </div>
      </div>
    `;
  }

  // ---- event handlers ----

  #onInput = (e: Event): void => {
    const ta = e.target as HTMLTextAreaElement;
    this.value = ta.value;
    if (!this.#fieldSizingSupported) {
      this.#autogrow(ta);
    }
    this.dispatchEvent(
      new CustomEvent("ce-chat-input", {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      })
    );
  };

  #onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Escape" && this.busy) {
      e.preventDefault();
      this.#emitStop();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (!this.submitOnEnter) return;
      if (this.disabled || this.busy) return;
      e.preventDefault();
      this.#emitSubmit();
    }
  };

  #onSend = (): void => {
    this.#emitSubmit();
  };

  #onStop = (): void => {
    this.#emitStop();
  };

  #onAttach = (): void => {
    this.dispatchEvent(
      new CustomEvent("ce-chat-attach", { bubbles: true, composed: true })
    );
  };

  // ---- private helpers ----

  #emitSubmit(): void {
    const trimmed = this.value.trim();
    if (!trimmed) return;
    this.dispatchEvent(
      new CustomEvent("ce-chat-submit", {
        bubbles: true,
        composed: true,
        detail: { value: trimmed },
      })
    );
  }

  #emitStop(): void {
    this.dispatchEvent(
      new CustomEvent("ce-chat-stop", { bubbles: true, composed: true })
    );
  }

  /** JS autogrow fallback for browsers that don't support field-sizing:content. */
  #autogrow(ta: HTMLTextAreaElement): void {
    ta.style.height = "auto";
    const lineH = parseFloat(getComputedStyle(ta).lineHeight) || 21.7;
    const maxH = this.maxRows * lineH + 20;
    ta.style.height = `${Math.min(ta.scrollHeight, maxH)}px`;
  }

  /** Sync the textarea's value and height after prop changes. */
  #syncTextarea(): void {
    if (!this.#textarea) return;
    if (this.#textarea.value !== this.value) {
      this.#textarea.value = this.value;
    }
    if (!this.#fieldSizingSupported) {
      this.#autogrow(this.#textarea);
    }
  }
}
