import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-list>` — generic flat list container.
 *
 * Renders N homogeneous items in a vertical sequence with consistent spacing
 * and optional dividers. Suitable for notifications, search results, settings
 * rows, audit logs, and any vertical sequence of items.
 *
 * Usage:
 *
 *   <ce-list dividers="hair">
 *     <ce-key-value key="Status" value="Live"></ce-key-value>
 *     <ce-key-value key="Region" value="EU"></ce-key-value>
 *   </ce-list>
 *
 *   <ce-list density="compact" dividers="line">
 *     <ce-card>Alpha</ce-card>
 *     <ce-card>Beta</ce-card>
 *   </ce-list>
 *
 *   <ce-list interactive>
 *     <a href="#a">First link</a>
 *     <a href="#b">Second link</a>
 *   </ce-list>
 *
 * Attributes (all reflected):
 *   dividers  — "none" | "hair" | "line"  (default: "hair")
 *   density   — "comfortable" | "cozy" | "compact"  (default: "comfortable")
 *   interactive — boolean; adds hover background + focus-visible outline on
 *                 each slotted item. Visual hint only — consumers add their
 *                 own anchors / buttons inside items for real interactivity.
 *
 * Slots:
 *   (default) — the items, free-form; any element is accepted.
 *
 * NOTE: `::slotted(*)` only reaches direct children. If a consumer wraps
 * each item in an extra `<div>`, divider/density styles will not reach the
 * inner content. Keep items as direct children of `<ce-list>`.
 *
 * NO semantic role is applied to the host. `role="list"` would require every
 * direct child to be a list item, but slot content is unrestricted.
 * Consumers who know their content is a semantic list should add
 * `role="list"` themselves and ensure children carry `role="listitem"`.
 */
export class CeList extends CecElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
    }

    /* ── density → padding-block on items ──────────────────────────────── */

    :host([density="comfortable"]) ::slotted(*) {
      padding-block: var(--ce-space-4);
    }

    :host([density="cozy"]) ::slotted(*) {
      padding-block: var(--ce-space-3);
    }

    :host([density="compact"]) ::slotted(*) {
      padding-block: var(--ce-space-2);
    }

    /* Default (no density attr = "comfortable") */
    :host(:not([density])) ::slotted(*),
    :host([density=""]) ::slotted(*) {
      padding-block: var(--ce-space-4);
    }

    /* ── dividers ───────────────────────────────────────────────────────── */

    /* hair: 1px soft border on all items except the last */
    :host([dividers="hair"]) ::slotted(*:not(:last-child)),
    :host(:not([dividers])) ::slotted(*:not(:last-child)),
    :host([dividers=""]) ::slotted(*:not(:last-child)) {
      border-bottom: 1px solid var(--ce-border-soft);
    }

    /* line: stronger 1px border */
    :host([dividers="line"]) ::slotted(*:not(:last-child)) {
      border-bottom: 1px solid var(--ce-border);
    }

    /* none: no border, use gap-based spacing only */
    :host([dividers="none"]) ::slotted(*:not(:last-child)) {
      border-bottom: none;
    }

    /* ── interactive ────────────────────────────────────────────────────── */

    :host([interactive]) ::slotted(*) {
      cursor: default;
      transition: background var(--ce-transition);
    }

    :host([interactive]) ::slotted(*:hover) {
      background: var(--ce-state-hover, var(--ce-surface-2));
    }

    :host([interactive]) ::slotted(*:focus-visible) {
      outline: 2px solid var(--ce-color-blue);
      outline-offset: -2px;
    }
  `;

  /** Override to use shadow DOM — needed for :host([attr]) and ::slotted(*). */
  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  /** Controls whether items display a bottom border between them. */
  @property({ type: String, reflect: true })
  dividers: "none" | "hair" | "line" = "hair";

  /** Controls padding-block on each slotted item. */
  @property({ type: String, reflect: true })
  density: "comfortable" | "cozy" | "compact" = "comfortable";

  /**
   * When set, adds hover background and focus-visible outline to each slotted
   * item. This is a visual hint, not an activation affordance — consumers are
   * responsible for making the items semantically interactive (anchors, buttons).
   */
  @property({ type: Boolean, reflect: true })
  interactive = false;

  override render() {
    return html`<slot></slot>`;
  }
}
