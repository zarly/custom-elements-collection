import { html, css, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-affix>` — wraps content in a `position: sticky` region.
 *
 * Usage:
 *
 *   <ce-affix edge="top" offset="64">
 *     <ce-filter-bar></ce-filter-bar>
 *   </ce-affix>
 *
 *   <ce-affix edge="bottom" offset="0">
 *     <ce-card>Always-visible bottom dock</ce-card>
 *   </ce-affix>
 *
 *   <ce-affix edge="top" offset="0" z="20">
 *     <header>Sticky page header</header>
 *   </ce-affix>
 *
 * Attributes (all reflected):
 *   edge   — which viewport edge to stick to: top|bottom|start|end (default "top")
 *   offset — CSS length or bare number (appends px); distance from the edge (default "0")
 *   z      — z-index integer as string (default "10")
 *
 * Slots:
 *   (default) — content to affix
 *
 * Limitations:
 *   - `position: sticky` requires the nearest scrolling ancestor to have
 *     `overflow` other than `visible`. If the parent has `overflow: hidden`,
 *     sticky will not engage. Set `overflow: auto` or `overflow: scroll` on
 *     the scroll container.
 *   - The affix element must be shorter than the scroll container for sticky
 *     to produce a visible effect — if content is taller than the viewport it
 *     will scroll out as normal.
 *   - `until` (unstick past element X via IntersectionObserver) is deferred to
 *     v2; it requires JS and was excluded from the pure-CSS v1 scope.
 *
 * @stability experimental
 */
export class CeAffix extends CecElement {
  static override styles = css`
    :host {
      display: block;
      position: sticky;
      z-index: var(--_z, 10);
    }

    :host([edge="top"])    { top:                 var(--_offset, 0); }
    :host([edge="bottom"]) { bottom:              var(--_offset, 0); }
    :host([edge="start"])  { inset-inline-start:  var(--_offset, 0); }
    :host([edge="end"])    { inset-inline-end:    var(--_offset, 0); }
  `;

  /** Override: shadow DOM required for :host([attr]) selectors (ADR-002 exception). */
  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  /** Which viewport edge to stick against. */
  @property({ type: String, reflect: true })
  edge: "top" | "bottom" | "start" | "end" = "top";

  /**
   * Distance from the sticky edge. Accepts a bare number ("64" → "64px") or
   * any CSS length string ("4rem", "calc(env(safe-area-inset-top) + 1rem)").
   */
  @property({ type: String, reflect: true })
  offset: string = "0";

  /** z-index applied to the sticky element. */
  @property({ type: String, reflect: true })
  z: string = "10";

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("offset")) {
      this.style.setProperty("--_offset", normalizeOffset(this.offset));
    }
    if (changed.has("z")) {
      this.style.setProperty("--_z", this.z || "10");
    }
  }

  override render() {
    return html`<slot></slot>`;
  }
}

/**
 * Normalize an offset attribute value to a valid CSS length.
 * Bare numbers (with optional leading minus) get "px" appended.
 * Everything else passes through unchanged.
 */
function normalizeOffset(v: string): string {
  if (v == null || v === "") return "0";
  if (/^-?\d+(\.\d+)?$/.test(v)) return `${v}px`;
  return v;
}
