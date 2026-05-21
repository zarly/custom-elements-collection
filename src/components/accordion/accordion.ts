import { html, css, type PropertyValues, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

export interface AccordionItem {
  /** Stable id for open-state tracking. Defaults to the array index. */
  id?: string;
  /** Summary text. Can be overridden by slotted rich markup in slot-mode. */
  summary: string;
  /** Body text. Slot mode uses children instead. */
  body?: string;
  /** Optional right-aligned count chip on the header. */
  count?: string | number;
  /** Whether this item starts open. */
  open?: boolean;
}

/**
 * `<ce-accordion>` — grouped disclosure rows.
 *
 * Static-by-default per CDR-004; renders rich disclosure rows that the user can
 * expand and collapse. Multiple rows may be open at once by default; pass
 * `single` to enforce single-open (radio) semantics. Accepts a JSON `items`
 * array OR slotted `<ce-details>` / `<details>` children (CDR-005).
 *
 * Attributes:
 *   items     — JSON array of { id?, summary, body?, count?, open? }
 *   single    — boolean; only one row may be open at a time
 *
 * Slots:
 *   (default) — `<ce-details>` / `<details>` children for slot-mode authoring.
 *
 * Events:
 *   ce-accordion-change — { openIds: string[] } whenever an item toggles
 */
export class CeAccordion extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      overflow: hidden;
    }
    .item + .item {
      border-top: 1px solid var(--ce-border-soft);
    }
    details {
      padding: 0;
      margin: 0;
    }
    summary {
      list-style: none;
      padding: var(--ce-space-3) var(--ce-space-4);
      cursor: pointer;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: var(--ce-space-2);
      color: var(--ce-text);
      user-select: none;
    }
    summary::-webkit-details-marker { display: none; }
    summary::before {
      content: "▸";
      display: inline-block;
      color: var(--ce-muted);
      transition: transform var(--ce-transition-fast);
      font-size: var(--ce-text-sm);
      width: 10px;
    }
    details[open] > summary::before { transform: rotate(90deg); }
    summary:hover { background: var(--ce-state-hover); }
    summary:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }
    .count {
      margin-left: auto;
      font-size: var(--ce-text-xs);
      padding: var(--ce-inset-xs) var(--ce-space-2);
      border-radius: var(--ce-radius-pill);
      background: var(--ce-surface-2);
      color: var(--ce-muted);
      border: 1px solid var(--ce-border-soft);
      font-weight: 600;
    }
    .body {
      padding: 0 var(--ce-space-4) var(--ce-space-3);
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
      line-height: var(--ce-line-normal);
    }
    /* Slot-mode children get the same border separation. */
    ::slotted(:not(:last-child)) {
      border-bottom: 1px solid var(--ce-border-soft);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property(jsonProp<AccordionItem[]>([], "items"))
  items: AccordionItem[] = [];

  @property({ type: Boolean, reflect: true }) single = false;

  @state() private _openIds: Set<string> = new Set();

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("items")) {
      const next = new Set<string>();
      this.items.forEach((it, i) => {
        if (it.open) next.add(it.id ?? String(i));
      });
      // single mode: keep only the first open item to avoid contradictions
      if (this.single && next.size > 1) {
        const first = next.values().next().value as string;
        next.clear();
        next.add(first);
      }
      this._openIds = next;
    }
  }

  #emit(): void {
    this.dispatchEvent(
      new CustomEvent("ce-accordion-change", {
        bubbles: true,
        composed: true,
        detail: { openIds: Array.from(this._openIds) },
      }),
    );
  }

  #onToggle(id: string, e: Event): void {
    const d = e.target as HTMLDetailsElement;
    const isOpen = d.open;
    const next = new Set(this._openIds);
    if (isOpen) {
      if (this.single) next.clear();
      next.add(id);
    } else {
      next.delete(id);
    }
    this._openIds = next;
    this.#emit();
  }

  #renderJson() {
    return this.items.map((it, i) => {
      const id = it.id ?? String(i);
      const isOpen = this._openIds.has(id);
      return html`<div class="item">
        <details ?open=${isOpen} @toggle=${(e: Event) => this.#onToggle(id, e)}>
          <summary>
            <span>${it.summary}</span>
            ${it.count !== undefined && it.count !== ""
              ? html`<span class="count">${it.count}</span>`
              : nothing}
          </summary>
          <div class="body">${it.body ?? ""}</div>
        </details>
      </div>`;
    });
  }

  override render() {
    if (this.items.length > 0) return this.#renderJson();
    return html`<slot></slot>`;
  }
}
