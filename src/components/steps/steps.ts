import { html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

/** Shape of a single step item in the JSON data array. */
export interface StepItem {
  /** Optional step number/letter. Auto-assigned when auto-number is enabled and this is absent. */
  n?: string;
  /** Short title for the step. */
  title: string;
  /** Description text rendered in the step body. */
  desc?: string;
  /** Visual state: "pending" | "active" | "done". Defaults to "pending". */
  state?: "pending" | "active" | "done";
  /** Optional metadata shown beside the title (e.g. "~2 weeks"). */
  meta?: string;
}

/**
 * `<ce-steps>` — a container for `<ce-step>` items, supporting both JSON data
 * and slot children (CDR-005).
 *
 * Resolution order (CDR-005):
 *   1. `data` JSON attribute non-empty → render from data array (JSON mode).
 *   2. Else, slot children are present → show them via <slot> (slot mode).
 *   3. Else → render empty state.
 *
 * Usage:
 *
 *   <!-- Slot mode (handwritten) -->
 *   <ce-steps>
 *     <ce-step title="Discovery">15 interviews</ce-step>
 *     <ce-step title="Prototype" state="active">Clickable Figma</ce-step>
 *   </ce-steps>
 *
 *   <!-- JSON mode (generator output) -->
 *   <ce-steps data='[
 *     {"title":"Discovery","desc":"15 interviews","state":"done"},
 *     {"title":"Prototype","desc":"Clickable Figma","state":"active"}
 *   ]'></ce-steps>
 *
 *   <!-- Horizontal layout -->
 *   <ce-steps direction="horizontal" data='[...]'></ce-steps>
 *
 * Attributes:
 *   data        — JSON array of StepItem objects (CDR-005, jsonProp).
 *   direction   — "vertical" | "horizontal" (default "vertical").
 *   auto-number — boolean (default true). When set, auto-assigns 1..N to
 *                 <ce-step> slot children that have no `n` attribute.
 *
 * Slots:
 *   (default) — `<ce-step>` children, or any children (CDR-006).
 *               Used when data is empty.
 *
 * Note: Shadow DOM is used (not light DOM) because :host([direction]) selectors
 * require it and to avoid the light-DOM feedback loop where rendered children
 * become part of this.children for slot-detection purposes.
 */
export class CeSteps extends CecElement {
  static override styles = css`
    :host {
      display: block;
    }

    /* Vertical layout (default) */
    .ce-steps {
      display: flex;
      flex-direction: column;
      gap: var(--ce-step-list-gap, var(--ce-space-4));
    }

    /* Horizontal layout */
    :host([direction="horizontal"]) .ce-steps {
      flex-direction: row;
      flex-wrap: wrap;
      gap: var(--ce-space-3);
      align-items: flex-start;
    }

    /* JSON-mode step wrapper */
    .ce-steps__item {
      display: block;
    }

    /* Empty state */
    .ce-steps__empty {
      color: var(--ce-muted);
      font-size: var(--ce-text-sm);
      padding: var(--ce-space-3) 0;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  /** JSON data array — CDR-005, takes precedence over slot children when non-empty. */
  @property(jsonProp<StepItem[]>([])) data: StepItem[] = [];

  /**
   * Layout direction.
   * CDR-001: 2-value style enum — "vertical" (default) or "horizontal".
   */
  @property({ type: String, reflect: true })
  direction: "vertical" | "horizontal" = "vertical";

  /**
   * When true (default), auto-assigns sequential numbers (1, 2, 3 …) to
   * `<ce-step>` slot children that have no `n` attribute.
   * In JSON mode, auto-assigns n to items with no `n` field.
   */
  @property({ type: Boolean, reflect: true, attribute: "auto-number" })
  autoNumber = true;

  /**
   * Number of light-DOM children (updated by MutationObserver).
   * Drives the slot-vs-empty decision in render().
   */
  @state() private _childCount = 0;

  /** MutationObserver watching direct children for additions/removals and attribute changes. */
  #childObserver: MutationObserver | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this._childCount = this.children.length;
    this.#childObserver = new MutationObserver(() => {
      this._childCount = this.children.length;
      this.#applyAutoNumber();
    });
    this.#childObserver.observe(this, {
      childList: true,
      subtree: false,
      attributes: true,
      attributeFilter: ["n", "title", "state"],
    });
    this.#applyAutoNumber();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#childObserver?.disconnect();
    this.#childObserver = null;
  }

  override updated(): void {
    // Re-apply auto-numbering after every render (handles data→slot transitions).
    this.#applyAutoNumber();
  }

  /**
   * Auto-number direct <ce-step> children that have no `n` attribute.
   * Non-ce-step children are left untouched (CDR-006).
   * Only runs in slot mode (when data is empty).
   */
  #applyAutoNumber(): void {
    if (!this.autoNumber) return;
    if (this.data && this.data.length > 0) return; // JSON mode handles its own numbering
    let counter = 1;
    for (const child of Array.from(this.children)) {
      if (child.tagName.toLowerCase() !== "ce-step") continue;
      if (!child.hasAttribute("n")) {
        child.setAttribute("n", String(counter));
      }
      counter++;
    }
  }

  get #useJson(): boolean {
    return !!(this.data && this.data.length > 0);
  }

  override render() {
    if (this.#useJson) {
      return this.#renderJson();
    }

    if (this._childCount === 0) {
      return html`<div class="ce-steps__empty" role="status">No steps</div>`;
    }

    return html`
      <div class="ce-steps">
        <slot></slot>
      </div>
    `;
  }

  #renderJson() {
    const steps = this.data;
    let autoCounter = 1;
    return html`
      <div class="ce-steps">
        ${steps.map((item) => {
          const n = item.n ?? (this.autoNumber ? String(autoCounter++) : undefined);
          return html`
            <ce-step
              class="ce-steps__item"
              n=${n ?? nothing}
              title=${item.title}
              state=${item.state ?? "pending"}
            >
              ${item.meta
                ? html`<span slot="meta">${item.meta}</span>`
                : nothing}
              ${item.desc ? item.desc : nothing}
            </ce-step>
          `;
        })}
      </div>
    `;
  }
}
