/* eslint-disable max-lines --
 * ce-combobox is the project's autocomplete + select primitive: it owns the
 * text input, the floating listbox, ARIA keyboard nav (Home/End/Arrow/PgUp/
 * PgDn/Enter/Escape/Tab), the slot-vs-JSON option resolution (CDR-005), and
 * filter+highlight logic. The keyboard handler reads instance state across
 * input value, listbox open state, highlighted index, and the active-id
 * mirror — extracting any of these substrates would either thread state
 * through ~5 parameters per call or promote to module-level (breaks multi-
 * instance). Carve-out follows the same pattern as plot/feedback-sink;
 * revisit when the listbox virtualization lands in its own helper.
 */
import { html, css, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

// ─── CeOption ────────────────────────────────────────────────────────────────

/**
 * `<ce-option>` — lightweight option child for `<ce-combobox>` (slot-mode authoring path).
 *
 * Attributes:
 *   value     — option value string (required)
 *   label     — human-readable label; falls back to textContent when omitted
 *   disabled  — boolean; disables this option
 *   group     — optional group name for visual grouping
 *
 * Usage:
 *   <ce-combobox name="country">
 *     <ce-option value="us" label="United States"></ce-option>
 *     <ce-option value="de" label="Germany"></ce-option>
 *   </ce-combobox>
 */
export class CeOption extends CecElement {
  static override styles = css`
    :host { display: none; }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) value = "";
  @property({ type: String }) label = "";
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: String }) group = "";

  override render() {
    return html`<slot></slot>`;
  }
}

// ─── Data types ──────────────────────────────────────────────────────────────

export interface ComboboxOption {
  /** Underlying form value. */
  value: string;
  /** Human-readable label. Falls back to `value` when omitted. */
  label?: string;
  /** Disable this option individually. */
  disabled?: boolean;
  /** Optional group name — adjacent options sharing the same group are visually grouped. */
  group?: string;
}

// ─── CeCombobox ──────────────────────────────────────────────────────────────

/**
 * `<ce-combobox>` — text input bound to a filterable popup listbox; single selection.
 *
 * Suitable for country pickers, assignee selectors, currency, locale, and "send to" recipients.
 *
 * Accepts options as a JSON-on-attribute array (`data='[…]'`) OR as slotted
 * `<ce-option>` children (CDR-005 dual mode).
 *
 * Attributes:
 *   name, value, placeholder, allow-custom, loading, disabled, open
 *   data — JSON ComboboxOption[]
 *
 * Events:
 *   ce-change — { value, label } on selection or allow-custom commit
 *
 * A11y:
 *   Internal input has role="combobox", aria-expanded, aria-controls,
 *   aria-activedescendant. Listbox has role="listbox". Options have
 *   role="option", aria-selected, aria-disabled.
 *
 * Form-associated: internals.setFormValue() keeps the hidden form value in sync.
 */
export class CeCombobox extends CecElement {
  static formAssociated = true;

  static override styles = css`
    :host {
      display: block;
      position: relative;
    }

    /* ── Field shell ────────────────────────────────── */
    .field {
      display: flex;
      align-items: stretch;
      background: var(--ce-surface-2);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-sm);
      transition: border-color var(--ce-transition), box-shadow var(--ce-transition);
    }
    .field:focus-within {
      border-color: var(--ce-color-blue);
      box-shadow: var(--ce-focus-ring);
    }
    :host([open]) .field {
      border-color: var(--ce-color-blue);
      box-shadow: var(--ce-focus-ring);
    }
    :host([disabled]) {
      opacity: 0.6;
      pointer-events: none;
    }
    :host([invalid]) .field {
      border-color: var(--ce-color-red);
    }

    /* ── Input ──────────────────────────────────────── */
    input {
      flex: 1;
      min-width: 0;
      background: transparent;
      border: 0;
      outline: 0;
      padding: var(--ce-inset-lg);
      padding-right: var(--ce-space-2);
      color: var(--ce-text);
      font: inherit;
      font-size: var(--ce-text-sm);
      cursor: text;
    }
    input::placeholder {
      color: var(--ce-muted);
    }

    /* ── Toggle button ──────────────────────────────── */
    .toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 var(--ce-space-3);
      background: transparent;
      border: 0;
      cursor: pointer;
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
      transition: color var(--ce-transition);
    }
    .toggle:hover {
      color: var(--ce-text);
    }
    .toggle:focus-visible {
      outline: 2px solid var(--ce-color-blue);
      outline-offset: -2px;
    }

    /* ── Spinner (loading) ──────────────────────────── */
    .spinner {
      display: flex;
      align-items: center;
      padding: 0 var(--ce-space-2);
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
    }

    /* ── Listbox (popover panel) ────────────────────── */
    .listbox {
      margin: 0;
      padding: var(--ce-space-1) 0;
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-sm);
      background: var(--ce-surface);
      color: var(--ce-text);
      box-shadow: var(--ce-shadow-lg);
      font-size: var(--ce-text-sm);
      /* Fixed positioning escapes scroll containers */
      position: fixed;
      inset: unset;
      z-index: var(--ce-popover-z, 1000);
      min-width: 180px;
      max-height: var(--ce-combobox-listbox-max-height, 260px);
      overflow-y: auto;
      overscroll-behavior: contain;
      /* Entrance animation; respects prefers-reduced-motion */
      opacity: 0;
      transform: scale(0.97) translateY(-4px);
      transition: opacity var(--ce-transition), transform var(--ce-transition);
    }
    .listbox:popover-open,
    .listbox[open] {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    @media (prefers-reduced-motion: reduce) {
      .listbox { transition: none; }
    }

    /* ── Group headers ──────────────────────────────── */
    .group-label {
      padding: var(--ce-space-1) var(--ce-space-3);
      font-size: var(--ce-text-xs);
      font-weight: 700;
      color: var(--ce-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      user-select: none;
    }

    /* ── Option items ───────────────────────────────── */
    .option {
      display: flex;
      align-items: center;
      padding: var(--ce-space-2) var(--ce-space-3);
      cursor: pointer;
      transition: background var(--ce-transition);
      outline: none;
      user-select: none;
    }
    .option:hover,
    .option[aria-selected="true"] {
      background: var(--ce-surface-3);
    }
    .option--highlighted {
      background: var(--ce-surface-3);
      outline: 2px solid var(--ce-color-blue);
      outline-offset: -2px;
    }
    .option[aria-disabled="true"] {
      opacity: 0.4;
      pointer-events: none;
      cursor: not-allowed;
    }

    /* ── Check mark ─────────────────────────────────── */
    .option__check {
      margin-right: var(--ce-space-2);
      font-size: var(--ce-text-xs);
      color: var(--ce-color-blue);
      width: 1em;
      flex-shrink: 0;
    }

    /* ── Empty state ────────────────────────────────── */
    .listbox-empty {
      padding: var(--ce-space-3);
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
      text-align: center;
    }

    /* ── Hide slot children (CDR-005) ───────────────── */
    ::slotted(ce-option) {
      display: none;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  // ── ElementInternals for form association ──────────────────────────────────

  readonly #internals: ElementInternals;

  constructor() {
    super();
    this.#internals = this.attachInternals();
  }

  // ── Props ──────────────────────────────────────────────────────────────────

  /** Form field name. */
  @property({ type: String }) name = "";

  /** Currently selected option value (reflected, form value). */
  @property({ type: String, reflect: true }) value = "";

  /** Placeholder text shown when no option is selected. */
  @property({ type: String }) placeholder = "";

  /** JSON array of options — dual-mode CDR-005 (data array OR slot children). */
  @property(jsonProp<ComboboxOption[]>([], "data"))
  data: ComboboxOption[] = [];

  /** When set, typing an arbitrary value and pressing Enter commits it. */
  @property({ attribute: "allow-custom", type: Boolean, reflect: true })
  allowCustom = false;

  /** Shows a spinner and prevents interaction. */
  @property({ type: Boolean, reflect: true }) loading = false;

  /** Disables the combobox. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Controls the listbox open state; reflected so external CSS can query it. */
  @property({ type: Boolean, reflect: true }) open = false;

  // ── Internal state ─────────────────────────────────────────────────────────

  @state() private _inputText = "";
  @state() private _highlightedIndex = -1;
  @state() private _slotted: ComboboxOption[] = [];

  private _listboxId = `ce-cb-lb-${Math.random().toString(36).slice(2, 9)}`;
  private _inputId = `ce-cb-in-${Math.random().toString(36).slice(2, 9)}`;

  // ── DOM refs ───────────────────────────────────────────────────────────────

  private get _input(): HTMLInputElement | null {
    return this.shadowRoot?.querySelector("input") ?? null;
  }

  private get _listbox(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".listbox") as HTMLElement | null;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    this._slotted = this.#readSlottedOptions();
    document.addEventListener("click", this.#onDocumentClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("click", this.#onDocumentClick);
    this.#detachPositionListeners();
  }

  override firstUpdated(): void {
    const listbox = this._listbox;
    if (!listbox) return;
    listbox.id = this._listboxId;
    listbox.setAttribute("popover", "manual");
    listbox.addEventListener("toggle", this.#onNativeToggle);
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);

    if (changed.has("value")) {
      try { this.#internals.setFormValue(this.value); } catch { /* jsdom */ }
      // Sync input text to the selected label (unless the user is actively typing)
      if (!this._inputText || !this.open) {
        this._inputText = this.#labelFor(this.value);
      }
    }

    if (changed.has("open")) {
      if (this.open) {
        this.#showListbox();
      } else {
        this.#hideListbox();
      }
    }
  }

  // ── Slot reading (CDR-005) ─────────────────────────────────────────────────

  #readSlottedOptions(): ComboboxOption[] {
    const out: ComboboxOption[] = [];
    for (const node of Array.from(this.children)) {
      if (node instanceof CeOption) {
        out.push({
          value: node.value,
          label: node.label || node.textContent?.trim() || node.value,
          disabled: node.disabled,
          group: node.group || undefined,
        });
      } else if (node instanceof HTMLElement && node.tagName.toLowerCase() === "ce-option") {
        // Fallback: element is not yet upgraded (e.g. definition ordering)
        out.push({
          value: node.getAttribute("value") ?? "",
          label:
            node.getAttribute("label") ||
            node.textContent?.trim() ||
            node.getAttribute("value") ||
            "",
          disabled: node.hasAttribute("disabled"),
          group: node.getAttribute("group") ?? undefined,
        });
      }
    }
    return out;
  }

  #onSlotChange = (): void => {
    this._slotted = this.#readSlottedOptions();
  };

  // ── Option resolution ──────────────────────────────────────────────────────

  #effectiveOptions(): ComboboxOption[] {
    return this.data.length ? this.data : this._slotted;
  }

  /** All options after applying the current filter. */
  #filteredOptions(): ComboboxOption[] {
    const q = this._inputText.trim().toLowerCase();
    if (!q) return this.#effectiveOptions();
    return this.#effectiveOptions().filter((o) =>
      (o.label ?? o.value).toLowerCase().includes(q)
    );
  }

  #labelFor(value: string): string {
    if (!value) return "";
    const found = this.#effectiveOptions().find((o) => o.value === value);
    return found ? (found.label ?? found.value) : value;
  }

  // ── Open / close ───────────────────────────────────────────────────────────

  #showListbox(): void {
    const listbox = this._listbox;
    if (!listbox) return;

    try {
      if (listbox.matches(":popover-open")) return;
    } catch {
      // jsdom: proceed
    }

    try {
      (listbox as HTMLElement & { showPopover(): void }).showPopover();
    } catch {
      // jsdom / old browsers: noop
    }

    this.#attachPositionListeners();
    this.#updatePosition();

    // Highlight the currently selected option (or first)
    const filtered = this.#filteredOptions();
    const selectedIdx = filtered.findIndex((o) => o.value === this.value);
    this._highlightedIndex = selectedIdx >= 0 ? selectedIdx : (filtered.length > 0 ? 0 : -1);

    this.requestUpdate();
  }

  #hideListbox(): void {
    const listbox = this._listbox;
    if (!listbox) return;

    let isOpen = false;
    try {
      isOpen = listbox.matches(":popover-open");
    } catch {
      isOpen = true;
    }

    if (isOpen) {
      try {
        (listbox as HTMLElement & { hidePopover(): void }).hidePopover();
      } catch {
        // jsdom / old browsers: noop
      }
    }

    this.#detachPositionListeners();
    this._highlightedIndex = -1;

    // Restore input text to the committed value's label
    this._inputText = this.#labelFor(this.value);
  }

  #onNativeToggle = (e: Event): void => {
    const ev = e as ToggleEvent;
    if (ev.newState === "closed" && this.open) {
      this.open = false;
    }
  };

  // ── Positioning (adapted from ce-popover) ─────────────────────────────────

  private _scrollTargets: EventTarget[] = [];
  private _repositionBound = (): void => { this.#updatePosition(); };

  #attachPositionListeners(): void {
    this.#detachPositionListeners();
    window.addEventListener("resize", this._repositionBound);
    window.addEventListener("scroll", this._repositionBound, { passive: true, capture: true });
    this._scrollTargets = [window as unknown as EventTarget];

    let ancestor = this.parentElement as Element | null;
    while (ancestor && ancestor !== document.documentElement) {
      const style = getComputedStyle(ancestor);
      if (/auto|scroll/.test(`${style.overflow}${style.overflowX}${style.overflowY}`)) {
        ancestor.addEventListener("scroll", this._repositionBound, { passive: true });
        this._scrollTargets.push(ancestor);
      }
      ancestor = ancestor.parentElement;
    }
  }

  #detachPositionListeners(): void {
    window.removeEventListener("resize", this._repositionBound);
    window.removeEventListener("scroll", this._repositionBound, { capture: true });
    for (const t of this._scrollTargets) {
      if (t !== (window as unknown as EventTarget)) {
        (t as Element).removeEventListener("scroll", this._repositionBound);
      }
    }
    this._scrollTargets = [];
  }

  #updatePosition(): void {
    const field = this.shadowRoot?.querySelector(".field") as HTMLElement | null;
    const listbox = this._listbox;
    if (!field || !listbox) return;

    const fr = field.getBoundingClientRect();
    const lr = listbox.getBoundingClientRect();
    const gap = 4;

    // Prefer below; flip above if not enough room below
    const spaceBelow = window.innerHeight - fr.bottom;
    const spaceAbove = fr.top;
    const fitBelow = spaceBelow >= lr.height + gap;
    const fitAbove = spaceAbove >= lr.height + gap;

    let top: number;
    if (fitBelow || (!fitAbove && spaceBelow >= spaceAbove)) {
      top = fr.bottom + gap;
    } else {
      top = fr.top - lr.height - gap;
    }

    // Align left edge; clamp right overflow
    let left = fr.left;
    const right = left + Math.max(fr.width, lr.width);
    if (right > window.innerWidth - 8) {
      left = window.innerWidth - 8 - Math.max(fr.width, lr.width);
    }

    listbox.style.top = `${top}px`;
    listbox.style.left = `${left}px`;
    listbox.style.minWidth = `${fr.width}px`;
  }

  // ── Selection ──────────────────────────────────────────────────────────────

  #selectOption(opt: ComboboxOption): void {
    if (opt.disabled) return;
    this.value = opt.value;
    this._inputText = opt.label ?? opt.value;
    this.open = false;
    this.dispatchEvent(
      new CustomEvent("ce-change", {
        bubbles: true,
        composed: true,
        detail: { value: opt.value, label: opt.label ?? opt.value },
      })
    );
    this._input?.focus();
  }

  #commitCustom(): void {
    const text = this._inputText.trim();
    if (!text) return;
    this.value = text;
    this.open = false;
    this.dispatchEvent(
      new CustomEvent("ce-change", {
        bubbles: true,
        composed: true,
        detail: { value: text, label: text },
      })
    );
    this._input?.focus();
  }

  // ── Keyboard navigation ────────────────────────────────────────────────────

  #moveHighlight(filtered: ComboboxOption[], delta: 1 | -1): void {
    if (filtered.length === 0) return;
    const start = delta === -1 && this._highlightedIndex < 0
      ? filtered.length
      : this._highlightedIndex;
    let next = start;
    for (let i = 0; i < filtered.length; i++) {
      next = (next + delta + filtered.length) % filtered.length;
      if (!filtered[next].disabled) break;
    }
    this._highlightedIndex = next;
    this.#scrollHighlightedIntoView();
  }

  #onEnterKey(filtered: ComboboxOption[]): void {
    if (this._highlightedIndex >= 0 && filtered[this._highlightedIndex]) {
      this.#selectOption(filtered[this._highlightedIndex]);
    } else if (this.allowCustom) {
      this.#commitCustom();
    }
  }

  #onKeyDown = (e: KeyboardEvent): void => {
    const filtered = this.#filteredOptions();
    const arrow = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (arrow !== 0) {
      e.preventDefault();
      if (!this.open) { this.open = true; return; }
      this.#moveHighlight(filtered, arrow as 1 | -1);
      return;
    }
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (!this.open) { this.open = true; return; }
        this.#onEnterKey(filtered);
        break;
      case "Escape":
        e.preventDefault();
        if (this.open) this.open = false;
        break;
      case "Tab":
        // Close on Tab; let focus move naturally
        if (this.open) this.open = false;
        break;
    }
  };

  #scrollHighlightedIntoView(): void {
    // Schedule after render so the highlighted option's class is applied
    requestAnimationFrame(() => {
      const item = this._listbox?.querySelector(".option--highlighted") as HTMLElement | null;
      // scrollIntoView is not implemented in jsdom — guard for test environments
      if (item && typeof item.scrollIntoView === "function") {
        item.scrollIntoView({ block: "nearest" });
      }
    });
  }

  // ── Input events ───────────────────────────────────────────────────────────

  #onInput = (e: InputEvent): void => {
    this._inputText = (e.target as HTMLInputElement).value;
    this._highlightedIndex = -1;
    if (!this.open) {
      this.open = true;
    } else {
      // Recompute position as listbox height may change
      requestAnimationFrame(() => this.#updatePosition());
    }
  };

  #onFocus = (): void => {
    // Do not auto-open on focus — wait for user to type or press ArrowDown
  };

  #onBlur = (e: FocusEvent): void => {
    // If focus moved inside the listbox, don't close
    const related = e.relatedTarget as Node | null;
    if (related && this._listbox?.contains(related)) return;
    if (this.open) {
      this.open = false;
    }
  };

  // ── Click outside ──────────────────────────────────────────────────────────

  #onDocumentClick = (e: MouseEvent): void => {
    if (!this.open) return;
    if (!this.contains(e.target as Node) && !(this._listbox?.contains(e.target as Node))) {
      this.open = false;
    }
  };

  // ── Option click ───────────────────────────────────────────────────────────

  #onOptionClick = (e: MouseEvent): void => {
    const target = (e.target as HTMLElement).closest("[data-value]") as HTMLElement | null;
    if (!target) return;
    const value = target.getAttribute("data-value") ?? "";
    const opt = this.#filteredOptions().find((o) => o.value === value);
    if (opt && !opt.disabled) {
      this.#selectOption(opt);
    }
  };

  #onOptionMouseEnter = (e: MouseEvent): void => {
    const target = (e.target as HTMLElement).closest("[data-index]") as HTMLElement | null;
    if (!target) return;
    const idx = parseInt(target.getAttribute("data-index") ?? "-1", 10);
    if (!isNaN(idx)) {
      this._highlightedIndex = idx;
    }
  };

  // ── Rendering ──────────────────────────────────────────────────────────────

  #renderOptions() {
    const filtered = this.#filteredOptions();
    if (!filtered.length) {
      return html`<div class="listbox-empty">No options</div>`;
    }

    const items: unknown[] = [];
    let currentGroup: string | null = null;

    filtered.forEach((opt, idx) => {
      const group = opt.group ?? null;
      if (group !== currentGroup) {
        currentGroup = group;
        if (group) {
          items.push(html`<div class="group-label" aria-hidden="true">${group}</div>`);
        }
      }

      const isSelected = opt.value === this.value;
      const isHighlighted = idx === this._highlightedIndex;
      const optId = `${this._listboxId}-opt-${idx}`;

      items.push(html`
        <div
          id=${optId}
          class="option${isHighlighted ? " option--highlighted" : ""}"
          role="option"
          aria-selected=${isSelected ? "true" : "false"}
          aria-disabled=${opt.disabled ? "true" : "false"}
          data-value=${opt.value}
          data-index=${idx}
          @mouseenter=${this.#onOptionMouseEnter}
        >
          <span class="option__check" aria-hidden="true">${isSelected ? "✓" : ""}</span>
          ${opt.label ?? opt.value}
        </div>
      `);
    });

    return items;
  }

  override render() {
    const highlightedId =
      this._highlightedIndex >= 0 && this.open
        ? `${this._listboxId}-opt-${this._highlightedIndex}`
        : nothing;

    return html`
      <div class="field">
        <input
          id=${this._inputId}
          type="text"
          role="combobox"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          aria-autocomplete="list"
          aria-expanded=${this.open ? "true" : "false"}
          aria-controls=${this._listboxId}
          aria-activedescendant=${highlightedId}
          aria-label=${this.placeholder || "Select an option"}
          ?disabled=${this.disabled}
          .value=${this._inputText}
          placeholder=${this.placeholder}
          @input=${this.#onInput}
          @keydown=${this.#onKeyDown}
          @focus=${this.#onFocus}
          @blur=${this.#onBlur}
        />
        ${this.loading
          ? html`<span class="spinner" aria-hidden="true">⟳</span>`
          : html`
              <button
                class="toggle"
                type="button"
                tabindex="-1"
                aria-hidden="true"
                ?disabled=${this.disabled}
                @click=${() => {
                  if (this.open) {
                    this.open = false;
                  } else {
                    this.open = true;
                    this._input?.focus();
                  }
                }}
              >▾</button>
            `}
      </div>

      <!-- Hidden slot; reads ce-option children into _slotted via slotchange (CDR-005) -->
      <slot @slotchange=${this.#onSlotChange} hidden></slot>

      <div
        class="listbox"
        role="listbox"
        aria-label=${this.placeholder || "Options"}
        aria-multiselectable="false"
        @click=${this.#onOptionClick}
        @mousedown=${(e: MouseEvent) => e.preventDefault()}
      >
        ${this.#renderOptions()}
      </div>
    `;
  }
}
