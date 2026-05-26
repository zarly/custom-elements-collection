import { html, css, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type CeSpinnerSize = "xs" | "sm" | "md" | "lg";
export type CeSpinnerTone = "default" | "muted" | "accent";

/**
 * `<ce-spinner>` — spinning indicator atom for inline loading affordance.
 *
 * Usage:
 *
 *   <ce-spinner></ce-spinner>
 *   <ce-spinner size="sm"></ce-spinner>
 *   <ce-spinner size="sm" tone="accent"></ce-spinner>
 *   <ce-spinner label="Uploading"></ce-spinner>
 *
 * Attributes (all reflected):
 *   size   — "xs" | "sm" | "md" | "lg" (default "md")
 *   label  — accessible name for screen readers; default "Loading"
 *   tone   — "default" | "muted" | "accent" (default "default")
 *
 * Accessibility:
 *   The host carries role="status" and aria-label (driven by `label`).
 *   When paired with adjacent visible text (e.g. "Saving…"), the visible
 *   text is the accessible label so the `label` default suffices.
 */
export class CeSpinner extends CecElement {
  static override styles = css`
    :host {
      display: inline-block;
      vertical-align: middle;
      flex-shrink: 0;
      line-height: 1;
    }

    .spinner {
      display: block;
      border-radius: 50%;
      border: 2px solid currentColor;
      border-top-color: transparent;
      animation: ce-spinner-spin 0.8s linear infinite;
      box-sizing: border-box;
    }

    /* sizes */
    :host([size="xs"]) .spinner { width: 12px; height: 12px; }
    :host([size="sm"]) .spinner { width: 16px; height: 16px; }
    :host([size="md"]) .spinner,
    :host(:not([size])) .spinner { width: 20px; height: 20px; }
    :host([size="lg"]) .spinner { width: 28px; height: 28px; }

    /* tones */
    :host([tone="muted"]) .spinner           { color: var(--ce-muted); }
    :host([tone="accent"]) .spinner          { color: var(--ce-color-blue); }
    /* tone="default" inherits currentColor from the parent — no override needed */

    @keyframes ce-spinner-spin {
      to { transform: rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      @keyframes ce-spinner-spin {
        50% { opacity: 0.4; }
      }
      :host {
        animation-duration: 1.5s;
      }
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  size: CeSpinnerSize = "md";

  @property({ type: String, reflect: true })
  label = "Loading";

  @property({ type: String, reflect: true })
  tone: CeSpinnerTone = "default";

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "status");
    this.setAttribute("aria-label", this.label);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("label")) {
      this.setAttribute("aria-label", this.label);
    }
  }

  override render() {
    return html`<span class="spinner" aria-hidden="true"></span>`;
  }
}
