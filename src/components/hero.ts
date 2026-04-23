import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../core/index.js";

/**
 * `<ce-hero>` — page header with kicker, title, lede, and optional stats slot.
 *
 * Attributes:
 *   kicker   — small eyebrow text above title
 *   title    — main heading (falls back to `name`-slot if empty)
 *   lede     — supporting paragraph
 *   flat     — boolean; suppresses the radial gradient background
 *
 * Slots:
 *   title    — override the title attribute with custom markup
 *   (default)— additional body content below the lede
 *   stats    — inline stat row (typically `<ce-kpi>`s)
 */
export class CeHero extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background:
        radial-gradient(1200px 400px at 15% -10%, rgba(188, 140, 255, 0.18), transparent 60%),
        radial-gradient(800px 300px at 90% 0%, rgba(63, 185, 80, 0.12), transparent 60%);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-lg);
      padding: var(--ce-space-7) var(--ce-space-6);
      margin-bottom: var(--ce-space-5);
      position: relative;
      overflow: hidden;
    }
    :host([flat]) { background: var(--ce-surface); }

    .ce-hero__kicker {
      display: inline-block;
      font-size: var(--ce-text-xs);
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ce-color-purple);
      background: var(--ce-color-purple-bg);
      padding: 5px 12px;
      border-radius: var(--ce-radius-pill);
      border: 1px solid var(--ce-color-purple-border);
      margin-bottom: var(--ce-space-3);
    }
    .ce-hero__title {
      font-size: var(--ce-text-3xl);
      line-height: var(--ce-line-tight);
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0 0 var(--ce-space-3) 0;
      background: linear-gradient(135deg, var(--ce-text) 0%, var(--ce-color-purple) 55%, var(--ce-color-blue) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: transparent;
    }
    .ce-hero__title ::slotted(*) {
      margin: 0;
      font: inherit;
      color: inherit;
    }
    .ce-hero__lede {
      font-size: var(--ce-text-lg);
      color: var(--ce-muted);
      max-width: 820px;
      margin: 0 0 var(--ce-space-5) 0;
    }
    .ce-hero__stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: var(--ce-space-3);
      margin-top: var(--ce-space-4);
    }
    /* Hide empty slot wrappers */
    .ce-hero__stats:not(:has(::slotted(*))) { display: none; }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) kicker = "";
  // Note: `title` is inherited from HTMLElement (string, defaults to "").
  // We reuse it rather than shadow with a different type.
  @property({ type: String }) override title = "";
  @property({ type: String }) lede = "";
  @property({ type: Boolean, reflect: true }) flat = false;

  override render() {
    return html`
      ${this.kicker ? html`<span class="ce-hero__kicker">${this.kicker}</span>` : nothing}
      <h1 class="ce-hero__title">
        <slot name="title">${this.title}</slot>
      </h1>
      ${this.lede ? html`<p class="ce-hero__lede">${this.lede}</p>` : nothing}
      <slot></slot>
      <div class="ce-hero__stats">
        <slot name="stats"></slot>
      </div>
    `;
  }
}
