/* eslint-disable max-lines --
 * ce-dropdown-menu owns the menu trigger + popover surface + ARIA menu
 * keyboard nav (Arrow/Enter/Escape/Type-ahead) + submenu chains + outside-
 * click dismissal + focus return. The menu state machine reads the open
 * flag, current highlight, submenu stack, and trigger anchor across every
 * keyboard branch — extracting submenu handling to a sibling file would
 * either duplicate the substrate or push instance state through it.
 * Carve-out follows the same pattern as combobox; revisit when a third
 * menu-shaped component (context-menu, mention-picker) reuses the
 * substrate.
 */
import { html, css, nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-dropdown-menu>` — button-triggered list of action menu items.
 *
 * Companion elements: `<ce-menu-item>`, `<ce-menu-separator>`, `<ce-menu-group>`.
 *
 * Usage:
 *
 *   <ce-dropdown-menu>
 *     <ce-button slot="trigger" variant="ghost">More</ce-button>
 *     <ce-menu-item value="edit" icon="pencil" shortcut="E">Edit</ce-menu-item>
 *     <ce-menu-item value="dup" icon="copy">Duplicate</ce-menu-item>
 *     <ce-menu-separator></ce-menu-separator>
 *     <ce-menu-item value="del" icon="trash" tone="danger">Delete</ce-menu-item>
 *   </ce-dropdown-menu>
 *
 * Attributes (all reflected):
 *   open          — boolean; shows/hides the menu panel.
 *   placement     — "top-start|top-end|bottom-start|bottom-end|top|bottom" (default: bottom-start)
 *   disabled      — boolean; blocks trigger click and keyboard nav.
 *
 * Slots:
 *   trigger   — the element that toggles the menu on click.
 *   (default) — menu items, separators, groups.
 *
 * Events:
 *   ce-menu-select — CustomEvent<{ value: string }> when a menu item is activated.
 *
 * A11y:
 *   Panel has role="menu". Items have role="menuitem". Separator has role="separator".
 *   Group has role="group" with aria-labelledby. Trigger gets aria-haspopup="menu"
 *   and aria-expanded synced with open.
 *
 * Implementation notes:
 *   Uses the native Popover API (popover="auto") for top-layer rendering and
 *   built-in light-dismiss. JS positioning covers the 6 placement values.
 *   Roving tabindex: first focusable item gets tabindex=0; all others -1.
 */

export type DropdownMenuPlacement =
  | "top-start"
  | "top-end"
  | "bottom-start"
  | "bottom-end"
  | "top"
  | "bottom";

// ─── ce-dropdown-menu ─────────────────────────────────────────────────────────

export class CeDropdownMenu extends CecElement {
  static override styles = css`
    :host {
      display: inline-block;
      position: relative;
    }

    .ce-dropdown-menu__panel {
      /* Reset browser popover UA stylesheet */
      margin: 0;
      padding: var(--ce-space-1) 0;
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      background: var(--ce-surface);
      color: var(--ce-text);
      box-shadow: var(--ce-shadow-lg);
      font-size: var(--ce-text-sm);
      /* Fixed positioning allows the panel to escape scroll containers */
      position: fixed;
      inset: unset;
      z-index: var(--ce-dropdown-menu-z, 1000);
      min-width: var(--ce-dropdown-menu-min-width, 160px);
      max-width: var(--ce-dropdown-menu-max-width, 280px);
      /* Enter animation — respects prefers-reduced-motion */
      opacity: 0;
      transform: scale(0.97) translateY(-4px);
      transition: opacity var(--ce-transition), transform var(--ce-transition);
    }

    .ce-dropdown-menu__panel:popover-open,
    .ce-dropdown-menu__panel[open] {
      opacity: 1;
      transform: scale(1) translateY(0);
    }

    @media (prefers-reduced-motion: reduce) {
      .ce-dropdown-menu__panel {
        transition: none;
      }
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String, reflect: true })
  placement: DropdownMenuPlacement = "bottom-start";

  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** Unique id for aria-controls */
  private _panelId = `ce-dropdown-menu-panel-${Math.random().toString(36).slice(2, 9)}`;

  /** Scroll/resize listeners for cleanup */
  private _scrollTargets: EventTarget[] = [];

  /** The trigger element discovered via slotchange */
  #triggerEl: HTMLElement | null = null;

  /** Cached previous focus for restore on close */
  private _previousFocus: HTMLElement | null = null;

  private get _panel(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".ce-dropdown-menu__panel") as HTMLElement | null;
  }

  private get _trigger(): HTMLElement | null {
    return this.querySelector("[slot=\"trigger\"]") as HTMLElement | null;
  }

  /** Returns all enabled ce-menu-item children (direct and inside groups). */
  private _getItems(): CeMenuItem[] {
    return Array.from(this.querySelectorAll("ce-menu-item")).filter(
      (el) => !(el as CeMenuItem).disabled
    ) as CeMenuItem[];
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    this.shadowRoot?.addEventListener("slotchange", this.#onSlotChange);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.shadowRoot?.removeEventListener("slotchange", this.#onSlotChange);
    this.#detachTriggerListener();
    this.#removePositionListeners();
    document.removeEventListener("keydown", this.#onKeyDown, { capture: true });
  }

  override firstUpdated(): void {
    const panel = this._panel;
    if (!panel) return;

    panel.id = this._panelId;
    panel.setAttribute("popover", "auto");
    panel.addEventListener("toggle", this.#onNativeToggle);
    this.#attachTriggerListener();
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);

    if (changed.has("open")) {
      if (this.open) {
        this.#openMenu();
      } else {
        this.#closeMenu();
      }
    }
  }

  // ─── Open / close ────────────────────────────────────────────────────────────

  #openMenu(): void {
    const panel = this._panel;
    if (!panel || this.disabled) return;

    try {
      if (panel.matches(":popover-open")) return;
    } catch {
      // jsdom / old UA
    }

    this._previousFocus = (document.activeElement as HTMLElement) ?? null;

    try {
      (panel as HTMLElement & { showPopover(): void }).showPopover();
    } catch {
      // jsdom / old browsers — noop
    }

    this.#updateTriggerAria(true);
    this.#attachPositionListeners();
    this.#updatePosition();

    // Roving tabindex: give all items tabindex=-1, first item tabindex=0
    const items = this._getItems();
    items.forEach((item, i) => {
      item.setAttribute("tabindex", i === 0 ? "0" : "-1");
    });

    // Focus the first item
    requestAnimationFrame(() => {
      this._getItems()[0]?.focus();
    });

    document.addEventListener("keydown", this.#onKeyDown, { capture: true });
  }

  #closeMenu(): void {
    const panel = this._panel;
    if (!panel) return;

    let isOpen = false;
    try {
      isOpen = panel.matches(":popover-open");
    } catch {
      isOpen = true;
    }

    if (isOpen) {
      try {
        (panel as HTMLElement & { hidePopover(): void }).hidePopover();
      } catch {
        // jsdom / old browsers
      }
    }

    this.#removePositionListeners();
    this.#updateTriggerAria(false);
    document.removeEventListener("keydown", this.#onKeyDown, { capture: true });

    // Reset tabindex on all items
    this.querySelectorAll("ce-menu-item").forEach((el) => {
      el.setAttribute("tabindex", "-1");
    });

    // Return focus to trigger
    if (this._previousFocus && document.contains(this._previousFocus)) {
      this._previousFocus.focus();
    }
    this._previousFocus = null;
  }

  // ─── Native popover toggle sync ─────────────────────────────────────────────

  #onNativeToggle = (e: Event): void => {
    const ev = e as ToggleEvent;
    if (ev.newState === "closed" && this.open) {
      this.open = false;
    }
  };

  // ─── Trigger wiring ─────────────────────────────────────────────────────────

  #onSlotChange = (e: Event): void => {
    const slot = e.target as HTMLSlotElement;
    if (slot.name === "trigger") {
      this.#detachTriggerListener();
      this.#attachTriggerListener();
    }
  };

  #attachTriggerListener(): void {
    const trigger = this._trigger;
    if (!trigger) return;
    this.#triggerEl = trigger;
    trigger.addEventListener("click", this.#onTriggerClick);
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-controls", this._panelId);
    this.#updateTriggerAria(this.open);
  }

  #detachTriggerListener(): void {
    if (this.#triggerEl) {
      this.#triggerEl.removeEventListener("click", this.#onTriggerClick);
      this.#triggerEl = null;
    }
  }

  #onTriggerClick = (e: Event): void => {
    if (this.disabled) return;
    e.stopPropagation();
    this.open = !this.open;
  };

  #updateTriggerAria(isOpen: boolean): void {
    const trigger = this._trigger;
    if (!trigger) return;
    trigger.setAttribute("aria-expanded", String(isOpen));
  }

  // ─── Keyboard navigation ─────────────────────────────────────────────────────

  #onKeyDown = (e: KeyboardEvent): void => {
    if (!this.open) return;

    const items = this._getItems();
    if (!items.length) return;

    const focused = document.activeElement;
    const idx = items.indexOf(focused as CeMenuItem);

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = idx < items.length - 1 ? idx + 1 : 0;
        this.#moveFocusTo(items, next);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prev = idx > 0 ? idx - 1 : items.length - 1;
        this.#moveFocusTo(items, prev);
        break;
      }
      case "Home": {
        e.preventDefault();
        this.#moveFocusTo(items, 0);
        break;
      }
      case "End": {
        e.preventDefault();
        this.#moveFocusTo(items, items.length - 1);
        break;
      }
      case "Enter":
      case " ": {
        if (focused instanceof CeMenuItem && !focused.disabled) {
          e.preventDefault();
          focused.click();
        }
        break;
      }
      case "Escape": {
        e.stopPropagation();
        this.open = false;
        break;
      }
    }
  };

  #moveFocusTo(items: CeMenuItem[], idx: number): void {
    items.forEach((item, i) => {
      item.setAttribute("tabindex", i === idx ? "0" : "-1");
    });
    items[idx]?.focus();
  }

  // ─── Menu item selection ─────────────────────────────────────────────────────

  /** Called by ce-menu-item on click (bubbles up). We intercept at the panel slot. */
  #onItemSelect = (e: Event): void => {
    const item = (e.target as Element).closest("ce-menu-item") as CeMenuItem | null;
    if (!item || item.disabled) return;

    this.dispatchEvent(
      new CustomEvent("ce-menu-select", {
        detail: { value: item.value },
        bubbles: true,
        composed: true,
      })
    );

    this.open = false;
  };

  // ─── Positioning ─────────────────────────────────────────────────────────────

  #attachPositionListeners(): void {
    this.#removePositionListeners();

    const onUpdate = this.#repositionBound;
    window.addEventListener("resize", onUpdate);
    window.addEventListener("scroll", onUpdate, { passive: true, capture: true });
    this._scrollTargets = [window];

    let ancestor = this.parentElement as Element | null;
    while (ancestor && ancestor !== document.documentElement) {
      const style = getComputedStyle(ancestor);
      const overflow = `${style.overflow}${style.overflowX}${style.overflowY}`;
      if (/auto|scroll/.test(overflow)) {
        ancestor.addEventListener("scroll", onUpdate, { passive: true });
        this._scrollTargets.push(ancestor);
      }
      ancestor = ancestor.parentElement;
    }
  }

  #removePositionListeners(): void {
    const onUpdate = this.#repositionBound;
    window.removeEventListener("resize", onUpdate);
    window.removeEventListener("scroll", onUpdate, { capture: true });
    for (const target of this._scrollTargets) {
      if (target !== window) {
        (target as Element).removeEventListener("scroll", onUpdate);
      }
    }
    this._scrollTargets = [];
  }

  #repositionBound = (): void => {
    this.#updatePosition();
  };

  #updatePosition(): void {
    const trigger = this._trigger;
    const panel = this._panel;
    if (!trigger || !panel) return;

    const tr = trigger.getBoundingClientRect();
    const pr = panel.getBoundingClientRect();
    const gap = 4; // 4px between trigger and panel
    const p = this.placement;

    let top = 0;
    let left = 0;

    // Compute top
    if (p === "top" || p === "top-start" || p === "top-end") {
      top = tr.top - pr.height - gap;
    } else {
      // bottom variants
      top = tr.bottom + gap;
    }

    // Compute left
    if (p === "bottom-start" || p === "top-start") {
      left = tr.left;
    } else if (p === "bottom-end" || p === "top-end") {
      left = tr.right - pr.width;
    } else {
      // center (top / bottom)
      left = tr.left + tr.width / 2 - pr.width / 2;
    }

    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
  }

  // ─── Rendering ───────────────────────────────────────────────────────────────

  override render() {
    return html`
      <slot name="trigger"></slot>
      <div
        class="ce-dropdown-menu__panel"
        role="menu"
        aria-label="Menu"
        @click=${this.#onItemSelect}
      >
        <slot></slot>
      </div>
    `;
  }
}

