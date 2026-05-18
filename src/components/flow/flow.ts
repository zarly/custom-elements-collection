import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, jsonProp, type CecColor } from "../../core/index.js";

export interface FlowStep {
  title: string;
  /** Small caption under title. */
  caption?: string;
  /** Color token (default neutral). */
  color?: CecColor;
  /** Step number label. */
  n?: string;
  /** Icon glyph or emoji. */
  icon?: string;
}

/**
 * `<ce-flow>` — horizontal or vertical flow diagram: boxes separated by arrows.
 *
 * Attributes:
 *   steps    — JSON array of FlowStep objects (JSON mode).
 *   arrow    — arrow character (default "→").
 *   vertical — boolean; stack boxes vertically with down arrows.
 *
 * Slot mode (CDR-005): when `steps` is empty, iterate `<ce-flow-step>` children
 * instead. Both modes produce visually identical output for equivalent data.
 * Resolution order: steps non-empty → JSON path; else → slot children; else →
 * empty state.
 */
export class CeFlow extends CecElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: stretch;
      gap: var(--ce-space-2);
      flex-wrap: wrap;
      margin: var(--ce-space-3) 0;
    }
    :host([vertical]) {
      flex-direction: column;
      align-items: stretch;
    }
    .ce-flow-step {
      flex: 1 1 auto;
      min-width: 140px;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-3) var(--ce-space-4);
      text-align: center;
    }
    .ce-flow-step.c-green  { border-color: var(--ce-color-green);  background: var(--ce-color-green-bg);  }
    .ce-flow-step.c-red    { border-color: var(--ce-color-red);    background: var(--ce-color-red-bg);    }
    .ce-flow-step.c-amber  { border-color: var(--ce-color-amber);  background: var(--ce-color-amber-bg);  }
    .ce-flow-step.c-blue   { border-color: var(--ce-color-blue);   background: var(--ce-color-blue-bg);   }
    .ce-flow-step.c-purple { border-color: var(--ce-color-purple); background: var(--ce-color-purple-bg); }
    .ce-flow-step.c-cyan   { border-color: var(--ce-color-cyan);   background: var(--ce-color-cyan-bg);   }

    .ce-flow-step .ce-flow-n {
      font-size: var(--ce-text-xs);
      font-weight: 700;
      color: var(--ce-muted);
      margin-bottom: 2px;
    }
    .ce-flow-step .ce-flow-icon {
      font-size: var(--ce-text-lg);
      line-height: 1;
      margin-bottom: 2px;
    }
    .ce-flow-step .ce-flow-title {
      font-weight: 700;
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
    }
    .ce-flow-step .ce-flow-caption {
      font-size: var(--ce-text-xs);
      color: var(--ce-muted);
      margin-top: 2px;
    }
    .ce-flow-arrow {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ce-muted);
      font-size: var(--ce-text-lg);
      padding: 0 var(--ce-space-1);
      flex: 0 0 auto;
    }
    :host([vertical]) .ce-flow-arrow { padding: var(--ce-space-1) 0; }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property(jsonProp<FlowStep[]>([])) steps: FlowStep[] = [];
  @property({ type: String }) arrow = "→";
  @property({ type: Boolean, reflect: true }) vertical = false;

  /** Steps derived from <ce-flow-step> slot children. Updated by MutationObserver. */
  @state() private _slotSteps: FlowStep[] = [];

  #childObserver: MutationObserver | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.#childObserver = new MutationObserver(() => {
      this._slotSteps = this.#readSlotChildren();
    });
    this.#childObserver.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["title", "n", "icon", "color"],
    });
    this._slotSteps = this.#readSlotChildren();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#childObserver?.disconnect();
    this.#childObserver = null;
  }

  /** Read FlowStep data from <ce-flow-step> direct children (CDR-005 slot mode). */
  #readSlotChildren(): FlowStep[] {
    const result: FlowStep[] = [];
    for (const child of Array.from(this.children)) {
      if (child.tagName.toLowerCase() !== "ce-flow-step") continue;
      const el = child as HTMLElement;
      result.push({
        title: el.getAttribute("title") ?? "",
        n: el.getAttribute("n") ?? undefined,
        icon: el.getAttribute("icon") ?? undefined,
        color: (el.getAttribute("color") as CecColor) ?? undefined,
        // caption: body HTML from default slot — read as textContent for JSON-parity
        caption: el.textContent?.trim() || undefined,
      });
    }
    return result;
  }

  /** Resolved steps: steps[] takes priority, else slot children, else []. */
  get #effectiveSteps(): FlowStep[] {
    return this.steps && this.steps.length > 0
      ? this.steps
      : this._slotSteps;
  }

  override render() {
    const arrow = this.vertical ? this.#verticalArrow() : this.arrow;
    const steps = this.#effectiveSteps;
    const items: unknown[] = [];
    steps.forEach((s, i) => {
      if (i > 0) {
        items.push(
          html`<div class="ce-flow-arrow" aria-hidden="true">${arrow}</div>`
        );
      }
      items.push(
        html`
          <div class="ce-flow-step ${s.color ? `c-${s.color}` : ""}">
            ${s.n ? html`<div class="ce-flow-n">${s.n}</div>` : ""}
            ${s.icon ? html`<div class="ce-flow-icon" aria-hidden="true">${s.icon}</div>` : ""}
            <div class="ce-flow-title">${s.title}</div>
            ${s.caption ? html`<div class="ce-flow-caption">${s.caption}</div>` : ""}
          </div>
        `
      );
    });
    return html`${items}`;
  }

  #verticalArrow(): string {
    if (this.arrow === "→") return "↓";
    return this.arrow;
  }
}
