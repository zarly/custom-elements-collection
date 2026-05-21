import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-divider>` — themed horizontal or vertical separator.
 *
 * Renders a 1px rule. With slotted text, the rule becomes two line segments
 * sandwiching a small centered label.
 *
 * Attributes:
 *   orientation — "horizontal" | "vertical"  (default "horizontal")
 *   inset       — "none" | "sm" | "md" | "lg"  (default "none"; left/right inset for horizontal)
 *
 * Slot: default — optional inline label centered on the rule.
 */
export class CeDivider extends CecElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      margin: var(--ce-space-3) 0;
      border: 0;
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
    }
    :host([inset="sm"]) { padding-inline: var(--ce-space-3); }
    :host([inset="md"]) { padding-inline: var(--ce-space-5); }
    :host([inset="lg"]) { padding-inline: var(--ce-space-7); }

    .ce-divider__row {
      display: flex;
      align-items: center;
      gap: var(--ce-space-2);
    }
    .ce-divider__line {
      flex: 1 1 auto;
      height: 1px;
      background: var(--ce-border);
    }
    .ce-divider__label {
      flex: 0 0 auto;
      line-height: 1;
    }
    .ce-divider__label:not(:has(::slotted(*))):not(:has(slot[name=""] *)) {
      display: none;
    }
    /* Hide label container when slot is empty: simpler ::slotted check */
    .ce-divider__row.is-empty .ce-divider__label { display: none; }
    .ce-divider__row.is-empty .ce-divider__line:nth-child(3) { display: none; }

    :host([orientation="vertical"]) {
      display: inline-block;
      width: 1px;
      min-height: 1em;
      align-self: stretch;
      margin: 0 var(--ce-space-2);
      background: var(--ce-border);
    }
    :host([orientation="vertical"]) .ce-divider__row {
      display: none;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  orientation: "horizontal" | "vertical" = "horizontal";

  @property({ type: String, reflect: true })
  inset: "none" | "sm" | "md" | "lg" = "none";

  #hasSlotContent = false;

  #onSlotChange = (e: Event): void => {
    const slot = e.target as HTMLSlotElement;
    const next = slot.assignedNodes({ flatten: true }).some((n) => {
      if (n.nodeType === 3) return (n.textContent ?? "").trim().length > 0;
      return n.nodeType === 1;
    });
    if (next !== this.#hasSlotContent) {
      this.#hasSlotContent = next;
      this.requestUpdate();
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "separator");
    }
  }

  override render() {
    const rowCls = this.#hasSlotContent ? "ce-divider__row" : "ce-divider__row is-empty";
    return html`
      <div class=${rowCls}>
        <span class="ce-divider__line"></span>
        <span class="ce-divider__label"><slot @slotchange=${this.#onSlotChange}></slot></span>
        <span class="ce-divider__line"></span>
      </div>
    `;
  }
}
