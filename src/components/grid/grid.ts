import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-grid>` — responsive grid layout.
 *
 * Attributes:
 *   cols   — "2" | "3" | "4" (default "3")
 *   min    — minimum column width in pixels when auto is set (default 240)
 *   auto   — boolean; use `repeat(auto-fit, minmax(min, 1fr))` instead of fixed cols
 *   gap    — "sm" | "md" | "lg" (maps to tokens; default "md" = 16px)
 *
 * Responsive: at <= 640px the grid collapses to a single column automatically.
 */
export class CeGrid extends CecElement {
  static override styles = css`
    :host {
      display: grid;
      gap: var(--ce-space-4);
    }
    :host([gap="sm"]) { gap: var(--ce-space-2); }
    :host([gap="md"]) { gap: var(--ce-space-4); }
    :host([gap="lg"]) { gap: var(--ce-space-5); }

    :host([cols="2"]) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    :host([cols="3"]) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    :host([cols="4"]) { grid-template-columns: repeat(4, minmax(0, 1fr)); }

    :host([auto]) {
      grid-template-columns: repeat(auto-fit, minmax(var(--ce-grid-min, 240px), 1fr));
    }

    @media (max-width: 640px) {
      :host { grid-template-columns: 1fr !important; }
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  cols: "2" | "3" | "4" = "3";

  @property({ type: Number })
  min = 240;

  @property({ type: Boolean, reflect: true })
  auto = false;

  @property({ type: String, reflect: true })
  gap: "sm" | "md" | "lg" = "md";

  override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("min")) {
      this.style.setProperty("--ce-grid-min", `${this.min}px`);
    }
  }

  override render() {
    return html`<slot></slot>`;
  }
}
