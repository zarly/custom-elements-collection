import { html, css, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

export interface TabItem {
  /** Tab label (rendered as text). */
  label: string;
  /** Optional small badge text rendered to the right of the label (e.g. "4", "new"). */
  badge?: string | number;
  /** Per-tab disabled state. */
  disabled?: boolean;
}

/**
 * `<ce-tabs>` — tabbed content with chip-pill head and slotted panels.
 *
 * The visual head reuses the chip-pill treatment from `<ce-filter-bar>`
 * (same border, same hover, same active blue) so tab strips and filter
 * strips look like the same family across the catalog.
 *
 * Two ways to provide tab labels — pick whichever matches the call site:
 *
 *   1. JSON prop:
 *      <ce-tabs tabs='["Overview","Settings","Logs"]' active="0">
 *        <div slot="panel">…</div>
 *        <div slot="panel">…</div>
 *        <div slot="panel">…</div>
 *      </ce-tabs>
 *
 *   2. Slotted tab buttons (richer markup):
 *      <ce-tabs active="1">
 *        <button slot="tab">Overview</button>
 *        <button slot="tab">Settings <span>⚙</span></button>
 *        <div slot="panel">…</div>
 *        <div slot="panel">…</div>
 *      </ce-tabs>
 *
 * Panels are paired with tabs by index. Extra panels or tabs are ignored.
 *
 * Attributes:
 *   active   — number; current panel index (default 0)
 *   vertical — boolean; vertical tab strip on the leading edge
 *
 * Events:
 *   ce-tab-change — { active } when the user selects a different tab.
 */
export class CeTabs extends CecElement {
  static override styles = css`
    :host {
      display: block;
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
    }
    :host([vertical]) {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: var(--ce-space-4);
    }

    /* Head — mirrors ce-filter-bar chip-pill style. */
    .head {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ce-space-2);
      margin-bottom: var(--ce-space-3);
      align-items: center;
    }
    :host([vertical]) .head {
      flex-direction: column;
      align-items: stretch;
      margin-bottom: 0;
      gap: var(--ce-space-1);
    }

    /* Internal "chip" buttons rendered when consumer uses tabs[] prop. */
    .chip,
    ::slotted(button[slot="tab"]) {
      background: var(--ce-surface-2);
      border: 1px solid var(--ce-border-soft);
      color: var(--ce-text);
      border-radius: var(--ce-radius-pill);
      padding: var(--ce-space-1) var(--ce-space-3);
      cursor: pointer;
      font: inherit;
      font-size: var(--ce-text-sm);
      font-weight: 500;
      transition: background var(--ce-transition-fast), border-color var(--ce-transition-fast),
        color var(--ce-transition-fast);
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-1);
      white-space: nowrap;
    }
    .chip:hover:not([aria-selected="true"]):not([disabled]),
    ::slotted(button[slot="tab"]:hover:not([aria-selected="true"]):not([disabled])) {
      border-color: var(--ce-color-blue);
    }
    .chip[aria-selected="true"],
    ::slotted(button[slot="tab"][aria-selected="true"]) {
      background: var(--ce-color-blue);
      border-color: var(--ce-color-blue);
      color: var(--ce-text-inverse, #fff);
    }
    .chip[disabled],
    ::slotted(button[slot="tab"][disabled]) {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .chip:focus-visible,
    ::slotted(button[slot="tab"]:focus-visible) {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }

    .badge {
      background: var(--ce-state-hover, var(--ce-surface-3));
      border-radius: var(--ce-radius-pill);
      padding: 0 var(--ce-space-2);
      font-size: var(--ce-text-xs);
      font-variant-numeric: tabular-nums;
      color: var(--ce-muted);
    }
    .chip[aria-selected="true"] .badge {
      background: rgba(255, 255, 255, 0.2);
      color: inherit;
    }

    /* Body */
    .body { min-width: 0; }
    ::slotted([slot="panel"]) {
      display: block;
    }
    ::slotted([slot="panel"][hidden]) {
      display: none !important;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  /** Tab data when the consumer passes an array. Empty means slot-based mode. */
  @property(jsonProp<TabItem[] | string[]>([], "tabs"))
  tabs: TabItem[] | string[] = [];

  @property({ type: Number, reflect: true }) active = 0;
  @property({ type: Boolean, reflect: true }) vertical = false;

  /** Number of slot-based tab buttons (read after slotchange). */
  @state() private _slotTabCount = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) {
      // The host itself doesn't get a role — the inner head does. But mark it
      // as a self-contained widget for assistive tech.
      this.setAttribute("aria-roledescription", "tabs");
    }
  }

  override updated(changed: PropertyValues<this>): void {
    if (
      changed.has("active") ||
      changed.has("tabs") ||
      changed.has("_slotTabCount" as keyof CeTabs)
    ) {
      this.#syncSlottedTabs();
      this.#syncPanels();
    }
  }

  #normTabs(): TabItem[] {
    return (this.tabs as Array<string | TabItem>).map((t) =>
      typeof t === "string" ? { label: t } : t
    );
  }

  /** True when the consumer is providing tab buttons via slot=tab. */
  #slotMode(): boolean {
    return this.#normTabs().length === 0 && this._slotTabCount > 0;
  }

  #count(): number {
    return this.#slotMode() ? this._slotTabCount : this.#normTabs().length;
  }

  #onSlotTabChange = (e: Event): void => {
    const slot = e.target as HTMLSlotElement;
    const els = slot.assignedElements();
    this._slotTabCount = els.length;
  };

  #onSlotPanelChange = (): void => {
    this.#syncPanels();
  };

  #panels(): HTMLElement[] {
    const slot = this.renderRoot.querySelector<HTMLSlotElement>("slot[name='panel']");
    if (!slot) return [];
    return slot.assignedElements({ flatten: true }) as HTMLElement[];
  }

  #slotTabs(): HTMLButtonElement[] {
    const slot = this.renderRoot.querySelector<HTMLSlotElement>("slot[name='tab']");
    if (!slot) return [];
    return slot.assignedElements({ flatten: true }) as HTMLButtonElement[];
  }

  #syncSlottedTabs(): void {
    if (!this.#slotMode()) return;
    const tabs = this.#slotTabs();
    tabs.forEach((t, i) => {
      const id = t.id || `ce-tabs-tab-${this.#instanceId}-${i}`;
      t.id = id;
      t.setAttribute("role", "tab");
      const isActive = i === this.active;
      t.setAttribute("aria-selected", isActive ? "true" : "false");
      t.tabIndex = isActive ? 0 : -1;
      // Hook up event handlers exactly once per element.
      if (!(t as any)._ceTabsBound) {
        t.addEventListener("click", () => this.#select(i));
        t.addEventListener("keydown", (e) => this.#onKey(e as KeyboardEvent, i));
        (t as any)._ceTabsBound = true;
      }
    });
  }

  #syncPanels(): void {
    const panels = this.#panels();
    panels.forEach((p, i) => {
      const id = p.id || `ce-tabs-panel-${this.#instanceId}-${i}`;
      p.id = id;
      p.setAttribute("role", "tabpanel");
      const tabId = this.#slotMode()
        ? this.#slotTabs()[i]?.id
        : `ce-tabs-tab-${this.#instanceId}-${i}`;
      if (tabId) p.setAttribute("aria-labelledby", tabId);
      if (i === this.active) p.removeAttribute("hidden");
      else p.setAttribute("hidden", "");
    });
  }

  #instanceId = Math.random().toString(36).slice(2, 8);

  #select(idx: number): void {
    const items = this.#normTabs();
    if (this.#slotMode()) {
      const tabs = this.#slotTabs();
      if (idx < 0 || idx >= tabs.length) return;
      if ((tabs[idx] as HTMLButtonElement).disabled) return;
    } else {
      if (idx < 0 || idx >= items.length) return;
      if (items[idx].disabled) return;
    }
    if (this.active === idx) return;
    this.active = idx;
    this.dispatchEvent(
      new CustomEvent("ce-tab-change", {
        bubbles: true,
        composed: true,
        detail: { active: idx },
      })
    );
  }

  #onKey(e: KeyboardEvent, idx: number): void {
    const horiz = !this.vertical;
    let dir: 0 | 1 | -1 = 0;
    if ((horiz && e.key === "ArrowRight") || (!horiz && e.key === "ArrowDown")) dir = 1;
    else if ((horiz && e.key === "ArrowLeft") || (!horiz && e.key === "ArrowUp")) dir = -1;
    else if (e.key === "Home") dir = 0;
    else if (e.key === "End") dir = 0;
    else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      this.#select(idx);
      return;
    } else return;

    e.preventDefault();
    const n = this.#count();
    let next: number;
    if (e.key === "Home") next = this.#nextEnabled(-1, +1);
    else if (e.key === "End") next = this.#nextEnabled(n, -1);
    else next = this.#nextEnabled(idx, dir as 1 | -1);
    if (next !== idx) {
      this.#select(next);
      this.updateComplete.then(() => this.#focusTab(next));
    }
  }

  #nextEnabled(from: number, dir: 1 | -1): number {
    const n = this.#count();
    if (n === 0) return 0;
    for (let step = 1; step <= n; step++) {
      const j = (from + dir * step + n * step) % n;
      if (!this.#disabledAt(j)) return j;
    }
    return Math.max(0, from);
  }

  #disabledAt(i: number): boolean {
    if (this.#slotMode()) {
      const t = this.#slotTabs()[i];
      return !!t && (t as HTMLButtonElement).disabled;
    }
    return !!this.#normTabs()[i]?.disabled;
  }

  #focusTab(i: number): void {
    if (this.#slotMode()) {
      this.#slotTabs()[i]?.focus();
    } else {
      this.renderRoot.querySelectorAll<HTMLButtonElement>(".chip")[i]?.focus();
    }
  }

  override render() {
    const items = this.#normTabs();
    const headOrient = this.vertical ? "vertical" : "horizontal";

    if (items.length === 0) {
      // Slot-based: just project the slot=tab children, parent owns roles via #syncSlottedTabs.
      return html`
        <div class="head" role="tablist" aria-orientation=${headOrient}>
          <slot name="tab" @slotchange=${this.#onSlotTabChange}></slot>
        </div>
        <div class="body">
          <slot name="panel" @slotchange=${this.#onSlotPanelChange}></slot>
        </div>
      `;
    }

    // Prop-based: render the chips ourselves.
    return html`
      <div class="head" role="tablist" aria-orientation=${headOrient}>
        ${items.map((t, i) => {
          const isActive = i === this.active;
          return html`<button
            type="button"
            class="chip"
            id=${`ce-tabs-tab-${this.#instanceId}-${i}`}
            role="tab"
            aria-selected=${isActive ? "true" : "false"}
            aria-controls=${`ce-tabs-panel-${this.#instanceId}-${i}`}
            tabindex=${isActive ? 0 : -1}
            ?disabled=${!!t.disabled}
            @click=${() => this.#select(i)}
            @keydown=${(e: KeyboardEvent) => this.#onKey(e, i)}
          >
            <span>${t.label}</span>
            ${t.badge !== undefined && t.badge !== ""
              ? html`<span class="badge">${t.badge}</span>`
              : ""}
          </button>`;
        })}
      </div>
      <div class="body">
        <slot name="panel" @slotchange=${this.#onSlotPanelChange}></slot>
      </div>
    `;
  }
}
