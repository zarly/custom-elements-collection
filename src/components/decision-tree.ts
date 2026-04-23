import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, jsonProp } from "../core/index.js";

export interface DecisionBranch {
  label: string;
  /** "yes" | "no" | neutral */
  kind?: "yes" | "no" | "neutral";
  /** Resulting answer / next state. */
  result: string;
}

/**
 * `<ce-decision-tree>` — Q + branches (yes/no etc.) for educational
 * "if/then" diagrams.
 *
 * Attributes:
 *   question — top-level question
 *
 * Provide branches via the `branches` array.
 */
export class CeDecisionTree extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-5);
      margin: var(--ce-space-3) 0;
    }
    .ce-tree__q {
      text-align: center;
      font-weight: 700;
      font-size: var(--ce-text-md);
      margin-bottom: var(--ce-space-4);
      color: var(--ce-text);
    }
    .ce-tree__branches {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--ce-space-3);
    }
    .ce-tree__branch {
      background: var(--ce-surface-2);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-3) var(--ce-space-4);
      text-align: center;
    }
    .ce-tree__branch.yes { border-color: var(--ce-color-green); background: var(--ce-color-green-bg); }
    .ce-tree__branch.no  { border-color: var(--ce-color-red);   background: var(--ce-color-red-bg);   }
    .ce-tree__arrow {
      font-size: var(--ce-text-lg);
      font-weight: 700;
      margin-bottom: var(--ce-space-1);
      color: var(--ce-muted);
    }
    .ce-tree__branch.yes .ce-tree__arrow { color: var(--ce-color-green); }
    .ce-tree__branch.no  .ce-tree__arrow { color: var(--ce-color-red);   }
    .ce-tree__label {
      font-size: var(--ce-text-sm);
      font-weight: 700;
      margin-bottom: 4px;
    }
    .ce-tree__result {
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) question = "";
  @property(jsonProp<DecisionBranch[]>([], "branches")) branches: DecisionBranch[] = [];

  override render() {
    return html`
      <div class="ce-tree__q">${this.question}</div>
      <div class="ce-tree__branches">
        ${this.branches.map((b) => {
          const kind = b.kind ?? "neutral";
          const arrow = kind === "yes" ? "↓ YES" : kind === "no" ? "↓ NO" : "↓";
          return html`
            <div class="ce-tree__branch ${kind}">
              <div class="ce-tree__arrow">${arrow}</div>
              <div class="ce-tree__label">${b.label}</div>
              <div class="ce-tree__result">${b.result}</div>
            </div>
          `;
        })}
      </div>
    `;
  }
}
