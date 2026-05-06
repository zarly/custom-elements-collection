import { html, css, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type CeDismissSize = "sm" | "md" | "lg";

/**
 * `<ce-dismiss>` — opposite of bookmark; toggle to mark an item as
 * "not interested / hide". Sets `data-ce-dismissed="true"` on the nearest
 * ancestor <ce-feedback-bar> when active so consumers can apply CSS rules
 * (e.g. opacity: 0.4) to dim the row.
 *
 * Same shape as `<ce-bookmark>` with reversed defaults.
 *
 * Events:
 *   ce-dismiss-change { active } — bubbles + composed.
 *
 * ARIA: role=switch, aria-checked, aria-label.
 */
export class CeDismiss extends CecElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-1);
      color: var(--ce-text);
      cursor: pointer;
      user-select: none;
      --ce-dismiss-size: 16px;
    }
    :host([size="sm"]) { --ce-dismiss-size: 13px; font-size: var(--ce-text-xs); }
    :host([size="md"]) { --ce-dismiss-size: 16px; font-size: var(--ce-text-sm); }
    :host([size="lg"]) { --ce-dismiss-size: 22px; font-size: var(--ce-text-md); }

    button {
      font: inherit;
      color: inherit;
      background: var(--ce-bg-elevated, var(--ce-surface-2));
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-md, var(--ce-radius-sm));
      padding: var(--ce-inset-xs) var(--ce-space-2);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-1);
      transition: background var(--ce-transition-fast),
        border-color var(--ce-transition-fast),
        color var(--ce-transition-fast);
    }
    button:hover {
      border-color: var(--ce-warn, var(--ce-color-amber));
    }
    button:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }
    :host([active]) button {
      color: var(--ce-warn, var(--ce-color-amber));
      border-color: var(--ce-warn, var(--ce-color-amber));
    }

    .ce-dismiss__icon {
      font-size: var(--ce-dismiss-size);
      line-height: 1;
    }
    .ce-dismiss__label {
      font-size: inherit;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: Boolean, reflect: true })
  active = false;

  @property({ type: String })
  label = "Drop";

  @property({ type: String, attribute: "icon-active" })
  iconActive = "🗑";

  @property({ type: String, attribute: "icon-inactive" })
  iconInactive = "👁";

  @property({ type: String, reflect: true })
  size: CeDismissSize = "md";

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "switch");
    this.#syncAria();
    this.#syncBarFlag();
    this.addEventListener("keydown", this.#onKeydown);
    this.addEventListener("click", this.#onHostClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this.#onKeydown);
    this.removeEventListener("click", this.#onHostClick);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("active") || changed.has("label")) {
      this.#syncAria();
    }
    if (changed.has("active")) {
      this.#syncBarFlag();
    }
  }

  #syncAria(): void {
    this.setAttribute("aria-checked", this.active ? "true" : "false");
    if (this.label) this.setAttribute("aria-label", this.label);
  }

  /** Walks up via parentElement to find the nearest <ce-feedback-bar>;
   *  tolerates the bar not existing yet (silent no-op). */
  #syncBarFlag(): void {
    try {
      let node: Element | null = this.parentElement;
      while (node && node.tagName !== "BODY") {
        if (node.tagName.toLowerCase() === "ce-feedback-bar") {
          if (this.active) {
            node.setAttribute("data-ce-dismissed", "true");
          } else {
            node.removeAttribute("data-ce-dismissed");
          }
          return;
        }
        node = node.parentElement;
      }
    } catch {
      /* fail silent */
    }
  }

  override render() {
    const icon = this.active ? this.iconActive : this.iconInactive;
    return html`
      <button
        type="button"
        tabindex="-1"
        aria-hidden="true"
      >
        <span class="ce-dismiss__icon">
          <slot name="icon">${icon}</slot>
        </span>
        <span class="ce-dismiss__label">
          <slot>${this.label}</slot>
        </span>
      </button>
    `;
  }

  #onHostClick = (e: Event): void => {
    if (e.defaultPrevented) return;
    this.#toggle();
  };

  #onKeydown = (e: KeyboardEvent): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.#toggle();
    }
  };

  #toggle(): void {
    this.active = !this.active;
    this.dispatchEvent(
      new CustomEvent("ce-dismiss-change", {
        bubbles: true,
        composed: true,
        detail: { active: this.active },
      })
    );
  }
}
