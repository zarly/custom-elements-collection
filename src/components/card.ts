import { html, css, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, classNames, type CecColor } from "../core/index.js";

/**
 * `<ce-card>` — a surface with optional left-border accent.
 *
 * Usage:
 *
 *   <ce-card>
 *     <h3 slot="title">Heading</h3>
 *     <p>Body content…</p>
 *   </ce-card>
 *
 *   <ce-card accent="green" hoverable>
 *     Accent-bordered, hover-elevated card.
 *   </ce-card>
 *
 * Attributes (all reflected):
 *   accent     — optional left-border color: green|red|amber|blue|purple|cyan
 *   hoverable  — boolean; adds hover border/elevation
 *   compact    — boolean; tighter padding
 *   clickable  — boolean; cursor=pointer + role=button + keyboard activation
 *
 * Slots:
 *   title     — optional title region (rendered above default slot)
 *   (default) — body content
 *   footer    — optional footer region
 *
 * Events:
 *   ce-card-activate — fires on click or Enter/Space when `clickable`.
 */
export class CeCard extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-4) var(--ce-space-5);
      transition: border-color var(--ce-transition), box-shadow var(--ce-transition),
        transform var(--ce-transition);
    }

    :host([compact]) {
      padding: var(--ce-space-3) var(--ce-space-4);
    }

    :host([hoverable]:hover),
    :host([clickable]:hover) {
      border-color: var(--ce-border-strong);
      box-shadow: var(--ce-shadow);
    }

    :host([clickable]) {
      cursor: pointer;
    }
    :host([clickable]:focus-visible) {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }
    :host([clickable]:active) {
      transform: translateY(1px);
    }

    :host([accent="green"])  { border-left: 3px solid var(--ce-color-green);  }
    :host([accent="red"])    { border-left: 3px solid var(--ce-color-red);    }
    :host([accent="amber"])  { border-left: 3px solid var(--ce-color-amber);  }
    :host([accent="blue"])   { border-left: 3px solid var(--ce-color-blue);   }
    :host([accent="purple"]) { border-left: 3px solid var(--ce-color-purple); }
    :host([accent="cyan"])   { border-left: 3px solid var(--ce-color-cyan);   }

    .ce-card__title {
      margin-bottom: var(--ce-space-2);
    }
    .ce-card__title ::slotted(*) {
      margin: 0;
      font-size: var(--ce-text-md);
      font-weight: 700;
      color: var(--ce-text);
    }

    .ce-card__footer {
      margin-top: var(--ce-space-3);
      padding-top: var(--ce-space-3);
      border-top: 1px solid var(--ce-border-soft);
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
    }

    /* Hide slot wrappers if their slot is empty. Implemented via :has()
       (Baseline 2023). Graceful fallback: the wrapper remains but is empty,
       contributing only a tiny margin. */
    .ce-card__title:not(:has(::slotted(*))) {
      display: none;
    }
    .ce-card__footer:not(:has(::slotted(*))) {
      display: none;
    }
  `;

  /** Override to use shadow DOM so the :host selector works. See ADR-002 —
   * `ce-card` is an exception because the :host() accent border needs isolation
   * to avoid specificity collisions with host-page rules on "border". */
  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  accent: CecColor | null = null;

  @property({ type: Boolean, reflect: true })
  hoverable = false;

  @property({ type: Boolean, reflect: true })
  compact = false;

  @property({ type: Boolean, reflect: true })
  clickable = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("click", this.#onClick);
    this.addEventListener("keydown", this.#onKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("click", this.#onClick);
    this.removeEventListener("keydown", this.#onKeyDown);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("clickable")) {
      if (this.clickable) {
        this.setAttribute("role", "button");
        this.setAttribute("tabindex", "0");
      } else {
        this.removeAttribute("role");
        this.removeAttribute("tabindex");
      }
    }
  }

  override render() {
    return html`
      <div class=${classNames("ce-card__title")}>
        <slot name="title"></slot>
      </div>
      <slot></slot>
      <div class=${classNames("ce-card__footer")}>
        <slot name="footer"></slot>
      </div>
    `;
  }

  #onClick = (_e: Event): void => {
    if (!this.clickable) return;
    this.#emitActivate();
  };

  #onKeyDown = (e: KeyboardEvent): void => {
    if (!this.clickable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.#emitActivate();
    }
  };

  #emitActivate(): void {
    this.dispatchEvent(
      new CustomEvent("ce-card-activate", { bubbles: true, composed: true })
    );
  }
}
