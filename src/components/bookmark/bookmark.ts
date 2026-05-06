import { html, css, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type CeBookmarkSize = "sm" | "md" | "lg";

/**
 * `<ce-bookmark>` — toggle for "save / shortlist / pin" semantics.
 *
 * Attributes:
 *   active        — boolean, reflected; toggle state.
 *   label         — text shown next to the icon (default "Shortlist").
 *   icon-active   — emoji/text used when active (default "📌").
 *   icon-inactive — emoji/text used when inactive (default "📍").
 *   size          — sm | md | lg (default md).
 *
 * Slots:
 *   icon          — overrides both default icons.
 *   (default)     — overrides label content.
 *
 * Events:
 *   ce-bookmark-change { active } — bubbles + composed.
 *
 * ARIA:
 *   role="switch", aria-checked, aria-label.
 *   Enter/Space toggle.
 */
export class CeBookmark extends CecElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-1);
      color: var(--ce-text);
      cursor: pointer;
      user-select: none;
      --ce-bookmark-size: 16px;
    }
    :host([size="sm"]) { --ce-bookmark-size: 13px; font-size: var(--ce-text-xs); }
    :host([size="md"]) { --ce-bookmark-size: 16px; font-size: var(--ce-text-sm); }
    :host([size="lg"]) { --ce-bookmark-size: 22px; font-size: var(--ce-text-md); }

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
      border-color: var(--ce-accent, var(--ce-color-purple));
    }
    button:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }
    :host([active]) button {
      color: var(--ce-accent, var(--ce-color-purple));
      border-color: var(--ce-accent, var(--ce-color-purple));
    }

    .ce-bookmark__icon {
      font-size: var(--ce-bookmark-size);
      line-height: 1;
    }
    .ce-bookmark__label {
      font-size: inherit;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: Boolean, reflect: true })
  active = false;

  @property({ type: String })
  label = "Shortlist";

  @property({ type: String, attribute: "icon-active" })
  iconActive = "📌";

  @property({ type: String, attribute: "icon-inactive" })
  iconInactive = "📍";

  @property({ type: String, reflect: true })
  size: CeBookmarkSize = "md";

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "switch");
    this.#syncAria();
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
  }

  #syncAria(): void {
    this.setAttribute("aria-checked", this.active ? "true" : "false");
    if (this.label) this.setAttribute("aria-label", this.label);
  }

  override render() {
    const icon = this.active ? this.iconActive : this.iconInactive;
    return html`
      <button
        type="button"
        tabindex="-1"
        aria-hidden="true"
      >
        <span class="ce-bookmark__icon">
          <slot name="icon">${icon}</slot>
        </span>
        <span class="ce-bookmark__label">
          <slot>${this.label}</slot>
        </span>
      </button>
    `;
  }

  #onHostClick = (e: Event): void => {
    // Avoid double-toggle if a slotted control inside also triggers click.
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
      new CustomEvent("ce-bookmark-change", {
        bubbles: true,
        composed: true,
        detail: { active: this.active },
      })
    );
  }
}
