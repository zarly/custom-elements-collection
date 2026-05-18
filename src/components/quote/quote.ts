import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type QuoteVariant = "card" | "pull" | "inline";

/**
 * `<ce-quote>` — semantic blockquote with author and source attribution.
 *
 * Wraps a native `<blockquote>` and `<cite>` for correct ARIA semantics.
 * Supports three visual treatments (variant) and dual-form attribution
 * via plain attributes OR rich named slots.
 *
 * Usage:
 *
 *   <!-- Simplest — text + author attribute -->
 *   <ce-quote author="Anna, PM FinTech">
 *     We tried Notion AI, ChatGPT, a handful more — none understands our context.
 *   </ce-quote>
 *
 *   <!-- Rich author via slot -->
 *   <ce-quote source="Interview #14">
 *     This saved us a month of work.
 *     <span slot="author"><a href="mailto:anna@example.com">Anna Krotova</a>, PM FinTech</span>
 *   </ce-quote>
 *
 *   <!-- Pull-quote variant -->
 *   <ce-quote variant="pull" author="Sam Altman">
 *     Compute is the new oil.
 *   </ce-quote>
 *
 * Attributes:
 *   author   — short author name; fallback when slot="author" is empty
 *   source   — short source citation; fallback when slot="source" is empty
 *   variant  — "card" (default) | "pull" | "inline"
 *   lang     — forwarded to the host lang= attribute
 *
 * Slots:
 *   (default) — the quote text; may contain <em>, <a>, <strong>
 *   author    — rich author markup; overrides the author attribute
 *   source    — rich source citation; overrides the source attribute
 */
export class CeQuote extends CecElement {
  static override styles = css`
    /* ── Host baseline ─────────────────────────────────────────── */
    :host {
      display: block;
    }

    /* ── card (default) — applied when no variant or variant=card ── */
    :host(:not([variant])),
    :host([variant="card"]) {
      background: var(--ce-surface);
      border-left: 3px solid var(--ce-color-purple);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-4) var(--ce-space-5);
    }

    /* ── pull ────────────────────────────────────────────────────── */
    :host([variant="pull"]) {
      background: transparent;
      border-left: none;
      border-radius: 0;
      padding: var(--ce-space-5) var(--ce-space-6);
      text-align: center;
    }

    /* ── inline ──────────────────────────────────────────────────── */
    :host([variant="inline"]) {
      background: transparent;
      border-radius: 0;
      padding: 0 0 0 var(--ce-space-5);
      border-left: 2px solid var(--ce-border-strong);
    }

    /* ── blockquote reset ────────────────────────────────────────── */
    blockquote {
      margin: 0;
      padding: 0;
      font-style: normal;
      color: var(--ce-text);
      font-size: var(--ce-text-base);
      line-height: var(--ce-line-relaxed);
    }

    /* pull: oversized italic */
    :host([variant="pull"]) blockquote {
      font-size: var(--ce-text-xl);
      font-style: italic;
      line-height: var(--ce-line-snug);
    }

    /* inline: italic */
    :host([variant="inline"]) blockquote {
      font-style: italic;
    }

    /* ── attribution (cite) ──────────────────────────────────────── */
    .ce-quote__attribution {
      margin-top: var(--ce-space-3);
      font-size: var(--ce-text-sm);
      color: var(--ce-muted);
      font-style: normal;
    }

    :host([variant="pull"]) .ce-quote__attribution {
      text-align: center;
    }

    .ce-quote__attribution:not(:has(*)):not([data-has-text]) {
      display: none;
    }

    /* author */
    .ce-quote__author {
      display: inline;
    }

    /* separator dot between author and source */
    .ce-quote__sep {
      margin: 0 var(--ce-space-1);
      opacity: 0.5;
    }

    /* source */
    .ce-quote__source {
      display: inline;
      opacity: 0.8;
    }

    /* hide wrappers that have no content */
    .ce-quote__author:not(:has(::slotted(*))) {
      display: none;
    }
    .ce-quote__source:not(:has(::slotted(*))) {
      display: none;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  /** Short author name. Fallback when slot="author" is empty. */
  @property({ type: String, reflect: false })
  author: string | null = null;

  /** Short source citation. Fallback when slot="source" is empty. */
  @property({ type: String, reflect: false })
  source: string | null = null;

  /** Visual treatment. */
  @property({ type: String, reflect: true })
  variant: QuoteVariant = "card";

  /** Optional lang tag forwarded to the host element. */
  @property({ type: String, reflect: true })
  override lang = "";

  #hasSlottedAuthor(): boolean {
    return this.querySelector('[slot="author"]') !== null;
  }

  #hasSlottedSource(): boolean {
    return this.querySelector('[slot="source"]') !== null;
  }

  override render() {
    const hasAuthor = this.#hasSlottedAuthor() || !!this.author;
    const hasSource = this.#hasSlottedSource() || !!this.source;
    const hasAttribution = hasAuthor || hasSource;

    return html`
      <blockquote>
        <slot></slot>

        ${hasAttribution
          ? html`
              <footer class="ce-quote__attribution" data-has-text>
                <cite>
                  <span class="ce-quote__author">
                    <slot name="author">${this.author ?? nothing}</slot>
                  </span>
                  ${hasAuthor && hasSource
                    ? html`<span class="ce-quote__sep" aria-hidden="true">·</span>`
                    : nothing}
                  <span class="ce-quote__source">
                    <slot name="source">${this.source ?? nothing}</slot>
                  </span>
                </cite>
              </footer>
            `
          : nothing}
      </blockquote>
    `;
  }
}
