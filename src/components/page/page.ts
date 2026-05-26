import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-page>` — outer page chrome for full-page layouts.
 *
 * Provides a CSS-grid wrapper with named areas for header, nav/sidebar,
 * main content, and footer. Three layouts:
 *
 *   stacked (default) — header / main / footer, single column.
 *   sidebar-left      — header / [nav | main] / footer.
 *   sidebar-right     — header / [main | nav] / footer.
 *
 * Below 48rem (≈768px) sidebar layouts collapse to stacked automatically.
 *
 * Usage:
 *
 *   <ce-page>
 *     <header slot="header">Brand</header>
 *     <article>Main content</article>
 *     <footer slot="footer">© 2026</footer>
 *   </ce-page>
 *
 *   <ce-page layout="sidebar-left" sticky-header>
 *     <header slot="header">Top bar</header>
 *     <nav slot="nav">Sidebar</nav>
 *     <main>Article body</main>
 *     <footer slot="footer">Footer</footer>
 *   </ce-page>
 *
 *   <ce-page layout="sidebar-right" rail-width="20rem">
 *     <header slot="header">Header</header>
 *     <main>Body</main>
 *     <aside slot="nav">Right-rail content</aside>
 *   </ce-page>
 *
 * Attributes (all reflected):
 *   layout        — "stacked" | "sidebar-left" | "sidebar-right" (default "stacked")
 *   sticky-header — boolean; makes the header sticky (position:sticky, top:0)
 *   sticky-footer — boolean; makes the footer sticky (position:sticky, bottom:0)
 *   rail-width    — CSS length; width of the nav/sidebar area (default "16rem")
 *
 * Slots:
 *   header    — top chrome (spans full width in all layouts)
 *   nav       — sidebar / rail (position depends on layout value)
 *   (default) — main content area
 *   footer    — bottom chrome (spans full width in all layouts)
 *
 * Responsive: sidebar layouts collapse to stacked below
 * var(--ce-page-collapse, 48rem). Override the token to change the breakpoint.
 */
export class CePage extends CecElement {
  static override styles = css`
    :host {
      display: grid;
      min-height: 100vh;
      box-sizing: border-box;
      /* Rail width custom property — set inline when rail-width attr is used */
      --_rail-w: var(--ce-page-rail-width, 16rem);
    }

    /* ── Stacked (default) ── */
    :host,
    :host([layout="stacked"]) {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr auto;
      grid-template-areas:
        "header"
        "main"
        "footer";
    }

    /* ── Sidebar-left ── */
    :host([layout="sidebar-left"]) {
      grid-template-columns: var(--_rail-w) 1fr;
      grid-template-rows: auto 1fr auto;
      grid-template-areas:
        "header header"
        "nav    main"
        "footer footer";
    }

    /* ── Sidebar-right ── */
    :host([layout="sidebar-right"]) {
      grid-template-columns: 1fr var(--_rail-w);
      grid-template-rows: auto 1fr auto;
      grid-template-areas:
        "header header"
        "main   nav"
        "footer footer";
    }

    /* ── Grid area wrappers ── */
    .ce-page__header {
      grid-area: header;
      z-index: var(--ce-page-header-z, 10);
    }

    .ce-page__nav {
      grid-area: nav;
      min-width: 0;
      overflow-y: auto;
    }

    .ce-page__main {
      grid-area: main;
      min-width: 0;
    }

    .ce-page__footer {
      grid-area: footer;
      z-index: var(--ce-page-footer-z, 10);
    }

    /* ── Sticky header ── */
    :host([sticky-header]) .ce-page__header {
      position: sticky;
      top: 0;
    }

    /* ── Sticky footer ── */
    :host([sticky-footer]) .ce-page__footer {
      position: sticky;
      bottom: 0;
    }

    /* ── Responsive collapse ─────────────────────────────────────────────
     * Below var(--ce-page-collapse, 48rem) sidebar layouts revert to a
     * single stacked column. Theme authors can override --ce-page-collapse
     * to shift the breakpoint. Note: CSS custom properties cannot be used
     * in @media queries — the fallback 48rem (≈768px) is hardcoded here;
     * --ce-page-collapse is documented in cssVariables for awareness.
     * ──────────────────────────────────────────────────────────────────── */
    @media (max-width: 48rem) {
      :host([layout="sidebar-left"]),
      :host([layout="sidebar-right"]) {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto 1fr auto;
        grid-template-areas:
          "header"
          "nav"
          "main"
          "footer";
      }
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  layout: "stacked" | "sidebar-left" | "sidebar-right" = "stacked";

  @property({ type: Boolean, attribute: "sticky-header", reflect: true })
  stickyHeader = false;

  @property({ type: Boolean, attribute: "sticky-footer", reflect: true })
  stickyFooter = false;

  @property({ type: String, attribute: "rail-width", reflect: true })
  railWidth: string | null = null;

  override attributeChangedCallback(
    name: string,
    old: string | null,
    value: string | null
  ): void {
    super.attributeChangedCallback(name, old, value);
    if (name === "rail-width") {
      if (value) {
        this.style.setProperty("--ce-page-rail-width", value);
      } else {
        this.style.removeProperty("--ce-page-rail-width");
      }
    }
  }

  override render() {
    return html`
      <div class="ce-page__header">
        <slot name="header"></slot>
      </div>
      <div class="ce-page__nav">
        <slot name="nav"></slot>
      </div>
      <div class="ce-page__main">
        <slot></slot>
      </div>
      <div class="ce-page__footer">
        <slot name="footer"></slot>
      </div>
    `;
  }
}
