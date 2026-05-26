import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-center>` — horizontally-centered max-width content column.
 *
 * Usage:
 *
 *   <ce-center max="prose">
 *     <h1>Title</h1>
 *     <p>Body of the article…</p>
 *   </ce-center>
 *
 *   <ce-center max="wide" gutter="l">
 *     <ce-grid cols="3">…</ce-grid>
 *   </ce-center>
 *
 *   <ce-center max="narrow" intrinsic>
 *     <h2>Centered heading</h2>
 *     <p>Body paragraph.</p>
 *   </ce-center>
 *
 * Attributes (all reflected):
 *   max      — "prose" | "narrow" | "wide" | "full" (default "prose" ≈ 65ch)
 *   gutter   — "s" | "m" | "l" (default "m"; maps to space tokens, inline only)
 *   intrinsic — boolean; also centers block-direction children via flex column
 *
 * Shadow DOM is required for :host([max="…"]) and :host([gutter="…"]) selectors.
 * See ADR-002 — this is the approved exception path via createShadowRootWithStyles().
 */
export class CeCenter extends CecElement {
  static override styles = css`
    /* ---- base ---- */
    :host {
      display: block;
      max-width: 65ch;           /* prose default */
      padding-inline: var(--ce-space-4); /* gutter=m default */
      margin-inline: auto;
      box-sizing: content-box;   /* max-width is pure content width */
    }

    /* ---- max variants ---- */
    :host([max="prose"])  { max-width: 65ch; }
    :host([max="narrow"]) { max-width: 42ch; }
    :host([max="wide"])   { max-width: 80ch; }
    :host([max="full"])   { max-width: 100%; }

    /* ---- gutter variants ---- */
    :host([gutter="s"]) { padding-inline: var(--ce-space-3); }
    :host([gutter="m"]) { padding-inline: var(--ce-space-4); }
    :host([gutter="l"]) { padding-inline: var(--ce-space-5); }

    /* ---- intrinsic: center children along the block axis ---- */
    :host([intrinsic]) {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  `;

  /** Override to use Shadow DOM so :host([attr]) selectors resolve. ADR-002 exception. */
  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  /** Maximum content width. Maps: prose=65ch, narrow=42ch, wide=80ch, full=100%. */
  @property({ type: String, reflect: true })
  max: "prose" | "narrow" | "wide" | "full" = "prose";

  /** Inline gutter size. Maps: s→--ce-space-3, m→--ce-space-4, l→--ce-space-5. */
  @property({ type: String, reflect: true })
  gutter: "s" | "m" | "l" = "m";

  /**
   * When set, children are also centered (flex column + align-items: center).
   * Without it, only the box itself is centered; children flow normally inside.
   */
  @property({ type: Boolean, reflect: true })
  intrinsic = false;

  override render() {
    return html`<slot></slot>`;
  }
}