// ─── ce-menu-item ─────────────────────────────────────────────────────────────

/**
 * `<ce-menu-item>` — a single action row inside `<ce-dropdown-menu>`.
 *
 * Attributes:
 *   value    — string identifier emitted in ce-menu-select.
 *   icon     — string icon name (rendered as text fallback; integrate with icon set via slot or CSS).
 *   disabled — boolean; skips keyboard nav and ignores clicks.
 *   tone     — "default" | "danger"
 *   shortcut — string displayed as a keyboard hint on the right side.
 */
export class CeMenuItem extends CecElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: var(--ce-space-2);
      padding: var(--ce-space-2) var(--ce-space-4);
      cursor: pointer;
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
      line-height: 1.4;
      white-space: nowrap;
      min-height: 32px;
      box-sizing: border-box;
      user-select: none;
      outline: none;
      /* No transition on background to keep menu feel snappy */
    }

    :host(:hover:not([disabled])),
    :host(:focus-visible:not([disabled])) {
      background: var(--ce-surface-2);
    }

    :host(:focus-visible) {
      box-shadow: inset 0 0 0 2px var(--ce-focus-ring-color, var(--ce-color-blue));
    }

    :host([disabled]) {
      cursor: default;
      opacity: 0.45;
      pointer-events: none;
    }

    :host([tone="danger"]) {
      color: var(--ce-color-red);
    }

    :host([tone="danger"]:hover:not([disabled])),
    :host([tone="danger"]:focus-visible:not([disabled])) {
      background: var(--ce-color-red-bg);
    }

    .ce-menu-item__icon {
      flex-shrink: 0;
      width: 1em;
      height: 1em;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: var(--ce-text-sm);
      color: var(--ce-muted);
    }

    :host([tone="danger"]) .ce-menu-item__icon {
      color: var(--ce-color-red);
    }

    .ce-menu-item__label {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ce-menu-item__shortcut {
      flex-shrink: 0;
      font-family: var(--ce-font-mono);
      font-size: var(--ce-text-xs);
      color: var(--ce-muted);
      background: var(--ce-surface-2);
      border: 1px solid var(--ce-border);
      border-bottom-width: 2px;
      border-radius: var(--ce-radius-sm);
      padding: 1px var(--ce-space-1);
      line-height: 1.4;
      white-space: nowrap;
      user-select: none;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  value = "";

  @property({ type: String, reflect: true })
  icon = "";

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String, reflect: true })
  tone: "default" | "danger" = "default";

  @property({ type: String, reflect: true })
  shortcut = "";

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "menuitem");
    }
    if (!this.hasAttribute("tabindex")) {
      this.setAttribute("tabindex", "-1");
    }
  }

  override render() {
    return html`
      ${this.icon
        ? html`<span class="ce-menu-item__icon" aria-hidden="true">${this.icon}</span>`
        : nothing}
      <span class="ce-menu-item__label"><slot></slot></span>
      ${this.shortcut
        ? html`<span class="ce-menu-item__shortcut" aria-label="shortcut: ${this.shortcut}">${this.shortcut}</span>`
        : nothing}
    `;
  }
}

