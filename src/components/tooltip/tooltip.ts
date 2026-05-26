import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-tooltip>` — non-interactive tip surfaced on hover/focus of a target element.
 *
 * Usage:
 *
 *   <!-- Text via attribute -->
 *   <ce-icon name="info" id="i1"></ce-icon>
 *   <ce-tooltip for="i1" text="Net new active users in the last 7 days"></ce-tooltip>
 *
 *   <!-- Rich content via default slot -->
 *   <button id="save-btn">Save</button>
 *   <ce-tooltip for="save-btn" placement="bottom">
 *     Saves and closes the dialog.
 *   </ce-tooltip>
 *
 *   <!-- Custom delay -->
 *   <a id="learn" href="/docs">Learn more</a>
 *   <ce-tooltip for="learn" placement="right" delay="500">
 *     Opens the docs in a new tab.
 *   </ce-tooltip>
 *
 * Attributes (all reflected):
 *   for       — id of the target element to anchor to (required).
 *   text      — fallback string content when no slot children are provided.
 *   placement — "top|bottom|left|right" (default: "top").
 *   delay     — ms before showing after hover/focus (default: 300). Hide is always immediate.
 *
 * Slots:
 *   (default) — tooltip content (preferred over text attr for rich content).
 *
 * A11y:
 *   Host carries role="tooltip" and an auto-generated id (ce-tooltip-<n>).
 *   When visible, aria-describedby is set on the target element pointing at
 *   this tooltip's id. On hide, aria-describedby is removed from the target.
 *   The tooltip is NOT focusable (pointer-events: none; not in tab order).
 *
 * Implementation:
 *   Uses the native Popover API (popover="manual") for top-layer rendering.
 *   Positions itself via getBoundingClientRect() relative to the target element.
 *   Repositions on scroll and resize while visible.
 *
 * @stability experimental
 */

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

/** Auto-incrementing id counter for aria-describedby wiring. */
let _idCounter = 0;

export class CeTooltip extends CecElement {
  static override styles = css`
    :host {
      display: none;
    }

    .ce-tooltip__bubble {
      /* Reset browser popover UA stylesheet */
      margin: 0;
      padding: var(--ce-space-2) var(--ce-space-3);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-sm, var(--ce-radius));
      background: var(--ce-surface-raised, var(--ce-surface));
      color: var(--ce-text);
      box-shadow: var(--ce-shadow);
      font-size: var(--ce-text-xs, var(--ce-text-sm));
      line-height: var(--ce-leading-snug, 1.4);
      /* Fixed positioning lets the tooltip escape scroll containers */
      position: fixed;
      inset: unset;
      z-index: var(--ce-tooltip-z, 1100);
      max-width: var(--ce-tooltip-max-width, 240px);
      /* The tooltip must NOT be interactive */
      pointer-events: none;
      /* Enter animation — respects prefers-reduced-motion */
      opacity: 0;
      transform: scale(0.96);
      transition: opacity var(--ce-transition, 120ms ease), transform var(--ce-transition, 120ms ease);
      /* White-space so single-line tips don't wrap unexpectedly */
      white-space: normal;
      word-break: break-word;
    }

    /* :popover-open is the spec selector when the bubble is in the top layer. */
    .ce-tooltip__bubble:popover-open,
    .ce-tooltip__bubble[open] {
      opacity: 1;
      transform: scale(1);
    }

    @media (prefers-reduced-motion: reduce) {
      .ce-tooltip__bubble {
        transition: none;
      }
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  // ─── Public properties ───────────────────────────────────────────────────────

  /** Id of the target element this tooltip anchors to. */
  @property({ type: String, reflect: true, attribute: "for" })
  for = "";

  /** Preferred placement relative to the target. */
  @property({ type: String, reflect: true })
  placement: TooltipPlacement = "top";

  /** Delay in ms before showing after mouseenter/focusin. */
  @property({ type: Number, reflect: true })
  delay = 300;

  /** Plain-text fallback when no slot children are provided. */
  @property({ type: String, reflect: true })
  text = "";

  // ─── Private state ───────────────────────────────────────────────────────────

  /** Stable id for aria-describedby wiring. */
  private readonly _tooltipId: string;

  /** The resolved target element (found once on connect, re-resolved on `for` change). */
  private _target: HTMLElement | null = null;

  /** Show-delay timer handle. */
  private _showTimer: ReturnType<typeof setTimeout> | null = null;

  /** Whether the bubble is currently in the top layer. */
  private _visible = false;

  /** Whether we've already warned about a missing target (warn once). */
  private _warnedMissingTarget = false;

  /** Bound listener references for cleanup. */
  private readonly _onTargetEnter: (e: Event) => void;
  private readonly _onTargetLeave: (e: Event) => void;
  private readonly _onTargetFocusIn: (e: Event) => void;
  private readonly _onTargetFocusOut: (e: Event) => void;
  private readonly _onReposition: () => void;

  constructor() {
    super();
    this._tooltipId = `ce-tooltip-${++_idCounter}`;
    this._onTargetEnter = () => this.#scheduleShow();
    this._onTargetLeave = () => this.#immediateHide();
    this._onTargetFocusIn = () => this.#scheduleShow();
    this._onTargetFocusOut = () => this.#immediateHide();
    this._onReposition = () => { if (this._visible) this.#updatePosition(); };
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    // Set tooltip role and id on the host so aria-describedby resolves correctly.
    this.setAttribute("role", "tooltip");
    if (!this.id) {
      this.id = this._tooltipId;
    }
    this.#attachTarget();
    this.#attachScrollResizeListeners();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#clearShowTimer();
    this.#detachTarget();
    this.#detachScrollResizeListeners();
  }

  override updated(changed: Map<PropertyKey, unknown>): void {
    super.updated(changed);
    if (changed.has("for")) {
      // Target element changed — re-wire listeners.
      this.#detachTarget();
      this._warnedMissingTarget = false;
      this.#attachTarget();
    }
  }

  // ─── Rendering ───────────────────────────────────────────────────────────────

  override render() {
    return html`
      <div
        class="ce-tooltip__bubble"
        part="bubble"
        tabindex="-1"
        aria-hidden="true"
      >
        ${this.text ? html`${this.text}` : ""}
        <slot></slot>
      </div>
    `;
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /** Shows the tooltip immediately (bypasses delay). */
  show(): void {
    this.#clearShowTimer();
    this.#doShow();
  }

  /** Hides the tooltip immediately. */
  hide(): void {
    this.#immediateHide();
  }

  // ─── Target wiring ───────────────────────────────────────────────────────────

  #attachTarget(): void {
    if (!this.for) return;
    const target = document.getElementById(this.for);
    if (!target) {
      if (!this._warnedMissingTarget) {
        this.setAttribute("data-ce-error", "target-not-found");
        this._warnedMissingTarget = true;
      }
      return;
    }
    this._target = target;
    target.addEventListener("mouseenter", this._onTargetEnter);
    target.addEventListener("mouseleave", this._onTargetLeave);
    target.addEventListener("focusin", this._onTargetFocusIn);
    target.addEventListener("focusout", this._onTargetFocusOut);
  }

  #detachTarget(): void {
    const target = this._target;
    if (!target) return;
    target.removeEventListener("mouseenter", this._onTargetEnter);
    target.removeEventListener("mouseleave", this._onTargetLeave);
    target.removeEventListener("focusin", this._onTargetFocusIn);
    target.removeEventListener("focusout", this._onTargetFocusOut);
    // Clean up aria-describedby if we set it
    if (target.getAttribute("aria-describedby") === this.id) {
      target.removeAttribute("aria-describedby");
    }
    this._target = null;
  }

  // ─── Show / hide logic ───────────────────────────────────────────────────────

  #scheduleShow(): void {
    this.#clearShowTimer();
    if (this.delay <= 0) {
      this.#doShow();
      return;
    }
    this._showTimer = setTimeout(() => {
      this._showTimer = null;
      this.#doShow();
    }, this.delay);
  }

  #immediateHide(): void {
    this.#clearShowTimer();
    this.#doHide();
  }

  #clearShowTimer(): void {
    if (this._showTimer !== null) {
      clearTimeout(this._showTimer);
      this._showTimer = null;
    }
  }

  #doShow(): void {
    if (this._visible) return;
    const bubble = this.#bubble;
    if (!bubble) return;

    this._visible = true;

    // Update position before revealing to avoid flicker.
    this.#updatePosition();

    try {
      (bubble as HTMLElement & { showPopover(): void }).showPopover();
    } catch {
      // jsdom / legacy UA — noop; bubble is in-flow but non-interactive.
    }

    // Wire aria-describedby on the target.
    if (this._target) {
      this._target.setAttribute("aria-describedby", this.id || this._tooltipId);
    }
  }

  #doHide(): void {
    if (!this._visible) return;
    const bubble = this.#bubble;
    if (!bubble) return;

    this._visible = false;

    let isOpen = false;
    try {
      isOpen = bubble.matches(":popover-open");
    } catch {
      // jsdom — treat as open.
      isOpen = true;
    }

    if (isOpen) {
      try {
        (bubble as HTMLElement & { hidePopover(): void }).hidePopover();
      } catch {
        // jsdom / legacy UA — noop.
      }
    }

    // Remove aria-describedby from the target.
    if (this._target) {
      if (this._target.getAttribute("aria-describedby") === (this.id || this._tooltipId)) {
        this._target.removeAttribute("aria-describedby");
      }
    }
  }

  // ─── Positioning ─────────────────────────────────────────────────────────────

  get #bubble(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".ce-tooltip__bubble") as HTMLElement | null;
  }

  #updatePosition(): void {
    const target = this._target;
    const bubble = this.#bubble;
    if (!target || !bubble) return;

    const tr = target.getBoundingClientRect();
    const tip = bubble.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = 0;

    switch (this.placement) {
      case "top":
        top = tr.top - tip.height - gap;
        left = tr.left + (tr.width - tip.width) / 2;
        break;
      case "bottom":
        top = tr.bottom + gap;
        left = tr.left + (tr.width - tip.width) / 2;
        break;
      case "left":
        top = tr.top + (tr.height - tip.height) / 2;
        left = tr.left - tip.width - gap;
        break;
      case "right":
        top = tr.top + (tr.height - tip.height) / 2;
        left = tr.right + gap;
        break;
    }

    bubble.style.top = `${top}px`;
    bubble.style.left = `${left}px`;
  }

  // ─── Scroll / resize listeners ───────────────────────────────────────────────

  #attachScrollResizeListeners(): void {
    window.addEventListener("resize", this._onReposition);
    window.addEventListener("scroll", this._onReposition, { passive: true, capture: true });
  }

  #detachScrollResizeListeners(): void {
    window.removeEventListener("resize", this._onReposition);
    window.removeEventListener("scroll", this._onReposition, { capture: true });
  }
}
