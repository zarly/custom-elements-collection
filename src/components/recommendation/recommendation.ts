import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type RecommendationPriority = "p0" | "p1" | "p2" | "p3";

/**
 * `<ce-recommendation>` — a prioritised advice block with colored left-border
 * accent. Replaces the raw `rec-item / rec-priority / rec-title / rec-impact`
 * pattern seen across corpus vis files.
 *
 * Attributes:
 *   priority — "p0" | "p1" | "p2" | "p3" (default "p2")
 *   title    — optional short headline
 *   impact   — optional short impact line
 *
 * Slots:
 *   title   — rich title override (use when title needs <code>, <ce-chip>, etc.)
 *   impact  — rich impact override
 *   meta    — optional metadata line (owner, due date, etc.)
 *   actions — optional footer row of action buttons/links
 *   (default) — body / description text; accepts any children
 */
export class CeRecommendation extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-left: 3px solid var(--ce-color-blue);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-3) var(--ce-space-4);
      color: var(--ce-text);
    }

    /* Priority → left-border color */
    :host([priority="p0"]) { border-left-color: var(--ce-color-red);    }
    :host([priority="p1"]) { border-left-color: var(--ce-color-amber);  }
    :host([priority="p2"]) { border-left-color: var(--ce-color-blue);   }
    :host([priority="p3"]) { border-left-color: var(--ce-border-strong);}

    /* ── Header row (badge + title) ─────────────────────────────────────── */
    .ce-rec__header {
      display: flex;
      align-items: baseline;
      gap: var(--ce-space-2);
      margin-bottom: var(--ce-space-2);
    }

    /* Priority badge */
    .ce-rec__badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 var(--ce-space-2);
      border-radius: var(--ce-radius);
      font-size: var(--ce-text-xs, var(--ce-text-sm));
      font-weight: 700;
      line-height: 1.4;
      flex-shrink: 0;

      /* default (p2) */
      background: var(--ce-color-blue-bg);
      color: var(--ce-color-blue);
    }
    :host([priority="p0"]) .ce-rec__badge {
      background: var(--ce-color-red-bg);
      color: var(--ce-color-red);
    }
    :host([priority="p1"]) .ce-rec__badge {
      background: var(--ce-color-amber-bg);
      color: var(--ce-color-amber);
    }
    :host([priority="p3"]) .ce-rec__badge {
      background: var(--ce-surface);
      color: var(--ce-text-muted, var(--ce-muted));
      border: 1px solid var(--ce-border-strong);
    }

    .ce-rec__title {
      font-weight: 700;
      font-size: var(--ce-text-md);
      flex: 1;
    }

    /* ── Impact line ─────────────────────────────────────────────────────── */
    .ce-rec__impact {
      font-size: var(--ce-text-sm);
      color: var(--ce-color-green);
      margin-bottom: var(--ce-space-2);
    }

    /* ── Meta line ──────────────────────────────────────────────────────── */
    .ce-rec__meta {
      font-size: var(--ce-text-sm);
      color: var(--ce-muted);
      margin-bottom: var(--ce-space-2);
    }

    /* ── Body ───────────────────────────────────────────────────────────── */
    .ce-rec__body {
      font-size: var(--ce-text-sm);
      color: var(--ce-text);
    }

    /* ── Actions footer ─────────────────────────────────────────────────── */
    .ce-rec__actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ce-space-2);
      margin-top: var(--ce-space-3);
      padding-top: var(--ce-space-2);
      border-top: 1px solid var(--ce-border-soft, var(--ce-border));
    }

    /* Hide empty optional sections via :has() (Baseline 2023) */
    .ce-rec__impact:not(:has(::slotted(*))) {
      display: none;
    }
    .ce-rec__meta:not(:has(::slotted(*))) {
      display: none;
    }
    .ce-rec__actions:not(:has(::slotted(*))) {
      display: none;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  priority: RecommendationPriority = "p2";

  @property({ type: String })
  override title = "";

  @property({ type: String })
  impact = "";

  override render() {
    const hasSlotTitle = this.querySelector('[slot="title"]') !== null;
    const hasSlotImpact = this.querySelector('[slot="impact"]') !== null;
    const showTitle = this.title || hasSlotTitle;
    const showImpact = this.impact || hasSlotImpact;

    const priorityLabel = this.priority.toUpperCase();

    return html`
      <article>
        <div class="ce-rec__header">
          <span
            class="ce-rec__badge"
            aria-label="Priority: ${priorityLabel}"
          >${priorityLabel}</span>
          ${showTitle
            ? html`<div class="ce-rec__title">
                <slot name="title">${this.title}</slot>
              </div>`
            : nothing}
        </div>

        ${showImpact
          ? html`<div class="ce-rec__impact">
              <slot name="impact">${this.impact}</slot>
            </div>`
          : html`<div class="ce-rec__impact"><slot name="impact"></slot></div>`}

        <div class="ce-rec__meta">
          <slot name="meta"></slot>
        </div>

        <div class="ce-rec__body">
          <slot></slot>
        </div>

        <div class="ce-rec__actions">
          <slot name="actions"></slot>
        </div>
      </article>
    `;
  }
}
