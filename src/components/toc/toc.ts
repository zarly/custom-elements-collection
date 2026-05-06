import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

export interface TocEntry {
  /** Anchor id (without the #). */
  href: string;
  /** Display label. */
  label: string;
}

/**
 * `<ce-toc>` — table of contents, sticky variant optional.
 *
 * Attributes:
 *   sticky  — boolean; position: sticky at top of viewport
 *   numbered — boolean; auto-number entries
 *
 * Consumers supply `entries` array, OR slot anchor children (fallback).
 */
export class CeToc extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-3) var(--ce-space-4);
      margin-bottom: var(--ce-space-5);
    }
    :host([sticky]) {
      position: sticky;
      top: 0;
      z-index: 5;
    }
    ol, ul {
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: var(--ce-space-4);
      margin: 0;
      padding: 0;
      counter-reset: s;
    }
    li {
      font-size: var(--ce-text-sm);
      counter-increment: s;
    }
    :host([numbered]) li::before {
      content: counter(s) ". ";
      color: var(--ce-muted);
      font-variant-numeric: tabular-nums;
    }
    a {
      color: var(--ce-text);
      text-decoration: none;
    }
    a:hover { color: var(--ce-color-blue); text-decoration: underline; }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property(jsonProp<TocEntry[]>([], "entries")) entries: TocEntry[] = [];
  @property({ type: Boolean, reflect: true }) sticky = false;
  @property({ type: Boolean, reflect: true }) numbered = false;

  override render() {
    const Tag = this.numbered ? "ol" : "ul";
    return html`
      <nav aria-label="Table of contents">
        ${Tag === "ol"
          ? html`<ol>${this.#renderEntries()}</ol>`
          : html`<ul>${this.#renderEntries()}</ul>`}
      </nav>
    `;
  }

  #renderEntries() {
    if (this.entries.length === 0) {
      return html`<slot></slot>`;
    }
    return this.entries.map(
      (e) => html`<li><a href="#${e.href}">${e.label}</a></li>`
    );
  }
}
