import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, jsonProp, type CecColor } from "../core/index.js";

export interface TimelineItem {
  /** Headline for the step. */
  title: string;
  /** Optional secondary text (date, duration, owner). */
  meta?: string;
  /** Longer description. */
  description?: string;
  /** Semantic color for the dot. */
  color?: CecColor;
  /** Icon character shown inside the dot (default: bullet). */
  icon?: string;
}

/**
 * `<ce-timeline>` — vertical timeline of steps.
 *
 * Attributes:
 *   orientation — "vertical" (default) | "horizontal"
 *
 * Provide items as the `items` property (array) or place `<ce-timeline-item>`
 * children (not yet implemented — use items array for now).
 */
export class CeTimeline extends CecElement {
  static override styles = css`
    :host {
      display: block;
    }
    :host([orientation="vertical"]) .ce-tl {
      display: flex;
      flex-direction: column;
      position: relative;
    }
    :host([orientation="vertical"]) .ce-tl::before {
      content: "";
      position: absolute;
      left: 13px;
      top: 8px;
      bottom: 8px;
      width: 2px;
      background: var(--ce-border-soft);
    }
    .ce-tl-item {
      position: relative;
      padding-left: 40px;
      padding-bottom: var(--ce-space-4);
    }
    .ce-tl-dot {
      position: absolute;
      left: 4px;
      top: 3px;
      width: var(--ce-sz-sm);
      height: var(--ce-sz-sm);
      border-radius: 50%;
      background: var(--ce-surface-2);
      border: 2px solid var(--ce-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--ce-text-xs);
      color: var(--ce-muted);
      z-index: 1;
    }
    .ce-tl-dot.c-green  { background: var(--ce-color-green-bg);  border-color: var(--ce-color-green);  color: var(--ce-color-green);  }
    .ce-tl-dot.c-red    { background: var(--ce-color-red-bg);    border-color: var(--ce-color-red);    color: var(--ce-color-red);    }
    .ce-tl-dot.c-amber  { background: var(--ce-color-amber-bg);  border-color: var(--ce-color-amber);  color: var(--ce-color-amber);  }
    .ce-tl-dot.c-blue   { background: var(--ce-color-blue-bg);   border-color: var(--ce-color-blue);   color: var(--ce-color-blue);   }
    .ce-tl-dot.c-purple { background: var(--ce-color-purple-bg); border-color: var(--ce-color-purple); color: var(--ce-color-purple); }
    .ce-tl-dot.c-cyan   { background: var(--ce-color-cyan-bg);   border-color: var(--ce-color-cyan);   color: var(--ce-color-cyan);   }

    .ce-tl-title {
      font-weight: 700;
      color: var(--ce-text);
      font-size: var(--ce-text-base);
    }
    .ce-tl-meta {
      font-size: var(--ce-text-xs);
      color: var(--ce-muted);
      margin-top: 2px;
    }
    .ce-tl-desc {
      font-size: var(--ce-text-sm);
      color: var(--ce-muted);
      margin-top: var(--ce-space-1);
    }

    /* Horizontal variant */
    :host([orientation="horizontal"]) .ce-tl {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: 1fr;
      gap: var(--ce-space-3);
      position: relative;
    }
    :host([orientation="horizontal"]) .ce-tl-item {
      padding: 0;
    }
    :host([orientation="horizontal"]) .ce-tl-dot {
      position: static;
      margin-bottom: var(--ce-space-2);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property(jsonProp<TimelineItem[]>([])) items: TimelineItem[] = [];
  @property({ type: String, reflect: true }) orientation: "vertical" | "horizontal" = "vertical";

  override render() {
    return html`
      <div class="ce-tl">
        ${this.items.map(
          (it) => html`
            <div class="ce-tl-item">
              <span
                class="ce-tl-dot ${it.color ? `c-${it.color}` : ""}"
                aria-hidden="true"
                >${it.icon ?? "•"}</span
              >
              <div class="ce-tl-title">${it.title}</div>
              ${it.meta ? html`<div class="ce-tl-meta">${it.meta}</div>` : ""}
              ${it.description
                ? html`<div class="ce-tl-desc">${it.description}</div>`
                : ""}
            </div>
          `
        )}
      </div>
    `;
  }
}
