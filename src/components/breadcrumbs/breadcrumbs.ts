import { html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

export interface BreadcrumbItem {
  /** Visible label. */
  label: string;
  /** Optional href. When omitted the crumb renders as plain text (typical for the last crumb). */
  href?: string;
}

/**
 * `<ce-breadcrumbs>` — path-navigation strip.
 *
 * Accepts a JSON `items` array OR slotted children (CDR-005). In slot mode any
 * slotted `<a>` / `<span>` becomes a crumb; the last child gets the "current"
 * styling automatically; separators are rendered between siblings.
 *
 * Attributes:
 *   items     — JSON array of { label, href? }
 *   separator — visible separator glyph between crumbs (default "/")
 *
 * Slots:
 *   (default) — slotted crumb elements (typically <a> or <span>)
 */
export class CeBreadcrumbs extends CecElement {
  static override styles = css`
    :host {
      display: block;
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
      line-height: var(--ce-line-snug);
    }
    nav > .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ce-space-1);
      padding: 0;
      margin: 0;
      list-style: none;
    }
    .crumb {
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-1);
      min-width: 0;
    }
    a {
      color: var(--ce-muted);
      text-decoration: none;
      border-radius: var(--ce-radius-sm);
      padding: var(--ce-inset-xs) var(--ce-space-1);
    }
    a:hover {
      color: var(--ce-text);
      text-decoration: underline;
    }
    a:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
      color: var(--ce-text);
    }
    .current {
      color: var(--ce-text);
      font-weight: 600;
      padding: var(--ce-inset-xs) var(--ce-space-1);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 18em;
    }
    .sep {
      color: var(--ce-dim);
      user-select: none;
    }
    ::slotted(:last-child) {
      color: var(--ce-text);
      font-weight: 600;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property(jsonProp<BreadcrumbItem[]>([], "items"))
  items: BreadcrumbItem[] = [];

  @property({ type: String }) separator = "/";

  @state() private _slotCount = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Breadcrumb");
    // Route light-DOM children into per-position named slots up front so the
    // shadow render can place separators correctly on first paint. Re-runs on
    // every slotchange of the default slot for late-arriving (streamed) nodes.
    this.#routeChildren();
  }

  #routeChildren = (): void => {
    const children = Array.from(this.children).filter(
      (el) => el instanceof HTMLElement,
    ) as HTMLElement[];
    const candidates = children.filter((el) => {
      const slot = el.getAttribute("slot") ?? "";
      return slot === "" || slot.startsWith("c");
    });
    candidates.forEach((el, i) => el.setAttribute("slot", `c${i}`));
    this._slotCount = candidates.length;
  };

  #renderJsonMode() {
    const last = this.items.length - 1;
    return this.items.map((it, i) => {
      const isCurrent = i === last;
      const sep =
        i < last
          ? html`<span class="sep" aria-hidden="true">${this.separator}</span>`
          : nothing;
      const content =
        isCurrent || !it.href
          ? html`<span class="current" aria-current=${isCurrent ? "page" : "false"}
              >${it.label}</span
            >`
          : html`<a href=${it.href}>${it.label}</a>`;
      return html`<li class="crumb">${content}${sep}</li>`;
    });
  }

  #renderSlotMode() {
    const count = this._slotCount;
    if (count === 0) {
      // Either no children yet, or all children arrived after connectedCallback
      // (streaming). Render an unnamed catch-all slot and re-route on slotchange.
      return html`<li class="crumb"><slot @slotchange=${this.#routeChildren}></slot></li>`;
    }
    const items = [];
    for (let i = 0; i < count; i++) {
      const isLast = i === count - 1;
      items.push(
        html`<li class="crumb">
          <slot name=${`c${i}`} @slotchange=${this.#routeChildren}></slot>
          ${isLast ? nothing : html`<span class="sep" aria-hidden="true">${this.separator}</span>`}
        </li>`,
      );
    }
    return items;
  }

  override render() {
    const body = this.items.length > 0 ? this.#renderJsonMode() : this.#renderSlotMode();
    return html`<nav aria-label="Breadcrumb"><ol class="row">${body}</ol></nav>`;
  }
}
