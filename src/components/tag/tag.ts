import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, type CecColor } from "../../core/index.js";

/**
 * `<ce-tag>` — content-taxonomy label.
 *
 * Different from <ce-chip> (which is a status pip). A tag is an authored
 * categorisation token: a topic, a tag-cloud entry, a multi-value filter
 * facet. It can be optionally removable (X button → emits `ce-tag-remove`).
 *
 * Attributes:
 *   color     — CecColor tint (neutral default)
 *   removable — boolean; renders an X button that emits ce-tag-remove
 *   value     — optional opaque identifier surfaced in the remove event detail
 *
 * Slot: default — tag label.
 *
 * Events:
 *   ce-tag-remove — { detail: { value: string | null } }, bubbles + composed.
 */
export class CeTag extends CecElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-1);
      padding: var(--ce-inset-xs) var(--ce-space-2);
      font-size: var(--ce-text-xs);
      font-weight: 500;
      line-height: var(--ce-line-snug);
      border-radius: var(--ce-radius-sm);
      background: var(--ce-surface-2);
      color: var(--ce-text);
      border: 1px solid var(--ce-border-soft);
      vertical-align: middle;
      white-space: nowrap;
    }

    :host([color="green"])  { background: var(--ce-color-green-bg);  color: var(--ce-color-green);  border-color: var(--ce-color-green-border);  }
    :host([color="red"])    { background: var(--ce-color-red-bg);    color: var(--ce-color-red);    border-color: var(--ce-color-red-border);    }
    :host([color="amber"])  { background: var(--ce-color-amber-bg);  color: var(--ce-color-amber);  border-color: var(--ce-color-amber-border);  }
    :host([color="blue"])   { background: var(--ce-color-blue-bg);   color: var(--ce-color-blue);   border-color: var(--ce-color-blue-border);   }
    :host([color="purple"]) { background: var(--ce-color-purple-bg); color: var(--ce-color-purple); border-color: var(--ce-color-purple-border); }
    :host([color="cyan"])   { background: var(--ce-color-cyan-bg);   color: var(--ce-color-cyan);   border-color: var(--ce-color-cyan-border);   }

    .ce-tag__hash {
      opacity: 0.5;
      font-weight: 400;
    }
    .ce-tag__remove {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      margin-left: 2px;
      border: 0;
      padding: 0;
      cursor: pointer;
      background: transparent;
      color: inherit;
      opacity: 0.6;
      border-radius: var(--ce-radius-sm);
      font: inherit;
      line-height: 1;
    }
    .ce-tag__remove:hover { opacity: 1; background: var(--ce-border-soft); }
    .ce-tag__remove:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true }) color: CecColor | null = null;
  @property({ type: Boolean, reflect: true }) removable = false;
  @property({ type: String }) value: string | null = null;

  #onRemove = (e: Event): void => {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("ce-tag-remove", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  };

  override render() {
    return html`
      <span class="ce-tag__hash" aria-hidden="true">#</span>
      <slot></slot>
      ${this.removable
        ? html`<button
            type="button"
            class="ce-tag__remove"
            aria-label="Remove"
            @click=${this.#onRemove}
          >
            ×
          </button>`
        : nothing}
    `;
  }
}
