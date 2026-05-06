import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<lesson-frame>` — top-level shell for a lesson page.
 * Renders a fixed top progress bar plus a centered content column.
 *
 * Attributes:
 *   progress  — number in [0, 100], current scroll/completion percentage
 *   title     — lesson title
 *   meta      — short meta line (difficulty · time · impact)
 *
 * Slots:
 *   header (default in <header>) — extra chips/tags
 *   (default) — lesson body
 */
export class LessonFrame extends CecElement {
  static override styles = css`
    :host {
      display: block;
      --lf-max: 880px;
    }
    .lf-progress-track {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: var(--ce-surface-2);
      z-index: 100;
    }
    .lf-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--ce-color-cyan), var(--ce-color-green));
      transition: width var(--ce-transition-fast);
    }
    .lf-shell {
      max-width: var(--lf-max);
      margin: 0 auto;
      padding: var(--ce-space-7) var(--ce-space-5);
    }
    .lf-header {
      text-align: center;
      margin-bottom: var(--ce-space-6);
    }
    .lf-title {
      font-size: var(--ce-text-2xl);
      font-weight: 800;
      color: var(--ce-text);
      margin: 0 0 var(--ce-space-2);
    }
    .lf-meta {
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: Number }) progress = 0;
  @property({ type: String }) override title = "";
  @property({ type: String }) meta = "";

  override render() {
    const pct = Math.max(0, Math.min(100, this.progress));
    return html`
      <div class="lf-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${pct}>
        <div class="lf-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="lf-shell">
        <header class="lf-header">
          <h1 class="lf-title">${this.title}</h1>
          ${this.meta ? html`<div class="lf-meta">${this.meta}</div>` : ""}
          <slot name="header"></slot>
        </header>
        <slot></slot>
      </div>
    `;
  }
}
