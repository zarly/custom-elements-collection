import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../core/index.js";

/**
 * `<ce-table>` — styled wrapper around a native `<table>`.
 *
 * Users provide a raw `<table>` in the default slot; the component adds:
 *   - surface border + radius
 *   - sticky headers if `sticky` is set
 *   - consistent header/row/hover styling via ::slotted rules
 *
 * Attributes:
 *   sticky  — boolean; header row sticks to top of scroll container
 *   compact — boolean; reduces padding
 */
export class CeTable extends CecElement {
  static override styles = css`
    :host {
      display: block;
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      overflow: hidden;
      background: var(--ce-surface);
    }
    .ce-table__scroll {
      overflow: auto;
      max-width: 100%;
    }
    ::slotted(table) {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--ce-text-sm);
    }
    /* Note: descendant selectors within ::slotted are not supported by most
       browsers — authors apply ambient CSS in their document, or we rely on
       native cascade since we're in shadow but slot contents are in light tree.
       Shadow ::slotted only styles the root of the assigned node, so we scope
       header/cell rules via the exported :part() or via inheritance. For the
       table itself we only style the root element here. */
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: Boolean, reflect: true }) sticky = false;
  @property({ type: Boolean, reflect: true }) compact = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.requestFrame(() => this.#styleChildTable());
  }

  override updated(): void {
    this.requestFrame(() => this.#styleChildTable());
  }

  /** Because ::slotted can't style deep children, we write CSS rules directly
   * onto the slotted table via an injected <style> in the light-DOM parent.
   * This preserves consumer control (you can still override) while ensuring
   * consistent defaults. The style tag is scoped via an instance-id attribute.
   */
  #styleChildTable(): void {
    const table = this.querySelector("table");
    if (!table) return;
    const id = this.#ensureId();
    if (!table.hasAttribute("data-ce-table-styled")) {
      table.setAttribute("data-ce-table-styled", id);
      this.#ensureAmbientCss();
    }
  }

  #ensureId(): string {
    let id = this.getAttribute("data-ce-id");
    if (!id) {
      id = "cmpt-" + Math.random().toString(36).slice(2, 8);
      this.setAttribute("data-ce-id", id);
    }
    return id;
  }

  #ensureAmbientCss(): void {
    const ownerDoc = this.ownerDocument;
    if (!ownerDoc) return;
    if (ownerDoc.getElementById("ce-table-ambient-css")) return;
    const style = ownerDoc.createElement("style");
    style.id = "ce-table-ambient-css";
    style.textContent = `
      ce-table table[data-ce-table-styled] { width:100%; border-collapse:collapse; font-size: var(--ce-text-sm); }
      ce-table table[data-ce-table-styled] th {
        text-align:left; padding: var(--ce-inset-lg) var(--ce-space-3);
        background: var(--ce-surface-2); color: var(--ce-muted);
        text-transform:uppercase; letter-spacing:.06em;
        font-size: var(--ce-text-xs); font-weight:600;
        border-bottom:1px solid var(--ce-border);
      }
      ce-table table[data-ce-table-styled] td {
        padding: var(--ce-inset-lg) var(--ce-space-3);
        border-bottom:1px solid var(--ce-border-soft);
        vertical-align:middle; color: var(--ce-text);
      }
      ce-table table[data-ce-table-styled] tr:hover td { background: var(--ce-state-hover); }
      ce-table[compact] table[data-ce-table-styled] th,
      ce-table[compact] table[data-ce-table-styled] td { padding: var(--ce-inset-md) var(--ce-inset-lg); }
      ce-table[sticky] table[data-ce-table-styled] th { position: sticky; top: 0; z-index: 1; }
      ce-table table[data-ce-table-styled] td.num,
      ce-table table[data-ce-table-styled] td[data-align="num"] { text-align: right; font-variant-numeric: tabular-nums; }
      ce-table table[data-ce-table-styled] td.center,
      ce-table table[data-ce-table-styled] td[data-align="center"] { text-align: center; }
      ce-table table[data-ce-table-styled] td.mono { font-family: var(--ce-font-mono); font-size: var(--ce-text-sm); }
    `;
    ownerDoc.head?.appendChild(style);
  }

  override render() {
    return html`<div class="ce-table__scroll"><slot></slot></div>`;
  }
}
