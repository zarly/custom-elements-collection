import { html, css, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, defineOnce, jsonProp } from "../../core/index.js";

// ─── Sub-component ─────────────────────────────────────────────────────────

/**
 * `<ce-segment>` — a single option item inside a `<ce-segmented>` control.
 *
 * Used in slot-children mode when the consumer writes markup directly:
 *
 *   <ce-segmented name="view" value="list">
 *     <ce-segment value="list" label="List"></ce-segment>
 *     <ce-segment value="grid" label="Grid"></ce-segment>
 *   </ce-segmented>
 *
 * The parent reads `value` and `label` from each child.
 * Disabled state can also be set per-segment.
 */
export class CeSegment extends CecElement {
  @property({ type: String, reflect: true }) value = "";
  @property({ type: String, reflect: true }) label = "";
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Render nothing — the parent renders buttons for each segment. */
  override render() {
    return html``;
  }
}

// ─── Data shape ────────────────────────────────────────────────────────────

export interface SegmentItem {
  /** Value emitted in ce-change detail. */
  value: string;
  /** Human-readable label. */
  label: string;
  /** Optional icon (reserved; not rendered in v1). */
  icon?: string;
}

type SegmentSize = "sm" | "md" | "lg";

// ─── Parent component ──────────────────────────────────────────────────────

/**
 * `<ce-segmented>` — segmented control, visually a button row, semantically
 * a single-choice radio group. For view toggles (list/grid/kanban), time
 * ranges (24h/7d/30d), unit toggles, and tab-flavored filters.
 *
 * Two ways to provide segments — pick whichever matches the call site:
 *
 *   1. Slot children (slot wins when both are provided):
 *      <ce-segmented name="view" value="list">
 *        <ce-segment value="list" label="List"></ce-segment>
 *        <ce-segment value="grid" label="Grid"></ce-segment>
 *      </ce-segmented>
 *
 *   2. JSON `data` attribute:
 *      <ce-segmented name="period" value="7d"
 *        data='[{"value":"24h","label":"24h"},{"value":"7d","label":"7d"}]'>
 *      </ce-segmented>
 *
 * Attributes:
 *   name     — form-control name, echoed in ce-change detail.
 *   value    — currently-selected segment value. Empty string = no selection.
 *   data     — JSON array of SegmentItem objects.
 *   size     — "sm" | "md" | "lg" (default "md").
 *   disabled — boolean; disables the entire control.
 *
 * Events:
 *   ce-change — { name, value } on user selection change.
 *
 * A11y:
 *   Host: role="radiogroup". Segments: role="radio" + aria-checked.
 *   Roving tabindex: only the selected segment has tabindex=0;
 *   ArrowRight / ArrowLeft move selection (wrap-around).
 *   If no value is set, the first segment gets tabindex=0 but is not selected.
 */
export class CeSegmented extends CecElement {
  static formAssociated = true;

