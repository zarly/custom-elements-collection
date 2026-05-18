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
 *   rank   — short identity pill label (e.g. "#1") shown near the name
 *   score  — short identity pill label (e.g. "8 / 10") shown near the name
 *
 * Slots:
 *   tags    — chips below the role
 *   detail  — rich detail paragraph (accepts <p>, <a>, <ce-chip> content)
 *   meta    — free-form metadata rows (typically <ce-kv> items)
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
    .ce-persona__name-row {
      display: flex;
      align-items: center;
      gap: var(--ce-space-2);
      flex-wrap: wrap;
    }
    .ce-persona__pill {
      display: inline-flex;
      align-items: center;
      font-size: var(--ce-text-xs);
      font-weight: 600;
      padding: 1px var(--ce-space-2);
      border-radius: var(--ce-radius-pill);
      background: var(--ce-surface-2);
      color: var(--ce-muted);
      border: 1px solid var(--ce-border-soft);
      white-space: nowrap;
    }
    :host([color="green"])  .ce-persona__pill { background: var(--ce-color-green-bg);  color: var(--ce-color-green);  border-color: var(--ce-color-green-border);  }
    :host([color="red"])    .ce-persona__pill { background: var(--ce-color-red-bg);    color: var(--ce-color-red);    border-color: var(--ce-color-red-border);    }
    :host([color="amber"])  .ce-persona__pill { background: var(--ce-color-amber-bg);  color: var(--ce-color-amber);  border-color: var(--ce-color-amber-border);  }
    :host([color="blue"])   .ce-persona__pill { background: var(--ce-color-blue-bg);   color: var(--ce-color-blue);   border-color: var(--ce-color-blue-border);   }
    :host([color="purple"]) .ce-persona__pill { background: var(--ce-color-purple-bg); color: var(--ce-color-purple); border-color: var(--ce-color-purple-border); }
    :host([color="cyan"])   .ce-persona__pill { background: var(--ce-color-cyan-bg);   color: var(--ce-color-cyan);   border-color: var(--ce-color-cyan-border);   }

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
    .ce-persona__detail {
      font-size: var(--ce-text-sm);
      color: var(--ce-muted);
      margin: var(--ce-space-2) 0;
    }
    .ce-persona__detail:not(:has(::slotted(*))) { display: none; }
    .ce-persona__meta {
      margin-top: var(--ce-space-3);
    }
    .ce-persona__meta:not(:has(::slotted(*))) { display: none; }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) name = "";
  @property({ type: String }) role = "";
  @property({ type: String }) avatar = "";
  @property({ type: String, reflect: true }) color: CecColor = "neutral";
  @property({ type: String }) rank = "";
  @property({ type: String }) score = "";

  override render() {
    return html`
      <div class="ce-persona__head">
        ${this.avatar
          ? html`<div class="ce-persona__avatar" aria-hidden="true">${this.avatar}</div>`
          : nothing}
        <div>
          <div class="ce-persona__name-row">
            <span class="ce-persona__name">${this.name}</span>
            ${this.rank ? html`<span class="ce-persona__pill">${this.rank}</span>` : nothing}
            ${this.score ? html`<span class="ce-persona__pill">${this.score}</span>` : nothing}
          </div>
          <div class="ce-persona__role">${this.role}</div>
        </div>
      </div>
      <div class="ce-persona__tags"><slot name="tags"></slot></div>
      <div class="ce-persona__detail"><slot name="detail"></slot></div>
      <div class="ce-persona__meta"><slot name="meta"></slot></div>
      <slot></slot>
    `;
  }
}
