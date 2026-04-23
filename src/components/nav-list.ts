import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, jsonProp } from "../core/index.js";

export interface NavItem {
  /** Optional group header — consecutive items sharing the same group sit under one heading. */
  group?: string;
  /** Visible label. */
  label: string;
  /** Href / hash target. */
  href: string;
  /** Optional small monospace tag shown after the label (e.g. "ce-hero"). */
  tag?: string;
}

/**
 * `<ce-nav-list>` — grouped anchor list for docs sidebars.
 *
 * Groups items by their `group` field and highlights the item whose `href`
 * matches the `value` attribute (defaults to `location.hash`).
 *
 * Properties:
 *   items   — NavItem[]: the full list
 *   value   — string: the currently active href (controlled)
 *   title   — optional sidebar title
 *
 * Events:
 *   ce-nav-select — CustomEvent<{ href: string }> before navigation
 */
export class CeNavList extends CecElement {
  static override styles = css`
    :host {
      display: block;
      padding: var(--ce-space-3) 0;
      font-size: var(--ce-text-sm);
    }
    .ce-nav__title {
      padding: var(--ce-space-2) var(--ce-space-4);
      font-size: var(--ce-text-xs);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--ce-dim);
      font-weight: 700;
    }
    .ce-nav__group {
      padding: var(--ce-space-3) var(--ce-space-4) var(--ce-space-1);
      font-size: var(--ce-text-xs);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--ce-muted);
      font-weight: 600;
    }
    .ce-nav__link {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--ce-space-2);
      padding: 5px var(--ce-space-4);
      color: var(--ce-text);
      text-decoration: none;
      border-left: 2px solid transparent;
    }
    .ce-nav__link:hover {
      background: var(--ce-surface-2);
    }
    .ce-nav__link[aria-current="page"] {
      color: var(--ce-color-blue);
      background: var(--ce-color-blue-bg);
      border-left-color: var(--ce-color-blue);
      font-weight: 600;
    }
    .ce-nav__tag {
      font-family: var(--ce-font-mono);
      font-size: var(--ce-text-xs);
      color: var(--ce-dim);
    }
    .ce-nav__link[aria-current="page"] .ce-nav__tag {
      color: var(--ce-color-blue);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property(jsonProp<NavItem[]>([], "items"))
  items: NavItem[] = [];

  @property({ type: String })
  value = "";

  @property({ type: String })
  override title = "";

  private handleClick(href: string, ev: MouseEvent) {
    this.dispatchEvent(
      new CustomEvent("ce-nav-select", {
        detail: { href },
        bubbles: true,
        composed: true,
      }),
    );
    // Let the default navigation happen unless the consumer cancels.
    void ev;
  }

  override render() {
    const groups = new Map<string, NavItem[]>();
    for (const it of this.items) {
      const key = it.group ?? "";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(it);
    }
    return html`
      ${this.title ? html`<div class="ce-nav__title">${this.title}</div>` : nothing}
      ${Array.from(groups.entries()).map(
        ([group, items]) => html`
          ${group ? html`<div class="ce-nav__group">${group}</div>` : nothing}
          ${items.map(
            (it) => html`
              <a
                class="ce-nav__link"
                href=${it.href}
                aria-current=${this.value === it.href ? "page" : "false"}
                @click=${(ev: MouseEvent) => this.handleClick(it.href, ev)}
              >
                <span>${it.label}</span>
                ${it.tag ? html`<span class="ce-nav__tag">${it.tag}</span>` : nothing}
              </a>
            `,
          )}
        `,
      )}
    `;
  }
}
