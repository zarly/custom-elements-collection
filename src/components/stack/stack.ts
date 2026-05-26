import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-stack>` — vertical or horizontal rhythm container.
 *
 * Places a consistent gap between every direct child. The atomic spacing
 * primitive for composing layouts. Absorbs the former `ce-cluster` use case
 * via `direction="horizontal" wrap`.
 *
 * Usage:
 *
 *   <ce-stack space="l">
 *     <h2>Title</h2>
 *     <p>Body</p>
 *     <ce-button>Action</ce-button>
 *   </ce-stack>
 *
 *   <!-- horizontal row (no wrap) -->
 *   <ce-stack direction="horizontal" space="s">
 *     <ce-tag>a</ce-tag><ce-tag>b</ce-tag>
 *   </ce-stack>
 *
 *   <!-- former ce-cluster: horizontal + wrap + baseline-aligned -->
 *   <ce-stack direction="horizontal" wrap space="s" align="baseline">
 *     <ce-tag>vue</ce-tag>
 *     <ce-tag>lit</ce-tag>
 *     <ce-button>+ Add</ce-button>
 *   </ce-stack>
 *
 *   <ce-stack space="m" split-after="2">
 *     <h2>Header</h2>
 *     <p>Body</p>
 *     <small>Footer (pushed to bottom)</small>
 *   </ce-stack>
 *
 * Attributes (all reflected):
 *   space       — gap size token: 3xs|2xs|xs|s|m|l|xl|2xl  (default "m")
 *   direction   — "vertical" | "horizontal"                  (default "vertical")
 *   wrap        — boolean; enables flex-wrap. When set, default `align`
 *                 becomes "center" (cluster-style). Mainly used with horizontal.
 *   align       — cross-axis: start|center|end|baseline|stretch  (default
 *                 "stretch" when wrap is unset, "center" when wrap is set)
 *   justify     — main-axis: start|center|end|between           (default "start")
 *   recursive   — propagate space to nested ce-stack descendants
 *   split-after — number N; push child N+1 onward to the end via margin-auto
 *
 * Shadow DOM rationale: we use shadow DOM (via createShadowRootWithStyles())
 * rather than the light-DOM default because:
 *   1. All gap/direction/wrap/align/justify/split-after styling relies on
 *      :host([attr]) selectors. Without shadow DOM, those selectors live in
 *      a <style> tag injected into light DOM where they have no scope and
 *      can collide with host-page rules.
 *   2. ce-grid (sibling layout component) uses the same pattern for identical
 *      reasons — shadow DOM is the established precedent for layout primitives.
 *   3. The slot remains the content channel; shadow DOM does not affect how
 *      children stream in (slot is evaluated lazily by the browser).
 *
 * Space token mapping (3xs/2xs→space-1, xs→space-2, s→space-3, m→space-4,
 * l→space-5, xl→space-6, 2xl→space-7). All seven tokens are verified present
 * in src/tokens/*.css before this was written.
 *
 * Migration note: `ce-cluster` was merged into `ce-stack` on 2026-05-23.
 * Old `<ce-cluster space="s" align="baseline">…</ce-cluster>` becomes
 * `<ce-stack direction="horizontal" wrap space="s" align="baseline">…</ce-stack>`.
 */

export type StackSpace = "3xs" | "2xs" | "xs" | "s" | "m" | "l" | "xl" | "2xl";
export type StackDirection = "vertical" | "horizontal";
export type StackAlign = "start" | "center" | "end" | "baseline" | "stretch";
export type StackJustify = "start" | "center" | "end" | "between";

export class CeStack extends CecElement {
  static override styles = css`
    /* ------------------------------------------------------------------ */
    /* Host layout                                                          */
    /* ------------------------------------------------------------------ */
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--ce-space-4); /* default: m */
    }

    :host([direction="horizontal"]) {
      flex-direction: row;
    }

    /* ------------------------------------------------------------------ */
    /* Space scale — maps enum values to design tokens                     */
    /* ------------------------------------------------------------------ */
    :host([space="3xs"]),
    :host([space="2xs"]) {
      gap: var(--ce-space-1);
    }
    :host([space="xs"]) {
      gap: var(--ce-space-2);
    }
    :host([space="s"]) {
      gap: var(--ce-space-3);
    }
    :host([space="m"]) {
      gap: var(--ce-space-4);
    }
    :host([space="l"]) {
      gap: var(--ce-space-5);
    }
    :host([space="xl"]) {
      gap: var(--ce-space-6);
    }
    :host([space="2xl"]) {
      gap: var(--ce-space-7);
    }

    /* ------------------------------------------------------------------ */
    /* wrap — enables flex-wrap (former ce-cluster behavior)               */
    /* ------------------------------------------------------------------ */
    :host([wrap]) {
      flex-wrap: wrap;
      /* Cluster-style default: center cross-axis when wrapping. Overridden
       * by an explicit :host([align="..."]) rule below. */
      align-items: center;
    }

    /* ------------------------------------------------------------------ */
    /* align — cross-axis alignment                                         */
    /* Explicit values override the wrap-driven default above.              */
    /* ------------------------------------------------------------------ */
    :host([align="start"])    { align-items: flex-start; }
    :host([align="center"])   { align-items: center; }
    :host([align="end"])      { align-items: flex-end; }
    :host([align="baseline"]) { align-items: baseline; }
    :host([align="stretch"])  { align-items: stretch; }

    /* ------------------------------------------------------------------ */
    /* justify — main-axis alignment                                        */
    /* ------------------------------------------------------------------ */
    :host([justify="start"])   { justify-content: flex-start; }
    :host([justify="center"])  { justify-content: center; }
    :host([justify="end"])     { justify-content: flex-end; }
    :host([justify="between"]) { justify-content: space-between; }

    /*
     * split-after — Heydon Pickering sticky-footer trick.
     *
     * The host needs a block size in order for margin-auto to have
     * something to push against. We set min-block-size: 100% so the
     * host fills its available space when split-after is present.
     *
     * Targeting the split child is done via inline style on the element
     * (set in willUpdate) because :host([split-after="N"]) ::slotted()
     * can only address direct children by index in simple-selector form,
     * not by computed nth. Inline style on the host element is the clean
     * alternative used by most CSS-only Flexbox "switcher" patterns.
     */
    :host([split-after]) {
      min-block-size: 100%;
    }

    /*
     * recursive — propagate gap to nested ce-stack descendants.
     *
     * In shadow DOM we cannot reach outside our shadow boundary with
     * descendant selectors. The recursive flag is implemented by setting
     * a data attribute on the host that nested ce-stack instances can
     * observe and mirror. See willUpdate() below.
     *
     * This means recursive only propagates one level per flag — which is
     * the documented behaviour. Document in CONCEPT.md.
     */
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String, reflect: true })
  space: StackSpace = "m";

  @property({ type: String, reflect: true })
  direction: StackDirection = "vertical";

  /** Enable flex-wrap. When set, default `align` becomes "center". */
  @property({ type: Boolean, reflect: true })
  wrap = false;

  /** Cross-axis alignment. Default is "stretch" unless `wrap` is set, then "center". */
  @property({ type: String, reflect: true })
  align: StackAlign | null = null;

  /** Main-axis alignment. Default "start". */
  @property({ type: String, reflect: true })
  justify: StackJustify | null = null;

  @property({ type: Boolean, reflect: true })
  recursive = false;

  /** `split-after="N"` — push child at index N+1 onward to the end. */
  @property({ type: Number, reflect: true, attribute: "split-after" })
  splitAfter: number | null = null;

  override willUpdate(): void {
    this.#applySplitAfter();
    this.#applyRecursive();
  }

  #applySplitAfter(): void {
    // Remove any previously injected margin so we start clean each update.
    for (const child of Array.from(this.children)) {
      (child as HTMLElement).style.removeProperty("margin-block-start");
    }

    if (this.splitAfter === null || this.splitAfter < 1) return;

    // The child at index splitAfter (0-based: splitAfter-th child = index splitAfter)
    // gets margin-block-start: auto to consume all spare space before it.
    const target = this.children[this.splitAfter] as HTMLElement | undefined;
    if (target) {
      target.style.setProperty("margin-block-start", "auto");
    }
  }

  #applyRecursive(): void {
    // When recursive is set, propagate the current space value to direct
    // ce-stack children that have not overridden their own space attribute.
    // This gives one-level deep inheritance; nested stacks must also set
    // recursive if they want to propagate further.
    if (!this.recursive) return;

    for (const child of Array.from(this.children)) {
      if (child.tagName.toLowerCase() === "ce-stack" && !child.hasAttribute("space")) {
        child.setAttribute("space", this.space);
      }
    }
  }

  override render() {
    return html`<slot></slot>`;
  }
}
