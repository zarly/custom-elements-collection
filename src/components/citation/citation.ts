import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-citation>` — inline source reference with hover/focus popover.
 *
 * Renders as `[index]` superscript by default; clicking navigates to `href`
 * if set. The optional `popover` slot reveals an expanded preview on
 * hover or keyboard focus.
 *
 * Attributes:
 *   href   — URL the reference points at (renders as <a> when present)
 *   index  — visible superscript label, e.g. "1"
 *   title  — overrides the default `[index]` rendering
 *
 * Slots:
 *   (default) — visible label override; falls back to `[index]`.
 *   popover   — expanded preview (title, snippet, source URL).
 */
export class CeCitation extends CecElement {
  static override styles = css`
    :host {
      display: inline;
      position: relative;
    }
    .ce-citation__ref {
      color: var(--ce-color-blue);
      font-size: 0.75em;
      text-decoration: none;
      cursor: pointer;
      vertical-align: super;
      line-height: 1;
      padding: 0 1px;
      border-radius: var(--ce-radius-sm);
      transition: background var(--ce-transition-fast);
    }
    .ce-citation__ref:hover,
    .ce-citation__ref:focus-visible {
      background: var(--ce-color-blue-bg);
      outline: none;
    }
    .ce-citation__ref:focus-visible {
      box-shadow: var(--ce-focus-ring);
    }
    .ce-citation__pop {
      position: absolute;
      bottom: calc(100% + 4px);
      left: 0;
      min-width: 220px;
      max-width: 360px;
      padding: var(--ce-space-2) var(--ce-space-3);
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      box-shadow: var(--ce-shadow);
      color: var(--ce-text);
      font-size: var(--ce-text-sm);
      line-height: var(--ce-line-snug);
      opacity: 0;
      visibility: hidden;
      transform: translateY(2px);
      transition: opacity var(--ce-transition-fast), transform var(--ce-transition-fast),
        visibility var(--ce-transition-fast);
      z-index: 10;
      pointer-events: none;
    }
    :host(:hover) .ce-citation__pop,
    :host(:focus-within) .ce-citation__pop {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
      pointer-events: auto;
    }
    /* Hide the popover wrapper if the slot is empty */
    .ce-citation__pop:not(:has(::slotted(*))) {
      display: none;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) href = "";
  @property({ type: String }) index = "";
  @property({ type: String, attribute: "title" }) override title = "";

  override render() {
    const popoverId = `ce-citation-pop-${(this as unknown as { _ceCitationId?: string })._ceCitationId ?? this.#id()}`;
    const visible = html`<slot>${this.title ? this.title : html`[${this.index}]`}</slot>`;
    const ref = this.href
      ? html`<a
          class="ce-citation__ref"
          href=${this.href}
          role="doc-noteref"
          aria-describedby=${popoverId}
          >${visible}</a
        >`
      : html`<span
          class="ce-citation__ref"
          role="doc-noteref"
          tabindex="0"
          aria-describedby=${popoverId}
          >${visible}</span
        >`;

    return html`
      ${ref}
      <span class="ce-citation__pop" role="tooltip" id=${popoverId}>
        <slot name="popover"></slot>
      </span>
      ${nothing}
    `;
  }

  #id(): string {
    const id = Math.random().toString(36).slice(2, 8);
    (this as unknown as { _ceCitationId?: string })._ceCitationId = id;
    return id;
  }
}
