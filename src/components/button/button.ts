import { html, css, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-button>` — primary, secondary, ghost, or destructive button.
 *
 * Attributes:
 *   variant   — "primary" | "secondary" | "ghost" | "destructive"
 *   size      — "sm" | "md" | "lg"
 *   disabled  — boolean
 *   loading   — boolean; replaces label with a spinner
 *   icon      — string emoji/glyph rendered before the label
 *   type      — submit | button | reset (default "button"). Forwarded to native button
 *
 * Slot: default — label content.
 *       icon    — override icon attribute with arbitrary HTML/SVG.
 *
 * Events: ce-click — fires on activation.
 */
export class CeButton extends CecElement {
  static override styles = css`
    :host {
      display: inline-block;
      vertical-align: middle;
    }
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--ce-space-2);
      padding: 8px 16px;
      font: inherit;
      font-weight: 600;
      font-size: var(--ce-text-sm);
      line-height: var(--ce-line-snug);
      border-radius: var(--ce-radius-sm);
      border: 1px solid transparent;
      background: var(--ce-color-blue);
      color: #fff; /* stylelint-disable-line color-no-hex -- on-accent text; --ce-text-inverse flips per theme and would lose contrast on saturated buttons */
      cursor: pointer;
      transition: background var(--ce-transition), border-color var(--ce-transition),
        box-shadow var(--ce-transition), opacity var(--ce-transition);
      white-space: nowrap;
    }
    button:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    :host([variant="secondary"]) button {
      background: var(--ce-surface-2);
      color: var(--ce-text);
      border-color: var(--ce-border);
    }
    :host([variant="secondary"]) button:hover:not(:disabled) {
      border-color: var(--ce-border-strong);
      background: var(--ce-surface-3);
    }
    :host([variant="ghost"]) button {
      background: transparent;
      color: var(--ce-text);
    }
    :host([variant="ghost"]) button:hover:not(:disabled) {
      background: var(--ce-state-hover);
    }
    :host([variant="destructive"]) button {
      background: var(--ce-color-red);
      /* stylelint-disable-next-line color-no-hex -- on-accent text; saturated red always needs light contrast */
      color: #fff;
    }

    :host([size="sm"]) button { padding: 4px 10px; font-size: var(--ce-text-xs); }
    :host([size="lg"]) button { padding: 12px 20px; font-size: var(--ce-text-md); }
    /* Square icon button — symmetric padding + 1:1 aspect ratio. Sized for a
       16×16 glyph; consumers pass the icon via the default slot or icon slot. */
    :host([size="icon"]) button {
      padding: var(--ce-inset-md);
      aspect-ratio: 1;
    }

    .spin {
      width: 14px;
      height: 14px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: ce-btn-spin 0.7s linear infinite;
    }
    @keyframes ce-btn-spin {
      to { transform: rotate(360deg); }
    }
    .label.hidden { visibility: hidden; }
    .stack { position: relative; display: inline-flex; align-items: center; gap: var(--ce-space-2); }
    .overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  variant: "primary" | "secondary" | "ghost" | "destructive" = "primary";

  @property({ type: String, reflect: true })
  size: "sm" | "md" | "lg" | "icon" = "md";

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  loading = false;

  @property({ type: String })
  icon = "";

  @property({ type: String })
  type: "button" | "submit" | "reset" = "button";

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("disabled") || changed.has("loading")) {
      // Make the host inert when disabled/loading, but only adjust aria — disabled state on
      // the inner button handles activation blocking.
      if (this.disabled || this.loading) {
        this.setAttribute("aria-disabled", "true");
      } else {
        this.removeAttribute("aria-disabled");
      }
    }
  }

  #onClick = (e: MouseEvent): void => {
    if (this.disabled || this.loading) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    this.dispatchEvent(
      new CustomEvent("ce-click", { bubbles: true, composed: true })
    );
  };

  override render() {
    return html`
      <button
        type=${this.type}
        ?disabled=${this.disabled || this.loading}
        @click=${this.#onClick}
      >
        <span class="stack">
          <span class="label ${this.loading ? "hidden" : ""}">
            ${this.icon ? html`<slot name="icon">${this.icon}</slot>` : html`<slot name="icon"></slot>`}
            <slot></slot>
          </span>
          ${this.loading
            ? html`<span class="overlay" aria-hidden="true"><span class="spin"></span></span>`
            : ""}
        </span>
      </button>
    `;
  }
}
