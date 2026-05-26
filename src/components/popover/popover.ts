import { html, css, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-popover>` — anchored, non-modal floating panel (universal overlay primitive).
 *
 * Usage:
 *
 *   <ce-popover placement="bottom-start" arrow>
 *     <ce-button slot="trigger">Filters</ce-button>
 *     <div>Panel body</div>
 *   </ce-popover>
 *
 *   <ce-popover placement="right" offset="12">
 *     <ce-button slot="trigger" variant="ghost">?</ce-button>
 *     <p>Inline help content.</p>
 *   </ce-popover>
 *
 * Attributes (all reflected):
 *   open          — boolean; shows/hides the panel.
 *   placement     — "top|top-start|top-end|bottom|bottom-start|bottom-end|left|right" (default: bottom-start)
 *   offset        — number, px distance between trigger and panel (default: 8).
 *   arrow         — boolean; renders a small directional arrow on the panel.
 *   light-dismiss — boolean; default true. When false, outside-click and Escape don't close.
 *
 * Slots:
 *   trigger   — the element that toggles the panel on click.
 *   (default) — panel body content.
 *
 * Methods:
 *   show()   — opens the panel.
 *   hide()   — closes the panel.
 *   toggle() — flips the current state.
 *
 * Events:
 *   ce-popover-open  — fires when the panel opens.
 *   ce-popover-close — fires when the panel closes.
 *
 * A11y:
 *   The slotted trigger receives aria-expanded, aria-haspopup, and aria-controls.
 *   On open, focus moves to the panel (tabindex=-1). On close, focus returns to the trigger.
 *
 * Implementation notes:
 *   Uses the native Popover API (popover="auto"|"manual") for top-layer rendering,
 *   light-dismiss, and Escape handling. JS positioning math handles placement for the
 *   8 standard anchor points; CSS anchor-positioning is deferred to v2.
 */

export type PopoverPlacement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "right";

export class CePopover extends CecElement {
  static override styles = css`
    :host {
      display: inline-block;
      position: relative;
    }

    .ce-popover__panel {
      /* Reset browser popover UA stylesheet */
      margin: 0;
      padding: var(--ce-space-4) var(--ce-space-5);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      background: var(--ce-surface);
      color: var(--ce-text);
      box-shadow: var(--ce-shadow-lg);
      font-size: var(--ce-text-sm);
      /* Fixed positioning allows the panel to escape scroll containers */
      position: fixed;
      inset: unset;
      z-index: var(--ce-popover-z, 1000);
      max-width: var(--ce-popover-max-width, 320px);
      /* Enter animation — respects prefers-reduced-motion */
      opacity: 0;
      transform: scale(0.97) translateY(-4px);
      transition: opacity var(--ce-transition), transform var(--ce-transition);
    }

    /* Popover open state — :popover-open is the spec selector; :is([open]) fallback */
    .ce-popover__panel:popover-open,
    .ce-popover__panel[open] {
      opacity: 1;
      transform: scale(1) translateY(0);
    }

    @media (prefers-reduced-motion: reduce) {
      .ce-popover__panel {
        transition: none;
      }
    }

    /* Arrow */
    .ce-popover__arrow {
      display: none;
      position: absolute;
      width: 8px;
      height: 8px;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      transform: rotate(45deg);
    }

    :host([arrow]) .ce-popover__arrow {
      display: block;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String, reflect: true })
  placement: PopoverPlacement = "bottom-start";

  @property({ type: Number, reflect: true })
  offset = 8;

  @property({ type: Boolean, reflect: true })
  arrow = false;

  @property({ attribute: "light-dismiss", type: Boolean, reflect: true })
  lightDismiss = true;

  /** The element that had focus before the panel opened. */
  private _previousFocus: HTMLElement | null = null;

  /** Unique id for aria-controls */
  private _panelId = `ce-popover-panel-${Math.random().toString(36).slice(2, 9)}`;

  /** Cached scroll/resize listeners for cleanup */
  private _scrollTargets: EventTarget[] = [];

  private get _panel(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".ce-popover__panel") as HTMLElement | null;
  }

  private get _trigger(): HTMLElement | null {
    return this.querySelector("[slot=\"trigger\"]") as HTMLElement | null;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    // Wire trigger clicks via slotchange so late-appended triggers work too
    this.shadowRoot?.addEventListener("slotchange", this.#onSlotChange);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.shadowRoot?.removeEventListener("slotchange", this.#onSlotChange);
    this.#detachTriggerListener();
    this.#removePositionListeners();
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);

    if (changed.has("open")) {
      if (this.open) {
        this.#openPanel();
      } else {
        this.#closePanel();
      }
    }

    if (changed.has("lightDismiss") && this._panel) {
      this._panel.setAttribute(
        "popover",
        this.lightDismiss ? "auto" : "manual"
      );
    }
  }

  override firstUpdated(): void {
    const panel = this._panel;
    if (!panel) return;

    panel.id = this._panelId;
    panel.setAttribute("popover", this.lightDismiss ? "auto" : "manual");

    // Listen for native popover toggle (e.g. outside-click, Escape via auto popover)
    panel.addEventListener("toggle", this.#onNativeToggle);

    // Wire the trigger slot's current assignee
    this.#attachTriggerListener();
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /** Opens the popover panel. */
  show(): void {
    this.open = true;
  }

  /** Closes the popover panel. */
  hide(): void {
    this.open = false;
  }

  /** Flips the current open state. */
  toggle(): void {
    this.open = !this.open;
  }

  // ─── Rendering ──────────────────────────────────────────────────────────────

  override render() {
    return html`
      <slot name="trigger"></slot>
      <div
        class="ce-popover__panel"
        role="dialog"
        tabindex="-1"
        aria-label="Popover"
      >
        ${this.arrow ? html`<span class="ce-popover__arrow" aria-hidden="true"></span>` : ""}
        <slot></slot>
      </div>
    `;
  }

  // ─── Open / close internals ─────────────────────────────────────────────────

  #openPanel(): void {
    const panel = this._panel;
    const trigger = this._trigger;
    if (!panel) return;

    // Guard: already open in the top layer.
    // Wrapped in try/catch because jsdom throws on :popover-open pseudo-class.
    try {
      if (panel.matches(":popover-open")) return;
    } catch {
      // jsdom / old UA — ignore the guard, proceed to showPopover()
    }

    this._previousFocus = (document.activeElement as HTMLElement) ?? null;

    try {
      (panel as HTMLElement & { showPopover(): void }).showPopover();
    } catch {
      // jsdom / old browsers — noop; the panel remains in-flow
    }

    this.#updateTriggerAria(true);
    this.#attachPositionListeners();
    this.#updatePosition();

    // Move focus to panel
    panel.focus();

    this.dispatchEvent(
      new CustomEvent("ce-popover-open", { bubbles: true, composed: true })
    );

    // When panel is not light-dismissible, we own the Escape key
    if (!this.lightDismiss) {
      document.addEventListener("keydown", this.#onEscapeKey, { capture: true });
    }

    if (trigger) {
      trigger.setAttribute("aria-controls", this._panelId);
    }
  }

  #closePanel(): void {
    const panel = this._panel;
    if (!panel) return;

    // Check if currently in the top layer; if so, remove.
    // Wrapped in try/catch: jsdom throws on :popover-open pseudo-class.
    let isPopoverOpen = false;
    try {
      isPopoverOpen = panel.matches(":popover-open");
    } catch {
      // jsdom / old UA — assume open if the component says so, and proceed
      isPopoverOpen = true;
    }

    if (isPopoverOpen) {
      try {
        (panel as HTMLElement & { hidePopover(): void }).hidePopover();
      } catch {
        // jsdom / old browsers — noop
      }
    }

    this.#removePositionListeners();
    this.#updateTriggerAria(false);

    document.removeEventListener("keydown", this.#onEscapeKey, { capture: true });

    // Return focus to trigger
    if (
      this._previousFocus &&
      document.contains(this._previousFocus)
    ) {
      this._previousFocus.focus();
    }
    this._previousFocus = null;

    this.dispatchEvent(
      new CustomEvent("ce-popover-close", { bubbles: true, composed: true })
    );
  }

  // ─── Native popover toggle sync ─────────────────────────────────────────────

  #onNativeToggle = (e: Event): void => {
    const ev = e as ToggleEvent;
    if (ev.newState === "closed" && this.open) {
      // Browser dismissed via outside-click or Escape; sync back
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

  #triggerEl: HTMLElement | null = null;

  #attachTriggerListener(): void {
    const trigger = this._trigger;
    if (!trigger) return;
    this.#triggerEl = trigger;
    trigger.addEventListener("click", this.#onTriggerClick);
    this.#updateTriggerAria(this.open);
    trigger.setAttribute("aria-haspopup", "true");
    trigger.setAttribute("aria-controls", this._panelId);
  }

  #detachTriggerListener(): void {
    if (this.#triggerEl) {
      this.#triggerEl.removeEventListener("click", this.#onTriggerClick);
      this.#triggerEl = null;
    }
  }

  #onTriggerClick = (e: Event): void => {
    e.stopPropagation();
    this.toggle();
  };

  #updateTriggerAria(isOpen: boolean): void {
    const trigger = this._trigger;
    if (!trigger) return;
    trigger.setAttribute("aria-expanded", String(isOpen));
  }

  // ─── Escape key (manual popover only) ───────────────────────────────────────

  #onEscapeKey = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      e.stopPropagation();
      this.hide();
    }
  };

  // ─── Positioning ────────────────────────────────────────────────────────────

  #attachPositionListeners(): void {
    this.#removePositionListeners();

    const onUpdate = this.#repositionBound;
    window.addEventListener("resize", onUpdate);
    window.addEventListener("scroll", onUpdate, { passive: true, capture: true });

    this._scrollTargets = [window];

    // Also listen on scroll ancestors
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

  #computeTop(p: string, tr: DOMRect, pr: DOMRect, gap: number): number {
    if (p.startsWith("top")) return tr.top - pr.height - gap;
    if (p.startsWith("bottom")) return tr.bottom + gap;
    if (p === "left" || p === "right") return tr.top + tr.height / 2 - pr.height / 2;
    return 0;
  }

  #computeLeft(p: string, tr: DOMRect, pr: DOMRect, gap: number): number {
    if (p === "bottom-start" || p === "top-start") return tr.left;
    if (p === "bottom-end" || p === "top-end") return tr.right - pr.width;
    if (p === "bottom" || p === "top") return tr.left + tr.width / 2 - pr.width / 2;
    if (p === "left") return tr.left - pr.width - gap;
    if (p === "right") return tr.right + gap;
    return 0;
  }

  #updatePosition(): void {
    const trigger = this._trigger;
    const panel = this._panel;
    if (!trigger || !panel) return;

    const tr = trigger.getBoundingClientRect();
    const pr = panel.getBoundingClientRect();
    const gap = this.offset;
    const p = this.placement;

    const top = this.#computeTop(p, tr, pr, gap);
    const left = this.#computeLeft(p, tr, pr, gap);

    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;

    // Position arrow
    this.#updateArrow(tr, pr, top, left);
  }

  #updateArrow(
    tr: DOMRect,
    _pr: DOMRect,
    panelTop: number,
    panelLeft: number
  ): void {
    if (!this.arrow) return;
    const arrowEl = this._panel?.querySelector(".ce-popover__arrow") as HTMLElement | null;
    if (!arrowEl) return;

    const p = this.placement;
    // Reset
    arrowEl.removeAttribute("style");

    const half = 4; // half of 8px arrow

    if (p.startsWith("bottom")) {
      // Arrow points up, on top edge of panel
      arrowEl.style.top = `${-half - 1}px`;
      arrowEl.style.left = `${tr.left + tr.width / 2 - panelLeft - half}px`;
      arrowEl.style.borderRight = "none";
      arrowEl.style.borderBottom = "none";
    } else if (p.startsWith("top")) {
      // Arrow points down, on bottom edge of panel
      arrowEl.style.bottom = `${-half - 1}px`;
      arrowEl.style.left = `${tr.left + tr.width / 2 - panelLeft - half}px`;
      arrowEl.style.borderLeft = "none";
      arrowEl.style.borderTop = "none";
    } else if (p === "right") {
      // Arrow points left, on left edge of panel
      arrowEl.style.left = `${-half - 1}px`;
      arrowEl.style.top = `${tr.top + tr.height / 2 - panelTop - half}px`;
      arrowEl.style.borderRight = "none";
      arrowEl.style.borderTop = "none";
    } else if (p === "left") {
      // Arrow points right, on right edge of panel
      arrowEl.style.right = `${-half - 1}px`;
      arrowEl.style.top = `${tr.top + tr.height / 2 - panelTop - half}px`;
      arrowEl.style.borderLeft = "none";
      arrowEl.style.borderBottom = "none";
    }
  }
}