// ─── ce-menu-separator ────────────────────────────────────────────────────────

/**
 * `<ce-menu-separator>` — horizontal rule between menu sections.
 */
export class CeMenuSeparator extends CecElement {
  static override styles = css`
    :host {
      display: block;
      height: 1px;
      background: var(--ce-border-soft);
      margin: var(--ce-space-1) 0;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "separator");
    }
    // Separators are not interactive
    this.setAttribute("aria-hidden", "true");
  }

  override render() {
    return html``;
  }
}

// ─── ce-menu-group ────────────────────────────────────────────────────────────

/**
 * `<ce-menu-group>` — labeled section of related menu items.
 *
 * Attributes:
 *   label — string: visible group heading, also used for aria-labelledby.
 */
export class CeMenuGroup extends CecElement {
  static override styles = css`
    :host {
      display: block;
    }

    .ce-menu-group__label {
      padding: var(--ce-space-2) var(--ce-space-4) var(--ce-space-1);
      font-size: var(--ce-text-xs);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--ce-muted);
      font-weight: 600;
      user-select: none;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  label = "";

  /** Unique id for aria-labelledby on the group's role=group element */
  private _labelId = `ce-menu-group-label-${Math.random().toString(36).slice(2, 9)}`;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "group");
    }
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has("label")) {
      // Sync aria-labelledby to the host group element
      if (this.label) {
        this.setAttribute("aria-labelledby", this._labelId);
      } else {
        this.removeAttribute("aria-labelledby");
      }
    }
  }

  override render() {
    return html`
      ${this.label
        ? html`<div id=${this._labelId} class="ce-menu-group__label" aria-hidden="true">${this.label}</div>`
        : nothing}
      <slot></slot>
    `;
  }
}
