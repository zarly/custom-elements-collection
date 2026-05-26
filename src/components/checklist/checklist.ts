import { html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

export interface CeChecklistItem {
  id: string;
  text: string;
  checked?: boolean;
  /** Optional grouping label — used when group-by="category". */
  category?: string;
}

/**
 * Build CeChecklistItem[] from <ce-check-item> slot children of the given parent.
 * Non-ce-check-item children are gracefully ignored per CDR-006.
 */
function itemsFromSlotChildren(parent: HTMLElement): CeChecklistItem[] {
  const result: CeChecklistItem[] = [];
  for (const child of Array.from(parent.children)) {
    if (child.tagName.toLowerCase() !== "ce-check-item") continue;
    const el = child as HTMLElement;
    const id =
      el.getAttribute("id") ??
      `ci${Math.random().toString(36).slice(2, 8)}`;
    const checked = el.hasAttribute("checked");
    const category = el.getAttribute("category") ?? "";
    // Collect text/HTML from the element's child nodes (CDR-002: rich content)
    const text = el.innerHTML.trim();
    result.push({ id, text, checked, category: category || undefined });
  }
  return result;
}

/**
 * `<ce-checklist>` — task list with static, slot, and interactive modes.
 *
 * Two ways to provide items (CDR-005 — resolution order):
 *   1. `items` JSON prop non-empty → use it (current behaviour, fully preserved).
 *   2. Else iterate `<ce-check-item>` slot children.
 *   3. Else render the empty state.
 *
 * Without `persist-key`, this is a static read-only display — no localStorage
 * writes happen and no mutation events fire. Interactivity is opt-in (CDR-004).
 *
 * Attributes:
 *   items       — JSON array of {id, text, checked?, category?}
 *   allow-edit  — boolean; show a small input to add new items
 *   persist-key — localStorage key; restored on connect, saved on each change
 *   group-by    — "" | "category"; when "category", renders <h4> headers per group
 *
 * Events:
 *   ce-check-change    — { id, checked } when an item is toggled (only if allowEdit or persistKey)
 *   ce-checklist-add   — { id, text } when a new item is added (allow-edit only)
 */
export class CeChecklist extends CecElement {
  static override styles = css`
    :host {
      display: block;
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
    }
    li.done .text {
      color: var(--ce-muted);
      text-decoration: line-through;
    }
    input[type="checkbox"] {
      margin-top: 3px;
      accent-color: var(--ce-color-blue);
    }
    .text {
      flex: 1;
      font-size: var(--ce-text-base);
      line-height: var(--ce-line-snug);
    }
    .group-header {
      font-size: var(--ce-text-sm);
      font-weight: 600;
      color: var(--ce-muted);
      margin: var(--ce-space-3) 0 var(--ce-space-1, 4px);
      padding-bottom: var(--ce-space-1, 4px);
      border-bottom: 1px solid var(--ce-border);
    }
    .group-header:first-child {
      margin-top: 0;
    }
    .add {
      display: flex;
      gap: var(--ce-space-2);
      margin-top: var(--ce-space-3);
    }
    .add input {
      flex: 1;
      padding: var(--ce-inset-lg);
      background: var(--ce-surface-2);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-sm);
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
    }
    .add button {
      padding: var(--ce-inset-lg) var(--ce-space-3);
      background: var(--ce-color-blue);
      /* stylelint-disable-next-line color-no-hex -- on-accent text on saturated blue add-button */
      color: #fff;
      border: 0;
      border-radius: var(--ce-radius-sm);
      cursor: pointer;
      font-weight: 600;
    }
    .add button:disabled { opacity: 0.5; cursor: not-allowed; }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property(jsonProp<CeChecklistItem[]>([]))
  items: CeChecklistItem[] = [];

  @property({ type: Boolean, attribute: "allow-edit" })
  allowEdit = false;

  @property({ type: String, attribute: "persist-key" })
  persistKey = "";

  @property({ type: String, attribute: "group-by" })
  groupBy: "" | "category" = "";

  @state() private _draft = "";

  /** Items resolved from <ce-check-item> slot children. Updated by MutationObserver. */
  @state() private _slotItems: CeChecklistItem[] = [];

  #childObserver: MutationObserver | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.#restore();
    this.#childObserver = new MutationObserver(() => {
      this._slotItems = itemsFromSlotChildren(this);
    });
    this.#childObserver.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["id", "checked", "category"],
    });
    // Read initial children (may already be present when upgraded)
    this._slotItems = itemsFromSlotChildren(this);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#childObserver?.disconnect();
    this.#childObserver = null;
  }

  #restore(): void {
    if (!this.persistKey) return;
    try {
      const raw = localStorage.getItem(`ce-checklist:${this.persistKey}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CeChecklistItem[];
      if (Array.isArray(parsed)) {
        this.items = parsed;
      }
    } catch {
      // ignore
    }
  }

  #persist(): void {
    if (!this.persistKey) return;
    try {
      localStorage.setItem(
        `ce-checklist:${this.persistKey}`,
        JSON.stringify(this.#resolvedItems)
      );
    } catch {
      // ignore
    }
  }

  /** CDR-005 resolution: items JSON → slot children → []. */
  get #resolvedItems(): CeChecklistItem[] {
    return this.items && this.items.length > 0 ? this.items : this._slotItems;
  }

  #toggle(item: CeChecklistItem): void {
    // In static mode (no persistKey and no allowEdit), toggling is a no-op
    // — the checkboxes are rendered disabled so this should not be reached,
    // but guard defensively.
    if (!this.persistKey && !this.allowEdit) return;

    const source = this.#resolvedItems;
    const updated = source.map((it) =>
      it.id === item.id ? { ...it, checked: !it.checked } : it
    );

    if (this.items && this.items.length > 0) {
      this.items = updated;
    } else {
      // Slot mode: update _slotItems and reflect back to child elements
      this._slotItems = updated;
      for (const child of Array.from(this.children)) {
        if (child.tagName.toLowerCase() !== "ce-check-item") continue;
        const el = child as HTMLElement;
        const id = el.getAttribute("id");
        const updatedItem = updated.find((i) => i.id === id);
        if (updatedItem) {
          if (updatedItem.checked) {
            el.setAttribute("checked", "");
          } else {
            el.removeAttribute("checked");
          }
        }
      }
    }

    this.#persist();
    this.dispatchEvent(
      new CustomEvent("ce-check-change", {
        bubbles: true,
        composed: true,
        detail: {
          id: item.id,
          checked: !!updated.find((i) => i.id === item.id)?.checked,
        },
      })
    );
  }

  #onInput(e: Event): void {
    this._draft = (e.target as HTMLInputElement).value;
  }

  #onAdd(): void {
    const text = this._draft.trim();
    if (!text) return;
    const id = `i${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const next: CeChecklistItem = { id, text, checked: false };
    this.items = [...this.#resolvedItems, next];
    this._draft = "";
    this.#persist();
    this.dispatchEvent(
      new CustomEvent("ce-checklist-add", {
        bubbles: true,
        composed: true,
        detail: { id, text },
      })
    );
  }

  #onAddKey(e: KeyboardEvent): void {
    if (e.key === "Enter") {
      e.preventDefault();
      this.#onAdd();
    }
  }

  #renderItems(items: CeChecklistItem[]) {
    const interactive = this.allowEdit || !!this.persistKey;
    return items.map(
      (it) => html`
        <li class=${it.checked ? "done" : ""}>
          <input
            type="checkbox"
            .checked=${!!it.checked}
            ?disabled=${!interactive}
            @change=${() => this.#toggle(it)}
            aria-label=${it.text.replace(/<[^>]*>/g, "")}
          />
          <span class="text">${it.text}</span>
        </li>
      `
    );
  }

  #renderGrouped(items: CeChecklistItem[]) {
    // Group items by category; items without a category go into "" group
    const groups = new Map<string, CeChecklistItem[]>();
    for (const it of items) {
      const key = it.category ?? "";
      let bucket = groups.get(key);
      if (!bucket) {
        bucket = [];
        groups.set(key, bucket);
      }
      bucket.push(it);
    }

    const parts: unknown[] = [];
    for (const [cat, groupItems] of groups) {
      if (cat) {
        parts.push(html`<h4 class="group-header">${cat}</h4>`);
      }
      parts.push(...this.#renderItems(groupItems));
    }
    return parts;
  }

  override render() {
    const items = this.#resolvedItems;

    if (this.groupBy === "category") {
      return html`
        <div>
          ${this.#renderGrouped(items)}
        </div>
        ${this.allowEdit
          ? html`
              <div class="add">
                <input
                  type="text"
                  placeholder="Add an item…"
                  .value=${this._draft}
                  @input=${this.#onInput}
                  @keydown=${this.#onAddKey}
                />
                <button
                  type="button"
                  @click=${this.#onAdd}
                  ?disabled=${!this._draft.trim()}
                >
                  Add
                </button>
              </div>
            `
          : nothing}
      `;
    }

    return html`
      <ul>
        ${this.#renderItems(items)}
      </ul>
      ${this.allowEdit
        ? html`
            <div class="add">
              <input
                type="text"
                placeholder="Add an item…"
                .value=${this._draft}
                @input=${this.#onInput}
                @keydown=${this.#onAddKey}
              />
              <button
                type="button"
                @click=${this.#onAdd}
                ?disabled=${!this._draft.trim()}
              >
                Add
              </button>
            </div>
          `
        : nothing}
    `;
  }
}
