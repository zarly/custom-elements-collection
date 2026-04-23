import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../core/index.js";

/**
 * `<ce-docs-layout>` — two-pane documentation layout (sidebar + main).
 *
 * Internal composition primitive used by docs pages and catalogs. The sidebar
 * is a fixed-width sticky column on the left; the default slot is the main
 * scrollable content area. An optional `header` slot sits at the top full-width.
 *
 * Slots:
 *   header     — optional top bar (spans both columns)
 *   sidebar    — left column content (e.g. <ce-nav-list>)
 *   (default)  — main content
 *
 * Attributes:
 *   sidebar-width — CSS length (default "260px")
 */
export class CeDocsLayout extends CecElement {
  static override styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--ce-bg);
      color: var(--ce-text);
      --_ce-sidebar-width: 260px;
    }
    :host([sidebar-width]) {
      --_ce-sidebar-width: attr(sidebar-width);
    }
    .ce-docs {
      display: grid;
      grid-template-columns: var(--_sidebar-w, var(--_ce-sidebar-width)) 1fr;
      min-height: 100vh;
    }
    .ce-docs__header {
      grid-column: 1 / -1;
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--ce-surface);
      border-bottom: 1px solid var(--ce-border);
    }
    .ce-docs__sidebar {
      position: sticky;
      top: 0;
      align-self: start;
      height: 100vh;
      overflow-y: auto;
      background: var(--ce-surface);
      border-right: 1px solid var(--ce-border);
    }
    :host([has-header]) .ce-docs__sidebar {
      height: calc(100vh - var(--_ce-header-h, 48px));
      top: var(--_ce-header-h, 48px);
    }
    .ce-docs__main {
      min-width: 0;
      padding: var(--ce-space-5) var(--ce-space-6);
      overflow-x: auto;
    }
    @media (max-width: 760px) {
      .ce-docs {
        grid-template-columns: 1fr;
      }
      .ce-docs__sidebar {
        position: static;
        height: auto;
        border-right: 0;
        border-bottom: 1px solid var(--ce-border);
      }
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, attribute: "sidebar-width", reflect: true })
  sidebarWidth = "260px";

  override render() {
    return html`
      <div class="ce-docs" style="--_sidebar-w: ${this.sidebarWidth}">
        <header class="ce-docs__header"><slot name="header"></slot></header>
        <aside class="ce-docs__sidebar"><slot name="sidebar"></slot></aside>
        <main class="ce-docs__main"><slot></slot></main>
      </div>
    `;
  }
}