  static override styles = css`
    :host {
      display: inline-flex;
      flex-wrap: nowrap;
      border-radius: var(--ce-radius-sm);
      overflow: hidden;
      border: 1px solid var(--ce-border);
      background: var(--ce-surface-2);
      font-size: var(--ce-text-sm);
      color: var(--ce-text);
      --_seg-h: 32px;
      --_seg-px: var(--ce-space-3);
    }
    :host([size="sm"]) { --_seg-h: 26px; --_seg-px: var(--ce-space-2); font-size: var(--ce-text-xs, 0.75rem); }
    :host([size="md"]) { --_seg-h: 32px; --_seg-px: var(--ce-space-3); }
    :host([size="lg"]) { --_seg-h: 40px; --_seg-px: var(--ce-space-4); font-size: var(--ce-text-md, 1rem); }

    :host([disabled]) {
      opacity: 0.55;
      pointer-events: none;
    }

    button {
      height: var(--_seg-h);
      padding: 0 var(--_seg-px);
      font: inherit;
      color: inherit;
      background: transparent;
      border: 0;
      border-right: 1px solid var(--ce-border);
      cursor: pointer;
      white-space: nowrap;
      font-weight: 500;
      transition: background var(--ce-transition), color var(--ce-transition);
      flex: 1 1 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 0;
    }
    button:last-child {
      border-right: 0;
    }
    button:hover:not([aria-checked="true"]):not([disabled]) {
      background: var(--ce-state-hover, var(--ce-surface-3));
    }
    button[aria-checked="true"] {
      background: var(--ce-color-blue);
      color: var(--ce-text-inverse);
    }
    button[disabled] {
      cursor: not-allowed;
      opacity: 0.55;
    }
    button:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
      border-radius: 0;
      position: relative;
      z-index: 1;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) name = "";
  @property({ type: String, reflect: true }) value = "";
  @property({ type: String, reflect: true }) size: SegmentSize = "md";
  @property({ type: Boolean, reflect: true }) disabled = false;

  @property(jsonProp<SegmentItem[]>([], "data"))
  data: SegmentItem[] = [];

  /** Tracks how many <ce-segment> children are in the default slot. */
  @state() private _slotCount = 0;

  #internals: ElementInternals | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    // Form association
    if (
      typeof (this as unknown as { attachInternals?: () => ElementInternals })
        .attachInternals === "function" &&
      !this.#internals
    ) {
      try {
        this.#internals = (
          this as unknown as { attachInternals: () => ElementInternals }
        ).attachInternals();
      } catch {
        this.#internals = null;
      }
    }
    this.#setFormVal(this.value || null);
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "radiogroup");
    }
  }

  override updated(changed: PropertyValues<this>): void {
    if (changed.has("value")) {
      this.#setFormVal(this.value || null);
    }
  }

  #setFormVal(v: string | null): void {
    if (this.#internals && typeof this.#internals.setFormValue === "function") {
      this.#internals.setFormValue(v);
    }
  }

  // ── Slot / data resolution ───────────────────────────────────────────────

  #onSlotChange = (e: Event): void => {
    const slot = e.target as HTMLSlotElement;
    const segments = slot
      .assignedElements({ flatten: true })
      .filter((el) => el.tagName.toLowerCase() === "ce-segment");
    this._slotCount = segments.length;
  };

  /**
   * Resolve the active segments list.
   * Slot wins when there are <ce-segment> children; data array is the fallback.
   */
  #items(): SegmentItem[] {
    if (this._slotCount > 0) {
      // Read value/label/disabled from each child
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot");
      if (!slot) return [];
      return slot
        .assignedElements({ flatten: true })
        .filter((el) => el.tagName.toLowerCase() === "ce-segment")
        .map((el) => ({
          value: el.getAttribute("value") ?? "",
          label: el.getAttribute("label") ?? "",
          icon: el.getAttribute("icon") ?? undefined,
          _disabled: el.hasAttribute("disabled"),
        })) as SegmentItem[];
    }
    return this.data;
  }

  #isItemDisabled(idx: number): boolean {
    if (this._slotCount > 0) {
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot");
      if (!slot) return false;
      const el = slot
        .assignedElements({ flatten: true })
        .filter((e) => e.tagName.toLowerCase() === "ce-segment")[idx];
      return !!el?.hasAttribute("disabled");
    }
    return false;
  }

  // ── Roving tabindex helpers ───────────────────────────────────────────────

  #currentIndex(items: SegmentItem[]): number {
    const match = items.findIndex((o) => o.value === this.value);
    if (match >= 0) return match;
    // No selection — first non-disabled segment gets tabindex=0 for Tab access
    return this.#firstEnabled(items);
  }

  #firstEnabled(items: SegmentItem[]): number {
    for (let i = 0; i < items.length; i++) {
      if (!this.#isItemDisabled(i)) return i;
    }
    return 0;
  }

  #nextEnabled(items: SegmentItem[], from: number, dir: 1 | -1): number {
    const n = items.length;
    for (let step = 1; step <= n; step++) {
      const j = ((from + dir * step) % n + n) % n;
      if (!this.#isItemDisabled(j)) return j;
    }
    return from;
  }

  // ── Interaction ───────────────────────────────────────────────────────────

  #select(items: SegmentItem[], idx: number): void {
    const item = items[idx];
    if (!item || this.#isItemDisabled(idx) || this.disabled) return;
    if (this.value === item.value) return;
    this.value = item.value;
    this.dispatchEvent(
      new CustomEvent("ce-change", {
        bubbles: true,
        composed: true,
        detail: { name: this.name, value: this.value },
      })
    );
  }

  #focusButton(idx: number): void {
    const btns = this.shadowRoot?.querySelectorAll<HTMLButtonElement>("button");
    btns?.[idx]?.focus();
  }

  #onKeyDown = (e: KeyboardEvent, items: SegmentItem[], idx: number): void => {
    let next = idx;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        next = this.#nextEnabled(items, idx, +1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        next = this.#nextEnabled(items, idx, -1);
        break;
      default:
        return;
    }
    if (next !== idx) {
      this.#select(items, next);
      this.updateComplete.then(() => this.#focusButton(next));
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  override render() {
    const items = this.#items();
    const cur = this.#currentIndex(items);

    const buttons = items.map((item, i) => {
      const checked = item.value === this.value;
      const tabindex = i === cur ? 0 : -1;
      const disabled = this.disabled || this.#isItemDisabled(i);
      return html`<button
        type="button"
        role="radio"
        aria-checked=${checked ? "true" : "false"}
        tabindex=${tabindex}
        ?disabled=${disabled}
        @click=${() => this.#select(items, i)}
        @keydown=${(e: KeyboardEvent) => this.#onKeyDown(e, items, i)}
      >${item.label}</button>`;
    });

    return html`
      <slot
        style="display:none"
        @slotchange=${this.#onSlotChange}
      ></slot>
      ${buttons}
    `;
  }
}

// ─── Registration ──────────────────────────────────────────────────────────

defineOnce("ce-segment", CeSegment);
defineOnce("ce-segmented", CeSegmented);
