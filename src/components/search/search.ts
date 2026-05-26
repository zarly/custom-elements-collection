import { html, css, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-search>` — search input with magnifier icon, clear button,
 * optional keyboard shortcut hint, and debounced change event.
 *
 * Usage:
 *
 *   <ce-search name="q" placeholder="Search docs" shortcut="/"></ce-search>
 *   <ce-search name="filter" placeholder="Filter by name" debounce="100"></ce-search>
 *   <ce-search name="files" placeholder="Search files…" loading></ce-search>
 *
 * Attributes:
 *   name        — form field name
 *   value       — current value (string)
 *   placeholder — input placeholder (default "Search")
 *   shortcut    — keyboard shortcut hint: "/" or "cmd+k", "ctrl+k", etc.
 *   loading     — boolean; shows spinner in place of clear button
 *   disabled    — boolean; disables input
 *   debounce    — number (ms, default 200); debounce delay for ce-search event
 *
 * Events:
 *   ce-search  — { value: string } fires after debounce on input change
 *   ce-submit  — { value: string } fires immediately on Enter
 *
 * Slots: none in v1.
 *
 * Form-associated: participates in <form> data collection via name/value.
 */
export class CeSearch extends CecElement {
  static formAssociated = true;

  static override styles = css`
    :host {
      display: block;
    }

    .field {
      display: flex;
      align-items: center;
      gap: 0;
      background: var(--ce-surface-2);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-sm);
      transition: border-color var(--ce-transition), box-shadow var(--ce-transition);
      min-height: 36px;
    }

    .field:focus-within {
      border-color: var(--ce-color-blue);
      box-shadow: var(--ce-focus-ring);
    }

    :host([disabled]) .field {
      opacity: 0.6;
      pointer-events: none;
    }

    /* Magnifier icon */
    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 32px;
      color: var(--ce-muted);
    }

    /* Native search input */
    input {
      flex: 1;
      min-width: 0;
      background: transparent;
      border: 0;
      outline: 0;
      padding: var(--ce-inset-lg) 0;
      color: var(--ce-text);
      font: inherit;
      font-size: var(--ce-text-sm);
      /* Remove browser default search UI (cancel button, magnifier) */
      appearance: textfield;
    }
    input::-webkit-search-cancel-button,
    input::-webkit-search-decoration {
      display: none;
    }
    input::placeholder {
      color: var(--ce-muted);
    }

    /* Action zone: clear button, loading spinner, shortcut chip */
    .actions {
      display: flex;
      align-items: center;
      gap: var(--ce-space-1);
      padding: 0 var(--ce-space-2);
      flex-shrink: 0;
    }

    /* Clear button */
    .clear {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      padding: 0;
      background: transparent;
      border: 0;
      border-radius: var(--ce-radius-sm);
      color: var(--ce-muted);
      cursor: pointer;
      transition: color var(--ce-transition), background var(--ce-transition);
    }
    .clear:hover {
      background: var(--ce-surface-3, var(--ce-surface-2));
      color: var(--ce-text);
    }
    .clear:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }
    .clear[hidden] {
      display: none;
    }

    /* Inline spinner */
    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid var(--ce-muted);
      border-top-color: transparent;
      border-radius: 50%;
      animation: ce-search-spin 0.8s linear infinite;
      flex-shrink: 0;
    }

    @keyframes ce-search-spin {
      to { transform: rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .spinner {
        animation-duration: 1.5s;
        border-top-color: var(--ce-muted);
        opacity: 0.4;
      }
    }

    /* Shortcut chip — kbd-styled */
    .shortcut {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 1px var(--ce-space-2);
      font-family: var(--ce-font-mono);
      font-size: var(--ce-text-xs);
      line-height: 1.4;
      color: var(--ce-muted);
      background: var(--ce-surface-2);
      border: 1px solid var(--ce-border);
      border-bottom-width: 2px;
      border-radius: var(--ce-radius-sm);
      white-space: nowrap;
      user-select: none;
      flex-shrink: 0;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  // ── Properties ──────────────────────────────────────────────────────────

  @property({ type: String })
  name = "";

  @property({ type: String })
  value = "";

  @property({ type: String })
  placeholder = "Search";

  @property({ type: String, reflect: true })
  shortcut = "";

  @property({ type: Boolean, reflect: true })
  loading = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Number })
  debounce = 200;

  // ── Private state ────────────────────────────────────────────────────────

  @state() private _hasValue = false;

  #internals: ElementInternals | null = null;
  #debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Lifecycle ────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof (this as unknown as { attachInternals?: () => ElementInternals }).attachInternals === "function" && !this.#internals) {
      try {
        this.#internals = (this as unknown as { attachInternals: () => ElementInternals }).attachInternals();
      } catch {
        this.#internals = null;
      }
    }
    // Sync form value for initial attribute-set value.
    this._hasValue = this.value !== "";
    this.#syncFormValue();
    document.addEventListener("keydown", this.#onDocKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this.#onDocKeydown);
    if (this.#debounceTimer !== null) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = null;
    }
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value")) {
      this._hasValue = this.value !== "";
      this.#syncFormValue();
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  override render() {
    const shortcutLabel = this.#formatShortcutLabel();

    return html`
      <div class="field" part="field">
        <span class="icon" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.5"/>
            <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </span>

        <input
          type="search"
          part="input"
          .value=${this.value}
          placeholder=${this.placeholder}
          ?disabled=${this.disabled}
          name=${this.name || ""}
          autocomplete="off"
          spellcheck="false"
          @input=${this.#onInput}
          @keydown=${this.#onKeydown}
        />

        <div class="actions">
          ${this.loading
            ? html`<span class="spinner" role="status" aria-label="Loading"></span>`
            : html`
                <button
                  class="clear"
                  type="button"
                  aria-label="Clear search"
                  ?hidden=${!this._hasValue}
                  @click=${this.#onClear}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </button>
              `}

          ${shortcutLabel
            ? html`<span class="shortcut" aria-hidden="true">${shortcutLabel}</span>`
            : ""}
        </div>
      </div>
    `;
  }

  // ── Public methods ───────────────────────────────────────────────────────

  /** Programmatically focus the internal input. */
  focusInput(): void {
    const input = this.shadowRoot?.querySelector("input");
    input?.focus();
  }

  // ── Event handlers ───────────────────────────────────────────────────────

  #onInput(e: Event): void {
    this.value = (e.target as HTMLInputElement).value;
    this._hasValue = this.value !== "";
    this.#syncFormValue();

    if (this.#debounceTimer !== null) {
      clearTimeout(this.#debounceTimer);
    }
    this.#debounceTimer = setTimeout(() => {
      this.#debounceTimer = null;
      this.#emitSearch(this.value);
    }, this.debounce);
  }

  #onKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter") {
      // Cancel pending debounce — submit supersedes it.
      if (this.#debounceTimer !== null) {
        clearTimeout(this.#debounceTimer);
        this.#debounceTimer = null;
      }
      this.#emitSearch(this.value);
      this.#emitSubmit(this.value);
    }
  }

  #onClear(): void {
    this.value = "";
    this._hasValue = false;
    this.#syncFormValue();

    // Cancel any in-flight debounce.
    if (this.#debounceTimer !== null) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = null;
    }
    this.#emitSearch("");

    // Refocus the input.
    this.focusInput();
  }

  /** Document-level shortcut handler. Ignores presses inside inputs/textareas. */
  #onDocKeydown = (e: KeyboardEvent): void => {
    if (!this.shortcut) return;

    // Don't steal input while typing elsewhere.
    const active = document.activeElement;
    if (active) {
      const tag = (active as HTMLElement).tagName?.toUpperCase();
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (active as HTMLElement).isContentEditable
      ) {
        return;
      }
    }

    const parsed = this.#parseShortcut(this.shortcut);
    if (!parsed) return;

    const { key, meta, ctrl, alt, shift } = parsed;
    if (
      e.key.toLowerCase() === key.toLowerCase() &&
      e.metaKey === meta &&
      e.ctrlKey === ctrl &&
      e.altKey === alt &&
      e.shiftKey === shift
    ) {
      e.preventDefault();
      this.focusInput();
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────

  #syncFormValue(): void {
    if (!this.#internals) return;
    try {
      this.#internals.setFormValue(this.value);
    } catch {
      /* noop — jsdom may not support setFormValue */
    }
  }

  #emitSearch(value: string): void {
    this.dispatchEvent(
      new CustomEvent("ce-search", {
        bubbles: true,
        composed: true,
        detail: { value },
      })
    );
  }

  #emitSubmit(value: string): void {
    this.dispatchEvent(
      new CustomEvent("ce-submit", {
        bubbles: true,
        composed: true,
        detail: { value },
      })
    );
  }

  /**
   * Parse shortcut string into modifier+key descriptor.
   *
   * Supported modifiers (case-insensitive): cmd/meta, ctrl/control, alt, shift.
   * On non-Mac platforms "cmd" maps to ctrlKey so the shortcut works cross-OS.
   * Examples: "/" → { key: "/" }, "cmd+k" → { key: "k", meta/ctrl: true },
   *           "ctrl+k" → { key: "k", ctrl: true }, "alt+/" → { key: "/", alt: true }.
   */
  #parseShortcut(raw: string): { key: string; meta: boolean; ctrl: boolean; alt: boolean; shift: boolean } | null {
    if (!raw.trim()) return null;
    const parts = raw.toLowerCase().split("+");
    const key = parts[parts.length - 1];
    if (!key) return null;

    const hasCmd  = parts.includes("cmd") || parts.includes("meta");
    const hasCtrl = parts.includes("ctrl") || parts.includes("control");
    const hasAlt  = parts.includes("alt");
    const hasShift = parts.includes("shift");

    // Cross-platform: "cmd" → metaKey on Mac, ctrlKey elsewhere.
    const isMac = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);
    const meta = hasCmd && isMac;
    const ctrl = hasCtrl || (hasCmd && !isMac);

    return { key, meta, ctrl, alt: hasAlt, shift: hasShift };
  }

  #shortcutModifiers(
    raw: string,
    parsed: { alt: boolean; shift: boolean },
    isMac: boolean,
  ): string[] {
    const rawLower = raw.toLowerCase();
    const hasCmd = rawLower.includes("cmd") || rawLower.includes("meta");
    const hasCtrl = rawLower.includes("ctrl") || rawLower.includes("control");
    const parts: string[] = [];
    if (hasCmd) parts.push(isMac ? "⌘" : "Ctrl");
    if (hasCtrl && !hasCmd) parts.push("Ctrl");
    if (parsed.alt) parts.push(isMac ? "⌥" : "Alt");
    if (parsed.shift) parts.push(isMac ? "⇧" : "Shift");
    return parts;
  }

  /**
   * Human-readable label for the shortcut chip.
   * "/" → "/" ; "cmd+k" → "⌘K" (mac) or "Ctrl+K" (others);
   * "ctrl+k" → "Ctrl+K" ; "alt+f" → "Alt+F".
   */
  #formatShortcutLabel(): string {
    if (!this.shortcut) return "";
    const parsed = this.#parseShortcut(this.shortcut);
    if (!parsed) return this.shortcut;
    const isMac = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);
    const parts = this.#shortcutModifiers(this.shortcut, parsed, isMac);
    parts.push(parsed.key.toUpperCase());
    return parts.join(isMac ? "" : "+");
  }
}
