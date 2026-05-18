import { html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-heat-row>` — a single row of heatmap cells for use inside
 * `<ce-heatmap>` (slot mode per CDR-005), or as a standalone minimal
 * row of unfilled cells when used outside.
 *
 * The `label` attribute becomes the row header. The default slot accepts
 * `<ce-heat-cell>` children whose `tone`/`title` attrs and slot text are
 * read by the parent `<ce-heatmap>` to build its internal data grid.
 *
 * When nested inside `<ce-heatmap>` the parent reads our `label` attribute
 * and our `<ce-heat-cell>` children directly; this element renders nothing
 * (display:contents). When used standalone it renders a minimal row.
 */
export class CeHeatRow extends CecElement {
  static override styles = css`
    :host {
      display: contents; /* invisible when nested inside ce-heatmap */
    }
    :host([data-standalone]) {
      display: flex;
      align-items: center;
      gap: var(--ce-space-2);
      padding: var(--ce-inset-md) 0;
    }
    .ce-hr-label {
      min-width: 5rem;
      text-align: right;
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .ce-hr-cells {
      display: flex;
      gap: var(--ce-space-2);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  /** Row label (Y-axis header). */
  @property({ type: String, reflect: true }) label = "";

  /** Whether we're rendered outside any ce-heatmap parent. */
  @state() private _standalone = false;

  override connectedCallback(): void {
    super.connectedCallback();
    const nested = this.closest("ce-heatmap") !== null;
    this._standalone = !nested;
    if (this._standalone) {
      this.setAttribute("data-standalone", "");
    } else {
      this.removeAttribute("data-standalone");
    }
  }

  override render() {
    if (!this._standalone) {
      return nothing;
    }
    // Standalone: render label + slotted cells in a flex row.
    return html`
      <span class="ce-hr-label">${this.label}</span>
      <div class="ce-hr-cells"><slot></slot></div>
    `;
  }
}
