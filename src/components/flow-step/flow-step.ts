import { html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, type CecColor } from "../../core/index.js";

/**
 * `<ce-flow-step>` — a single step for use inside `<ce-flow>` (slot mode per
 * CDR-005), or as a standalone step card when used outside.
 *
 * When nested inside `<ce-flow>`, the parent reads `title`, `n`, `icon`, and
 * `color` from this element's attributes and consumes the default slot HTML via
 * querySelectorAll — the step itself renders nothing (display:contents). When
 * used standalone it renders a full step card with the step number, icon, title,
 * and body content from the default slot.
 *
 * Slots:
 *   default — rich step body. Can contain paragraphs, lists, links, chips —
 *             anything HTML (per CDR-002).
 */
export class CeFlowStep extends CecElement {
  static override styles = css`
    :host {
      display: contents; /* invisible when nested inside ce-flow */
    }
    :host([data-standalone]) {
      display: block;
    }

    /* Standalone card layout */
    .ce-fs-wrap {
      display: grid;
      grid-template-columns: auto 1fr;
      column-gap: var(--ce-space-3);
      align-items: start;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-3) var(--ce-space-4);
    }
    .ce-fs-wrap.c-green  { border-color: var(--ce-color-green);  background: var(--ce-color-green-bg);  }
    .ce-fs-wrap.c-red    { border-color: var(--ce-color-red);    background: var(--ce-color-red-bg);    }
    .ce-fs-wrap.c-amber  { border-color: var(--ce-color-amber);  background: var(--ce-color-amber-bg);  }
    .ce-fs-wrap.c-blue   { border-color: var(--ce-color-blue);   background: var(--ce-color-blue-bg);   }
    .ce-fs-wrap.c-purple { border-color: var(--ce-color-purple); background: var(--ce-color-purple-bg); }
    .ce-fs-wrap.c-cyan   { border-color: var(--ce-color-cyan);   background: var(--ce-color-cyan-bg);   }

    .ce-fs-aside {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--ce-space-1);
      min-width: 2em;
    }
    .ce-fs-n {
      font-weight: 700;
      font-size: var(--ce-text-sm);
      color: var(--ce-muted);
      line-height: 1;
    }
    .ce-fs-icon {
      font-size: var(--ce-text-lg);
      line-height: 1;
    }

    .ce-fs-title {
      font-weight: 700;
      font-size: var(--ce-text-sm);
      color: var(--ce-text);
      margin: 0 0 var(--ce-space-1) 0;
    }
    .ce-fs-body {
      font-size: var(--ce-text-sm);
      color: var(--ce-muted);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  /** Step number label — identity-shaped short string per CDR-002. */
  @property({ type: String, reflect: true }) n = "";

  /** Step title — short string identity attr per CDR-002. */
  @property({ type: String, reflect: true }) title = "";

  /** Optional icon glyph or emoji. */
  @property({ type: String, reflect: true }) icon = "";

  /** Optional color tint from the CecColor vocabulary. */
  @property({ type: String, reflect: true }) color: CecColor | "" = "";

  /** Internal flag: true when not inside a ce-flow parent. */
  @state() private _standalone = false;

  override connectedCallback(): void {
    super.connectedCallback();
    const nested = this.closest("ce-flow") !== null;
    this._standalone = !nested;
    if (this._standalone) {
      this.setAttribute("data-standalone", "");
    } else {
      this.removeAttribute("data-standalone");
    }
  }

  override render() {
    if (!this._standalone) {
      // Parent reads our attrs + slot HTML. Render nothing visible.
      return nothing;
    }

    const colorClass = this.color ? `c-${this.color}` : "";
    return html`
      <div class="ce-fs-wrap ${colorClass}">
        <div class="ce-fs-aside">
          ${this.n ? html`<span class="ce-fs-n">${this.n}</span>` : nothing}
          ${this.icon ? html`<span class="ce-fs-icon" aria-hidden="true">${this.icon}</span>` : nothing}
        </div>
        <div class="ce-fs-main">
          ${this.title ? html`<div class="ce-fs-title">${this.title}</div>` : nothing}
          <div class="ce-fs-body"><slot></slot></div>
        </div>
      </div>
    `;
  }
}
