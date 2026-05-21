import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, type CecSize } from "../../core/index.js";

/**
 * `<ce-avatar-group>` — overlapping row of ce-avatar (or arbitrary) children
 * with an automatic overflow chip when the number exceeds `max`.
 *
 * Attributes:
 *   max     — number of items to render before the overflow chip (default 4)
 *   size    — sm | md | lg, propagated to size-aware ce-avatar children
 *   overlap — pixel overlap between siblings (default 8)
 *
 * Slot: default — ce-avatar (or any HTML) children.
 */
export class CeAvatarGroup extends CecElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
    }
    .ce-avatar-group__row {
      display: inline-flex;
      align-items: center;
    }
    ::slotted(*) {
      margin-left: calc(-1 * var(--ce-avatar-group-overlap, 8px));
      box-shadow: 0 0 0 2px var(--ce-bg, var(--ce-surface));
      border-radius: 50%;
    }
    ::slotted(*:first-child) {
      margin-left: 0;
    }
    .ce-avatar-group__more {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 32px;
      padding: 0 var(--ce-space-2);
      margin-left: calc(-1 * var(--ce-avatar-group-overlap, 8px));
      border-radius: 999px;
      background: var(--ce-surface-2);
      color: var(--ce-muted);
      border: 1px solid var(--ce-border-soft);
      box-shadow: 0 0 0 2px var(--ce-bg, var(--ce-surface));
      font-size: var(--ce-text-xs);
      font-weight: 700;
      line-height: 1;
    }
    :host([size="sm"]) .ce-avatar-group__more { min-width: 24px; height: 24px; font-size: 10px; }
    :host([size="lg"]) .ce-avatar-group__more { min-width: 48px; height: 48px; font-size: var(--ce-text-sm); }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: Number }) max = 4;
  @property({ type: String, reflect: true }) size: CecSize = "md";
  @property({ type: Number }) overlap = 8;

  @state() private _overflow = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    this.#recount();
  }

  #recount = (): void => {
    const kids = Array.from(this.children).filter(
      (n) => n.nodeType === 1
    ) as HTMLElement[];
    const total = kids.length;
    const visible = Math.min(this.max, total);
    this._overflow = Math.max(0, total - visible);
    kids.forEach((el, i) => {
      el.style.display = i < visible ? "" : "none";
      if (this.size && "size" in el) {
        try {
          (el as unknown as { size: string }).size = this.size;
        } catch {
          /* not a size-aware element */
        }
      }
    });
    this.style.setProperty("--ce-avatar-group-overlap", `${this.overlap}px`);
  };

  override updated(): void {
    this.#recount();
  }

  #onSlotChange = (): void => {
    this.#recount();
  };

  override render() {
    return html`
      <div class="ce-avatar-group__row">
        <slot @slotchange=${this.#onSlotChange}></slot>
        ${this._overflow > 0
          ? html`<span class="ce-avatar-group__more" aria-label=${`+${this._overflow} more`}
              >+${this._overflow}</span
            >`
          : ""}
      </div>
    `;
  }
}
