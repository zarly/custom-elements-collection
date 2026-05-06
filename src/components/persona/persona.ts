import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, type CecColor } from "../../core/index.js";

/**
 * `<ce-persona>` — user-research persona / role card.
 *
 * Attributes:
 *   name   — person/role name
 *   role   — short role line (subtitle)
 *   avatar — emoji or single character to use as avatar (no images at runtime)
 *   color  — accent color (default neutral)
 *
 * Slots:
 *   tags    — chips below the role
 *   (default) — body / details list
 */
export class CePersona extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-4) var(--ce-space-5);
    }
    :host([color="green"])  { border-top: 3px solid var(--ce-color-green);  }
    :host([color="red"])    { border-top: 3px solid var(--ce-color-red);    }
    :host([color="amber"])  { border-top: 3px solid var(--ce-color-amber);  }
    :host([color="blue"])   { border-top: 3px solid var(--ce-color-blue);   }
    :host([color="purple"]) { border-top: 3px solid var(--ce-color-purple); }
    :host([color="cyan"])   { border-top: 3px solid var(--ce-color-cyan);   }

    .ce-persona__head {
      display: flex;
      gap: var(--ce-space-3);
      align-items: center;
      margin-bottom: var(--ce-space-3);
    }
    .ce-persona__avatar {
      width: var(--ce-sz-lg);
      height: var(--ce-sz-lg);
      border-radius: 50%;
      background: var(--ce-surface-2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--ce-text-xl);
      flex: 0 0 auto;
    }
    :host([color="green"])  .ce-persona__avatar { background: var(--ce-color-green-bg);  color: var(--ce-color-green);  }
    :host([color="red"])    .ce-persona__avatar { background: var(--ce-color-red-bg);    color: var(--ce-color-red);    }
    :host([color="amber"])  .ce-persona__avatar { background: var(--ce-color-amber-bg);  color: var(--ce-color-amber);  }
    :host([color="blue"])   .ce-persona__avatar { background: var(--ce-color-blue-bg);   color: var(--ce-color-blue);   }
    :host([color="purple"]) .ce-persona__avatar { background: var(--ce-color-purple-bg); color: var(--ce-color-purple); }
    :host([color="cyan"])   .ce-persona__avatar { background: var(--ce-color-cyan-bg);   color: var(--ce-color-cyan);   }

    .ce-persona__name {
      font-size: var(--ce-text-md);
      font-weight: 700;
      color: var(--ce-text);
    }
    .ce-persona__role {
      font-size: var(--ce-text-sm);
      color: var(--ce-muted);
    }
    .ce-persona__tags {
      display: flex;
      gap: var(--ce-space-1);
      flex-wrap: wrap;
      margin: var(--ce-space-2) 0 var(--ce-space-3);
    }
    .ce-persona__tags:not(:has(::slotted(*))) { display: none; }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) name = "";
  @property({ type: String }) role = "";
  @property({ type: String }) avatar = "";
  @property({ type: String, reflect: true }) color: CecColor = "neutral";

  override render() {
    return html`
      <div class="ce-persona__head">
        ${this.avatar
          ? html`<div class="ce-persona__avatar" aria-hidden="true">${this.avatar}</div>`
          : nothing}
        <div>
          <div class="ce-persona__name">${this.name}</div>
          <div class="ce-persona__role">${this.role}</div>
        </div>
      </div>
      <div class="ce-persona__tags"><slot name="tags"></slot></div>
      <slot></slot>
    `;
  }
}
