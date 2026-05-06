import { html, css, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

import type { ItemState } from "../feedback-sink/feedback-sink.js";

export type CeFeedbackBarLayout = "inline" | "stacked" | "compact";

const FEEDBACK_CHILD_TAGS = new Set([
  "ce-rating",
  "ce-bookmark",
  "ce-dismiss",
  "ce-comment",
]);

/**
 * `<ce-feedback-bar>` — per-item row container that:
 *
 *  - Sets data-ce-subject + data-ce-item on every feedback descendant
 *    (ce-rating, ce-bookmark, ce-dismiss, ce-comment) on connect and on
 *    each slotchange — provided those attributes aren't already set.
 *  - Listens to bubbling events from those descendants and updates an
 *    internal ItemState. Re-emits a single aggregated ce-feedback-item-state
 *    event after every change. Does NOT stop propagation — the original
 *    events continue bubbling to the sink.
 *
 * Light-DOM render so descendants stay in the regular tree.
 */
export class CeFeedbackBar extends CecElement {
  static override styles = css`
    :host {
      display: flex;
      gap: var(--ce-space-2, 6px);
      align-items: center;
      flex-wrap: wrap;
      color: var(--ce-text);
    }
    :host([layout="stacked"]) {
      flex-direction: column;
      align-items: flex-start;
    }
    :host([layout="compact"]) {
      gap: var(--ce-space-1, 4px);
    }
    :host([data-ce-dismissed]) {
      opacity: 0.45;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String })
  item = "";

  @property({ type: String })
  subject = "";

  @property({ type: String })
  label = "";

  @property({ type: String, reflect: true })
  layout: CeFeedbackBarLayout = "inline";

  @state() private _state: ItemState = {
    item: "",
    updatedAt: 0,
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    this.#syncAria();
    if (!this.item && typeof console !== "undefined") {
      console.warn(
        "[ce-feedback-bar] missing required `item` attribute — events will not have an item id."
      );
    }
    // Initial inheritance pass on next tick (children may upgrade after us).
    queueMicrotask(() => this.#propagateAttrs());
    this.addEventListener("ce-rating-change", this.#onRating as EventListener);
    this.addEventListener("ce-bookmark-change", this.#onBookmark as EventListener);
    this.addEventListener("ce-dismiss-change", this.#onDismiss as EventListener);
    this.addEventListener("ce-comment-change", this.#onComment as EventListener);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("ce-rating-change", this.#onRating as EventListener);
    this.removeEventListener("ce-bookmark-change", this.#onBookmark as EventListener);
    this.removeEventListener("ce-dismiss-change", this.#onDismiss as EventListener);
    this.removeEventListener("ce-comment-change", this.#onComment as EventListener);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("label")) this.#syncAria();
    if (changed.has("item") || changed.has("subject")) {
      this._state = { ...this._state, item: this.item, label: this.label || undefined };
      this.#propagateAttrs();
    }
  }

  override render() {
    return html`<slot @slotchange=${this.#onSlotChange}></slot>`;
  }

  // — child inheritance ——————————————

  #propagateAttrs(): void {
    if (!this.item && !this.subject) return;
    const subject =
      this.subject || this.#findSinkSubject() || this.getAttribute("data-ce-subject") || "";
    const descendants = this.querySelectorAll<HTMLElement>(
      "ce-rating, ce-bookmark, ce-dismiss, ce-comment"
    );
    for (const child of descendants) {
      if (!child.hasAttribute("data-ce-subject") && subject) {
        child.setAttribute("data-ce-subject", subject);
      }
      if (!child.hasAttribute("data-ce-item") && this.item) {
        child.setAttribute("data-ce-item", this.item);
      }
    }
  }

  #findSinkSubject(): string | null {
    let node: Element | null = this.parentElement;
    while (node && node.tagName !== "BODY") {
      if (node.tagName.toLowerCase() === "ce-feedback-sink") {
        return node.getAttribute("subject");
      }
      node = node.parentElement;
    }
    return null;
  }

  #syncAria(): void {
    if (this.label) this.setAttribute("aria-label", this.label);
  }

  #onSlotChange = (): void => {
    this.#propagateAttrs();
  };

  // — event aggregation ——————————————

  #onRating = (e: CustomEvent<{ mode: string; value: unknown; max?: number }>): void => {
    if (!this.#fromOurItem(e)) return;
    const d = e.detail ?? {};
    if (d.mode === "thumbs") {
      this._state = {
        ...this._state,
        thumbs: (d.value as "up" | "down" | null) ?? null,
        updatedAt: Date.now(),
      };
    } else if (d.mode === "stars") {
      this._state = {
        ...this._state,
        stars: typeof d.value === "number" ? d.value : 0,
        updatedAt: Date.now(),
      };
    }
    this.#emitAggregated();
  };

  #onBookmark = (e: CustomEvent<{ active: boolean }>): void => {
    if (!this.#fromOurItem(e)) return;
    this._state = {
      ...this._state,
      bookmarked: !!e.detail?.active,
      updatedAt: Date.now(),
    };
    this.#emitAggregated();
  };

  #onDismiss = (e: CustomEvent<{ active: boolean }>): void => {
    if (!this.#fromOurItem(e)) return;
    this._state = {
      ...this._state,
      dismissed: !!e.detail?.active,
      updatedAt: Date.now(),
    };
    this.#emitAggregated();
  };

  #onComment = (e: CustomEvent<{ value: string }>): void => {
    if (!this.#fromOurItem(e)) return;
    this._state = {
      ...this._state,
      comment: e.detail?.value ?? "",
      updatedAt: Date.now(),
    };
    this.#emitAggregated();
  };

  /** A descendant's event is "ours" if the source element is in our subtree
   *  AND its data-ce-item matches our item (or is unset). */
  #fromOurItem(e: Event): boolean {
    const path = e.composedPath();
    for (const target of path) {
      if (!(target instanceof HTMLElement)) continue;
      if (target === this) return true;
      const tag = target.tagName.toLowerCase();
      if (FEEDBACK_CHILD_TAGS.has(tag)) {
        const dataItem = target.getAttribute("data-ce-item");
        if (!dataItem || dataItem === this.item) return true;
        return false;
      }
    }
    return true;
  }

  #emitAggregated(): void {
    this._state = { ...this._state, item: this.item, label: this.label || undefined };
    this.dispatchEvent(
      new CustomEvent("ce-feedback-item-state", {
        bubbles: true,
        composed: true,
        detail: {
          subject: this.subject || this.#findSinkSubject() || "",
          item: this.item,
          label: this.label || undefined,
          state: { ...this._state },
        },
      })
    );
  }

  /** Public accessor for current per-item state. */
  get state(): ItemState {
    return { ...this._state };
  }
}
