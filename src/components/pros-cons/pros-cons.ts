import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

/**
 * `<ce-pros-cons>` — explicit two-column pros / cons block.
 *
 * Default rendering is a two-column grid: left column accents in `--ce-color-green`
 * and shows ✓ items, right column accents in `--ce-color-red` and shows ✗ items.
 * Below a narrow breakpoint the columns stack.
 *
 * Two equally idiomatic shapes (CDR-005):
 *   • `pros='["a","b"]'` + `cons='["c","d"]'` JSON-on-attribute
 *   • `<li slot="pros">a</li>` + `<li slot="cons">c</li>` slot mode
 *
 * Attributes:
 *   pros        — JSON array of pros (strings)
 *   cons        — JSON array of cons (strings)
 *   pros-label  — left-column header (default "Pros")
 *   cons-label  — right-column header (default "Cons")
 *
 * Slots:
 *   pros — list items (or any nodes) for the left column
 *   cons — list items (or any nodes) for the right column
 */
export class CeProsCons extends CecElement {
  static override styles = css`
    :host {
      display: block;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--ce-space-3);
    }
    @media (max-width: 540px) {
      .grid { grid-template-columns: 1fr; }
    }
    .col {
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-3) var(--ce-space-4);
    }
    .col[data-kind="pros"] {
      border-left: 3px solid var(--ce-color-green);
      background: var(--ce-color-green-bg);
    }
    .col[data-kind="cons"] {
      border-left: 3px solid var(--ce-color-red);
      background: var(--ce-color-red-bg);
    }
    .head {
      display: flex;
      align-items: center;
      gap: var(--ce-space-2);
      margin-bottom: var(--ce-space-2);
      font-size: var(--ce-text-sm);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 700;
      color: var(--ce-text);
    }
    .icon {
      width: 18px;
      height: 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      font-size: var(--ce-text-xs);
      font-weight: 700;
    }
    .col[data-kind="pros"] .icon {
      background: var(--ce-color-green);
      color: var(--ce-text-inverse);
    }
    .col[data-kind="cons"] .icon {
      background: var(--ce-color-red);
      color: var(--ce-text-inverse);
    }
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--ce-space-2);
    }
    li {
      display: flex;
      align-items: flex-start;
      gap: var(--ce-space-2);
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
      line-height: var(--ce-line-normal);
    }
    li::before {
      content: "•";
      color: var(--ce-muted);
      flex: 0 0 auto;
      line-height: 1.2;
    }
    .col[data-kind="pros"] li::before { content: "✓"; color: var(--ce-color-green); font-weight: 700; }
    .col[data-kind="cons"] li::before { content: "✗"; color: var(--ce-color-red); font-weight: 700; }
    ::slotted(li),
    ::slotted(p) {
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
      line-height: var(--ce-line-normal);
      margin: 0;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property(jsonProp<string[]>([], "pros"))
  pros: string[] = [];

  @property(jsonProp<string[]>([], "cons"))
  cons: string[] = [];

  @property({ type: String, attribute: "pros-label" })
  prosLabel = "Pros";

  @property({ type: String, attribute: "cons-label" })
  consLabel = "Cons";

  override render() {
    return html`
      <div class="grid">
        <section class="col" data-kind="pros">
          <header class="head">
            <span class="icon" aria-hidden="true">+</span>
            <span>${this.prosLabel}</span>
          </header>
          ${this.pros.length
            ? html`<ul>
                ${this.pros.map((p) => html`<li>${p}</li>`)}
              </ul>`
            : html`<ul>
                <slot name="pros"></slot>
              </ul>`}
        </section>
        <section class="col" data-kind="cons">
          <header class="head">
            <span class="icon" aria-hidden="true">−</span>
            <span>${this.consLabel}</span>
          </header>
          ${this.cons.length
            ? html`<ul>
                ${this.cons.map((c) => html`<li>${c}</li>`)}
              </ul>`
            : html`<ul>
                <slot name="cons"></slot>
              </ul>`}
        </section>
      </div>
    `;
  }
}
