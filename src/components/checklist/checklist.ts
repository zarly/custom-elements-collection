import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

export interface CeChecklistItem {
  id: string;
  text: string;
  checked?: boolean;
}

/**
 * `<ce-checklist>` — interactive task list.
 *
 * Attributes:
 *   items       — JSON array of {id, text, checked?}
 *   allow-edit  — boolean; show a small input to add new items
 *   persist-key — localStorage key; restored on connect, saved on each change
 *
 * Events:
 *   ce-check-change — { id, checked } when an item is toggled
 *   ce-checklist-add — { id, text } when a new item is added (allow-edit)
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

  @state() private _draft = "";

  override connectedCallback(): void {
    super.connectedCallback();
    this.#restore();
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
        JSON.stringify(this.items)
      );
    } catch {
      // ignore
    }
  }

  #toggle(item: CeChecklistItem): void {
    this.items = this.items.map((it) =>
      it.id === item.id ? { ...it, checked: !it.checked } : it
    );
    this.#persist();
    this.dispatchEvent(
      new CustomEvent("ce-check-change", {
        bubbles: true,
        composed: true,
        detail: {
          id: item.id,
          checked: !!this.items.find((i) => i.id === item.id)?.checked,
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
    this.items = [...this.items, next];
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

  override render() {
    return html`
      <ul>
        ${this.items.map(
          (it) => html`
            <li class=${it.checked ? "done" : ""}>
              <input
                type="checkbox"
                .checked=${!!it.checked}
                @change=${() => this.#toggle(it)}
                aria-label=${it.text}
              />
              <span class="text">${it.text}</span>
            </li>
          `
        )}
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
        : ""}
    `;
  }
}
