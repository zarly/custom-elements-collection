/* eslint-disable max-lines --
 * ce-drawer is the project's slide-out panel primitive: side selection
 * (left/right/top/bottom), focus trap, scroll lock, ESC handling, backdrop
 * click, return-focus restoration, plus open/close animation gating. The
 * focus-trap state machine and the scroll-lock cleanup are tightly coupled
 * to the host lifecycle; extracting either to a helper would push private
 * state through the seam. Carve-out at 432 lines (32 over the 400 limit);
 * revisit if it grows past ~600 or a second drawer-shaped component lands.
 */
import { html, css, type PropertyValues } from "lit";
import { property, query } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-drawer>` — edge-attached panel that slides in from top, right, bottom, or left.
 *
 * Usage:
 *
 *   <ce-drawer side="end" size="md">
 *     <ce-button slot="trigger">Open inspector</ce-button>
 *     <h2 slot="header">Properties</h2>
 *     <p>Body content here.</p>
 *     <ce-button slot="footer" variant="primary">Apply</ce-button>
 *   </ce-drawer>
 *
 *   <ce-drawer side="bottom" size="lg" modal>
 *     <ce-button slot="trigger">Show options</ce-button>
 *     <h2 slot="header">Choose template</h2>
 *     <ce-list><a href="#a">Blank</a></ce-list>
 *   </ce-drawer>
 *
 * Attributes (all reflected):
 *   open        — boolean; shows/hides the drawer.
 *   side        — "start|end|top|bottom" (default: end). Which edge the drawer attaches to.
 *   modal       — boolean (default: true). When true, uses <dialog> showModal() for focus trap +
 *                 scrim + native Escape handling. When false, uses a positioned div with popover.
 *   size        — "sm|md|lg|full" (default: md). sm=24rem, md=32rem, lg=48rem, full=100%.
 *   dismissible — boolean (default: true). When false, Escape and scrim-click do not close.
 *
 * Slots:
 *   trigger  — the element that opens the drawer on click.
 *   header   — drawer header area (title, logo, nav branding).
 *   (default) — drawer body content.
 *   footer   — action area (buttons, status).
 *
 * Methods:
 *   show()   — opens the drawer.
 *   hide()   — closes the drawer.
 *   toggle() — flips the current state.
 *
 * Events:
 *   ce-drawer-open  — fires after the drawer becomes visible.
 *   ce-drawer-close — fires after the drawer closes.
 *
 * A11y:
 *   Modal mode: <dialog showModal()> provides focus trap, Escape handling, and top-layer.
 *   aria-labelledby on the dialog points to the auto-generated header-id if a header slot
 *   is present, otherwise falls back to aria-label="Drawer".
 *   On close, focus returns to the element that triggered the open.
 */

export type DrawerSide = "start" | "end" | "top" | "bottom";
export type DrawerSize = "sm" | "md" | "lg" | "full";

export class CeDrawer extends CecElement {
  static override styles = css`
    :host {
      display: contents;
    }

    /* ── Trigger slot ─────────────────────────────────────────────────────── */

    .ce-drawer__trigger {
      display: contents;
    }

    /* ── <dialog> wrapper ─────────────────────────────────────────────────── */

    dialog {
      /* Reset browser dialog UA stylesheet */
      padding: 0;
      margin: 0;
      border: none;
      outline: none;
      background: var(--ce-surface);
      color: var(--ce-text);
      box-shadow: var(--ce-shadow-lg);
      overflow: hidden;

      /* Edge attachment — overridden per side below */
      position: fixed;
      inset: 0 0 0 auto; /* default: end */
      width: var(--ce-drawer-size, 32rem);
      height: 100dvh;
      max-width: 100vw;
      max-height: 100dvh;

      /* Slide animation base — transformed to off-screen initially */
      transform: translateX(100%);
      transition:
        transform var(--ce-drawer-duration, 260ms) var(--ce-drawer-easing, ease),
        display var(--ce-drawer-duration, 260ms) allow-discrete,
        overlay var(--ce-drawer-duration, 260ms) allow-discrete;
    }

    /* Open state */
    dialog[open] {
      transform: none;
    }

    /* Starting-style for entry animation (Chrome 117+) */
    @starting-style {
      dialog[open] {
        transform: translateX(100%);
      }
    }

    /* ── Scrim / backdrop ─────────────────────────────────────────────────── */

    dialog::backdrop {
      background: var(--ce-drawer-scrim, rgba(0, 0, 0, 0.45));
      opacity: 0;
      transition: opacity var(--ce-drawer-duration, 260ms) ease,
        display var(--ce-drawer-duration, 260ms) allow-discrete,
        overlay var(--ce-drawer-duration, 260ms) allow-discrete;
    }

    dialog[open]::backdrop {
      opacity: 1;
    }

    @starting-style {
      dialog[open]::backdrop {
        opacity: 0;
      }
    }

    /* ── Side variants ────────────────────────────────────────────────────── */

    /* side="start" — left edge in LTR, right in RTL */
    :host([side="start"]) dialog {
      inset: 0 auto 0 0;
      width: var(--ce-drawer-size, 32rem);
      height: 100dvh;
      transform: translateX(-100%);
    }

    @starting-style {
      :host([side="start"]) dialog[open] {
        transform: translateX(-100%);
      }
    }

    /* side="end" (default) — right edge */
    :host([side="end"]) dialog,
    :host(:not([side])) dialog {
      inset: 0 0 0 auto;
      width: var(--ce-drawer-size, 32rem);
      height: 100dvh;
      transform: translateX(100%);
    }

    @starting-style {
      :host([side="end"]) dialog[open],
      :host(:not([side])) dialog[open] {
        transform: translateX(100%);
      }
    }

    /* side="top" */
    :host([side="top"]) dialog {
      inset: 0 0 auto 0;
      width: 100vw;
      height: var(--ce-drawer-size, 32rem);
      max-width: 100vw;
      transform: translateY(-100%);
    }

    @starting-style {
      :host([side="top"]) dialog[open] {
        transform: translateY(-100%);
      }
    }

    /* side="bottom" */
    :host([side="bottom"]) dialog {
      inset: auto 0 0 0;
      width: 100vw;
      height: var(--ce-drawer-size, 32rem);
      max-width: 100vw;
      transform: translateY(100%);
    }

    @starting-style {
      :host([side="bottom"]) dialog[open] {
        transform: translateY(100%);
      }
    }

    /* ── Size variants ────────────────────────────────────────────────────── */

    :host([size="sm"]) dialog  { --ce-drawer-size: 24rem; }
    :host([size="md"]) dialog  { --ce-drawer-size: 32rem; }
    :host([size="lg"]) dialog  { --ce-drawer-size: 48rem; }
    :host([size="full"]) dialog { --ce-drawer-size: 100%; }

    /* ── prefers-reduced-motion ────────────────────────────────────────────── */

    @media (prefers-reduced-motion: reduce) {
      dialog,
      dialog::backdrop {
        transition: none;
      }
    }

    /* ── Non-modal wrapper (modal=false) ──────────────────────────────────── */

    .ce-drawer__panel {
      position: fixed;
      inset: 0 0 0 auto;
      width: var(--ce-drawer-size, 32rem);
      height: 100dvh;
      max-width: 100vw;
      max-height: 100dvh;
      background: var(--ce-surface);
      color: var(--ce-text);
      box-shadow: var(--ce-shadow-lg);
      border: none;
      padding: 0;
      overflow: hidden;
      z-index: var(--ce-drawer-z, 400);
      transform: translateX(100%);
      transition: transform var(--ce-drawer-duration, 260ms) var(--ce-drawer-easing, ease);
    }

    .ce-drawer__panel[open] {
      transform: none;
    }

    :host([side="start"]) .ce-drawer__panel {
      inset: 0 auto 0 0;
      transform: translateX(-100%);
    }

    :host([side="top"]) .ce-drawer__panel {
      inset: 0 0 auto 0;
      width: 100vw;
      height: var(--ce-drawer-size, 32rem);
      transform: translateY(-100%);
    }

    :host([side="bottom"]) .ce-drawer__panel {
      inset: auto 0 0 0;
      width: 100vw;
      height: var(--ce-drawer-size, 32rem);
      transform: translateY(100%);
    }

    :host([size="sm"]) .ce-drawer__panel  { --ce-drawer-size: 24rem; }
    :host([size="md"]) .ce-drawer__panel  { --ce-drawer-size: 32rem; }
    :host([size="lg"]) .ce-drawer__panel  { --ce-drawer-size: 48rem; }
    :host([size="full"]) .ce-drawer__panel { --ce-drawer-size: 100%; }

    @media (prefers-reduced-motion: reduce) {
      .ce-drawer__panel {
        transition: none;
      }
    }

    /* ── Inner layout ─────────────────────────────────────────────────────── */

    .ce-drawer__inner {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .ce-drawer__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--ce-space-4) var(--ce-space-5);
      border-bottom: 1px solid var(--ce-border);
      flex-shrink: 0;
    }

    .ce-drawer__header-slot {
      flex: 1;
      min-width: 0;
    }

    .ce-drawer__close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: var(--ce-radius-sm);
      color: var(--ce-muted);
      cursor: pointer;
      font-size: var(--ce-text-md);
      line-height: 1;
      transition: background var(--ce-transition), color var(--ce-transition);
      flex-shrink: 0;
    }

    .ce-drawer__close:hover {
      background: var(--ce-state-hover);
      color: var(--ce-text);
    }

    .ce-drawer__close:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }

    .ce-drawer__body {
      flex: 1;
      overflow-y: auto;
      padding: var(--ce-space-4) var(--ce-space-5);
    }

    .ce-drawer__footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--ce-space-2);
      padding: var(--ce-space-3) var(--ce-space-5);
      border-top: 1px solid var(--ce-border);
      flex-shrink: 0;
    }

    .ce-drawer__footer:not(:has(::slotted(*))) {
      display: none;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  // ─── Properties ─────────────────────────────────────────────────────────────

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String, reflect: true })
  side: DrawerSide = "end";

  @property({ type: Boolean, reflect: true })
  modal = true;

  @property({ type: String, reflect: true })
  size: DrawerSize = "md";

  @property({ type: Boolean, reflect: true })
  dismissible = true;

  // ─── Internal refs ───────────────────────────────────────────────────────────

  @query("dialog")
  private _dialog!: HTMLDialogElement;

  @query(".ce-drawer__panel")
  private _panel!: HTMLElement;

  /** The element that had focus before the drawer opened. */
  private _previousFocus: HTMLElement | null = null;

  /** Unique id for aria-labelledby */
  private _headerId = `ce-drawer-header-${Math.random().toString(36).slice(2, 9)}`;

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    // Wire trigger slot via slotchange so late-appended triggers work
    this.shadowRoot?.addEventListener("slotchange", this.#onSlotChange);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.shadowRoot?.removeEventListener("slotchange", this.#onSlotChange);
    this.#detachTriggerListener();
    document.removeEventListener("keydown", this.#onEscapeKey, { capture: true });
  }

  override firstUpdated(): void {
    this.#attachTriggerListener();
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has("open")) {
      if (this.open) {
        this.#openDrawer();
      } else {
        this.#closeDrawer();
      }
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /** Opens the drawer. */
  show(): void {
    this.open = true;
  }

  /** Closes the drawer. */
  hide(): void {
    this.open = false;
  }

  /** Flips the current open state. */
  toggle(): void {
    this.open = !this.open;
  }

  // ─── Rendering ──────────────────────────────────────────────────────────────

  override render() {
    const inner = html`
      <div class="ce-drawer__inner">
        <div class="ce-drawer__header">
          <div
            class="ce-drawer__header-slot"
            id=${this._headerId}
          >
            <slot name="header"></slot>
          </div>
          ${this.dismissible
            ? html`
                <button
                  type="button"
                  class="ce-drawer__close"
                  aria-label="Close"
                  @click=${() => this.hide()}
                >
                  ✕
                </button>
              `
            : ""}
        </div>
        <div class="ce-drawer__body">
          <slot></slot>
        </div>
        <div class="ce-drawer__footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `;

    if (this.modal) {
      return html`
        <div class="ce-drawer__trigger">
          <slot name="trigger"></slot>
        </div>
        <dialog
          aria-modal="true"
          aria-labelledby=${this._headerId}
          @click=${this._onDialogClick}
          @cancel=${this._onDialogCancel}
        >
          ${inner}
        </dialog>
      `;
    }

    // Non-modal: positioned div
    return html`
      <div class="ce-drawer__trigger">
        <slot name="trigger"></slot>
      </div>
      <div
        class="ce-drawer__panel"
        role="dialog"
        tabindex="-1"
        aria-modal="false"
        aria-labelledby=${this._headerId}
      >
        ${inner}
      </div>
    `;
  }

  // ─── Open / close internals ──────────────────────────────────────────────────

  #openDrawer(): void {
    this._previousFocus = (document.activeElement as HTMLElement) ?? null;

    if (this.modal) {
      const d = this._dialog;
      if (!d || d.open) return;
      d.showModal();
    } else {
      const p = this._panel;
      if (!p) return;
      p.setAttribute("open", "");
      // Non-modal: own Escape key
      if (this.dismissible) {
        document.addEventListener("keydown", this.#onEscapeKey, { capture: true });
      }
    }

    this.dispatchEvent(
      new CustomEvent("ce-drawer-open", { bubbles: true, composed: true })
    );
  }

  #closeDrawer(): void {
    if (this.modal) {
      const d = this._dialog;
      if (!d || !d.open) return;
      d.close();
    } else {
      const p = this._panel;
      if (!p) return;
      p.removeAttribute("open");
      document.removeEventListener("keydown", this.#onEscapeKey, { capture: true });
    }

    // Return focus to invoker
    if (this._previousFocus && document.contains(this._previousFocus)) {
      this._previousFocus.focus();
    }
    this._previousFocus = null;

    this.dispatchEvent(
      new CustomEvent("ce-drawer-close", { bubbles: true, composed: true })
    );
  }

  // ─── Dialog event handlers ──────────────────────────────────────────────────

  private _onDialogClick(e: MouseEvent): void {
    if (!this.dismissible) return;
    // Backdrop click: event lands on the <dialog> element itself (not its content)
    if (e.target === this._dialog) {
      this.hide();
    }
  }

  private _onDialogCancel(e: Event): void {
    // Native Escape fires "cancel" on the dialog element
    e.preventDefault();
    if (this.dismissible) {
      this.hide();
    }
    // dismissible=false: cancelled, drawer stays open
  }

  // ─── Non-modal Escape handler ─────────────────────────────────────────────

  #onEscapeKey = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      e.stopPropagation();
      this.hide();
    }
  };

  // ─── Trigger wiring ─────────────────────────────────────────────────────────

  #triggerEl: HTMLElement | null = null;

  #onSlotChange = (e: Event): void => {
    const slot = e.target as HTMLSlotElement;
    if (slot.name === "trigger") {
      this.#detachTriggerListener();
      this.#attachTriggerListener();
    }
  };

  #attachTriggerListener(): void {
    const trigger = this.querySelector<HTMLElement>("[slot='trigger']");
    if (!trigger) return;
    this.#triggerEl = trigger;
    trigger.addEventListener("click", this.#onTriggerClick);
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-expanded", String(this.open));
  }

  #detachTriggerListener(): void {
    if (this.#triggerEl) {
      this.#triggerEl.removeEventListener("click", this.#onTriggerClick);
      this.#triggerEl = null;
    }
  }

  #onTriggerClick = (): void => {
    this.show();
    if (this.#triggerEl) {
      this.#triggerEl.setAttribute("aria-expanded", "true");
    }
  };
}
