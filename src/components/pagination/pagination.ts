import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-pagination>` — page navigation strip with first/prev/numbered/next/last
 * controls. Static-by-default: renders the current state from `page` + `total`,
 * emits `ce-pagechange` on user activation, but only updates `page` when
 * `manage="self"` is set (CDR-004 static-first opt-in pattern for stateful UIs).
 *
 * Attributes:
 *   page    — current page (1-indexed). Default 1.
 *   total   — total page count. Required for meaningful rendering.
 *   sibling — numeric siblings shown around the current page (default 1)
 *   manage  — "external" (default) or "self"; when "self" the component updates page on its own
 *   compact — boolean; hides number buttons, shows only first/prev/info/next/last
 *
 * Events:
 *   ce-pagechange — { page: number } when the user picks a new page
 *
 * Composition:
 *   The numbered range is computed with sibling+boundary heuristics and ellipses
 *   appear when there are gaps. All buttons are real <button>s for keyboard a11y.
 */
export class CePagination extends CecElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-1);
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
    }
    button {
      font: inherit;
      color: inherit;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-sm);
      padding: var(--ce-inset-md) var(--ce-space-3);
      cursor: pointer;
      min-width: 2.25em;
      font-variant-numeric: tabular-nums;
      transition: background var(--ce-transition), border-color var(--ce-transition),
        color var(--ce-transition);
    }
    button:hover:not(:disabled):not([aria-current="page"]) {
      background: var(--ce-state-hover);
      border-color: var(--ce-border-strong);
    }
    button:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }
    button[aria-current="page"] {
      background: var(--ce-color-blue);
      border-color: var(--ce-color-blue);
      color: var(--ce-text-inverse);
      font-weight: 600;
    }
    button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .gap {
      padding: 0 var(--ce-space-2);
      color: var(--ce-muted);
      user-select: none;
    }
    .info {
      padding: 0 var(--ce-space-2);
      color: var(--ce-muted);
      font-variant-numeric: tabular-nums;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: Number }) page = 1;
  @property({ type: Number }) total = 1;
  @property({ type: Number }) sibling = 1;
  @property({ type: String }) manage: "external" | "self" = "external";
  @property({ type: Boolean, reflect: true }) compact = false;

  /** Compute the visible page range with ellipses. */
  #visiblePages(): Array<number | "…"> {
    const total = Math.max(1, Math.floor(this.total));
    const page = Math.min(Math.max(1, Math.floor(this.page)), total);
    const sib = Math.max(0, Math.floor(this.sibling));
    const window: Array<number | "…"> = [];

    const start = Math.max(2, page - sib);
    const end = Math.min(total - 1, page + sib);

    window.push(1);
    if (start > 2) window.push("…");
    for (let i = start; i <= end; i++) window.push(i);
    if (end < total - 1) window.push("…");
    if (total > 1) window.push(total);
    return window;
  }

  #select(next: number): void {
    const total = Math.max(1, Math.floor(this.total));
    const clamped = Math.min(Math.max(1, Math.floor(next)), total);
    if (clamped === this.page) return;
    if (this.manage === "self") {
      this.page = clamped;
    }
    this.dispatchEvent(
      new CustomEvent("ce-pagechange", {
        bubbles: true,
        composed: true,
        detail: { page: clamped },
      }),
    );
  }

  override render() {
    const total = Math.max(1, Math.floor(this.total));
    const page = Math.min(Math.max(1, Math.floor(this.page)), total);
    const canBack = page > 1;
    const canFwd = page < total;

    const numberButtons = this.compact
      ? html`<span class="info" aria-live="polite">${page} / ${total}</span>`
      : this.#visiblePages().map((p) =>
          p === "…"
            ? html`<span class="gap" aria-hidden="true">…</span>`
            : html`<button
                type="button"
                @click=${() => this.#select(p as number)}
                aria-current=${p === page ? "page" : "false"}
                aria-label=${`Page ${p}`}
              >
                ${p}
              </button>`,
        );

    return html`
      <nav aria-label="Pagination" style="display:contents">
        <button
          type="button"
          ?disabled=${!canBack}
          @click=${() => this.#select(1)}
          aria-label="First page"
        >
          «
        </button>
        <button
          type="button"
          ?disabled=${!canBack}
          @click=${() => this.#select(page - 1)}
          aria-label="Previous page"
        >
          ‹
        </button>
        ${numberButtons}
        <button
          type="button"
          ?disabled=${!canFwd}
          @click=${() => this.#select(page + 1)}
          aria-label="Next page"
        >
          ›
        </button>
        <button
          type="button"
          ?disabled=${!canFwd}
          @click=${() => this.#select(total)}
          aria-label="Last page"
        >
          »
        </button>
        ${nothing}
      </nav>
    `;
  }
}
