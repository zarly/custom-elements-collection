import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type VerdictType = "go" | "no-go" | "mixed" | "info";

const TYPE_DEFAULT_LABELS: Record<VerdictType, string> = {
  go: "Go",
  "no-go": "No-go",
  mixed: "Mixed",
  info: "Info",
};

/**
 * `<ce-verdict>` — decision banner with icon, title, and detail text.
 *
 * Attributes:
 *   type    — "go" (green) | "no-go" (red) | "mixed" (amber) | "info" (blue)
 *   title   — short verdict line (overrides slot name="title")
 *   detail  — supporting text (overrides default slot)
 *   icon    — optional override icon char; defaults by type (✓ ✗ ⚠ ℹ)
 *   inline  — compact pill layout (per-instance override; pairs with
 *             --ce-verdict-layout for document-wide control via @container style())
 *
 * Per CDR-001, the default slot carries the unbounded vocabulary label when
 * `inline` is set (e.g. "SHIP IT", "veto", "pursue"). Empty slot falls back
 * to the canonical type label ("Go", "No-go", "Mixed", "Info").
 */
export class CeVerdict extends CecElement {
  static override styles = css`
    :host {
      display: flex;
      gap: var(--ce-space-4);
      align-items: flex-start;
      padding: var(--ce-space-5);
      border-radius: var(--ce-radius);
      border: 1px solid var(--ce-color-blue-border);
      background: linear-gradient(135deg, var(--ce-color-blue-bg), transparent);
    }
    :host([type="go"]) {
      border-color: var(--ce-color-green-border);
      background: linear-gradient(135deg, var(--ce-color-green-bg), transparent);
    }
    :host([type="no-go"]) {
      border-color: var(--ce-color-red-border);
      background: linear-gradient(135deg, var(--ce-color-red-bg), transparent);
    }
    :host([type="mixed"]) {
      border-color: var(--ce-color-amber-border);
      background: linear-gradient(135deg, var(--ce-color-amber-bg), transparent);
    }

    /* Inline pill layout (per-instance opt-in via [inline]). */
    :host([inline]) {
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-2);
      padding: var(--ce-space-1) var(--ce-space-3);
      border-radius: 999px;
      background: var(--ce-color-blue-bg);
      vertical-align: middle;
      font-weight: 600;
      font-size: var(--ce-text-sm);
      line-height: 1.2;
    }
    :host([inline][type="go"])    { background: var(--ce-color-green-bg); }
    :host([inline][type="no-go"]) { background: var(--ce-color-red-bg);   }
    :host([inline][type="mixed"]) { background: var(--ce-color-amber-bg); }

    /* Document-wide inline layout via CSS var; per-instance [inline] still wins. */
    @container style(--ce-verdict-layout: inline) {
      :host {
        display: inline-flex;
        align-items: center;
        gap: var(--ce-space-2);
        padding: var(--ce-space-1) var(--ce-space-3);
        border-radius: 999px;
        background: var(--ce-color-blue-bg);
        vertical-align: middle;
        font-weight: 600;
        font-size: var(--ce-text-sm);
        line-height: 1.2;
      }
      :host([type="go"])    { background: var(--ce-color-green-bg); }
      :host([type="no-go"]) { background: var(--ce-color-red-bg);   }
      :host([type="mixed"]) { background: var(--ce-color-amber-bg); }
    }

    .ce-verdict__icon {
      width: var(--ce-sz-lg);
      height: var(--ce-sz-lg);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--ce-text-xl);
      font-weight: 700;
      flex: 0 0 auto;
      background: var(--ce-color-blue-bg);
      color: var(--ce-color-blue);
    }
    :host([type="go"])    .ce-verdict__icon { background: var(--ce-color-green-bg);  color: var(--ce-color-green);  }
    :host([type="no-go"]) .ce-verdict__icon { background: var(--ce-color-red-bg);    color: var(--ce-color-red);    }
    :host([type="mixed"]) .ce-verdict__icon { background: var(--ce-color-amber-bg);  color: var(--ce-color-amber);  }

    /* In inline mode the icon disk shrinks and loses its background tint. */
    :host([inline]) .ce-verdict__icon {
      width: auto;
      height: auto;
      background: transparent;
      font-size: var(--ce-text-md);
    }
    @container style(--ce-verdict-layout: inline) {
      .ce-verdict__icon {
        width: auto;
        height: auto;
        background: transparent;
        font-size: var(--ce-text-md);
      }
    }

    .ce-verdict__body { min-width: 0; }
    .ce-verdict__title {
      font-weight: 700;
      font-size: var(--ce-text-md);
      margin-bottom: var(--ce-space-1);
      color: var(--ce-color-blue);
    }
    :host([type="go"])    .ce-verdict__title { color: var(--ce-color-green); }
    :host([type="no-go"]) .ce-verdict__title { color: var(--ce-color-red);   }
    :host([type="mixed"]) .ce-verdict__title { color: var(--ce-color-amber); }
    .ce-verdict__detail {
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
    }

    /* Inline mode renders a single label, not the title/detail block. */
    .ce-verdict__label {
      color: var(--ce-color-blue);
    }
    :host([type="go"])    .ce-verdict__label { color: var(--ce-color-green); }
    :host([type="no-go"]) .ce-verdict__label { color: var(--ce-color-red);   }
    :host([type="mixed"]) .ce-verdict__label { color: var(--ce-color-amber); }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true }) type: VerdictType = "info";
  @property({ type: String }) override title = "";
  @property({ type: String }) detail = "";
  @property({ type: String }) icon = "";
  @property({ type: Boolean, reflect: true }) inline = false;

  get #defaultIcon(): string {
    switch (this.type) {
      case "go": return "✓";
      case "no-go": return "✗";
      case "mixed": return "⚠";
      default: return "ℹ";
    }
  }

  override render() {
    const iconChar = this.icon || this.#defaultIcon;
    if (this.inline) {
      const fallbackLabel = TYPE_DEFAULT_LABELS[this.type] ?? TYPE_DEFAULT_LABELS.info;
      return html`
        <span class="ce-verdict__icon" aria-hidden="true">${iconChar}</span>
        <span class="ce-verdict__label"><slot>${fallbackLabel}</slot></span>
      `;
    }
    return html`
      <div class="ce-verdict__icon" aria-hidden="true">${iconChar}</div>
      <div class="ce-verdict__body">
        ${this.title
          ? html`<div class="ce-verdict__title"><slot name="title">${this.title}</slot></div>`
          : nothing}
        <div class="ce-verdict__detail">
          <slot>${this.detail}</slot>
        </div>
      </div>
    `;
  }
}
