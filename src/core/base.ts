import { LitElement, adoptStyles, type CSSResultOrNative } from "lit";

/**
 * CecElement is the shared base for all ce-* and lesson-* components.
 *
 * Key differences from vanilla LitElement:
 *
 * 1. Renders into light DOM by default (see ADR-002). Components that need
 *    style isolation should override createRenderRoot() by returning
 *    `this.createShadowRootWithStyles()` — that helper attaches a shadow
 *    root AND adopts the component's static styles (Lit's default behavior
 *    is re-implemented, since our base-class override otherwise skips it).
 *
 * 2. Exposes `requestFrame()` helper for components that animate or read
 *    layout after update.
 */
export class CecElement extends LitElement {
  /** Override: render into the element itself, not a shadow root. */
  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  /**
   * For components that want style isolation: attaches a shadow root AND
   * adopts static styles (matches LitElement's default createRenderRoot
   * behavior). Call this from your component's own createRenderRoot override:
   *
   *     protected override createRenderRoot(): ShadowRoot {
   *       return this.createShadowRootWithStyles();
   *     }
   */
  protected createShadowRootWithStyles(
    init: ShadowRootInit = (this.constructor as typeof LitElement).shadowRootOptions
  ): ShadowRoot {
    const root = this.shadowRoot ?? this.attachShadow(init);
    const styles = (this.constructor as unknown as {
      elementStyles: readonly CSSResultOrNative[];
    }).elementStyles;
    if (styles && styles.length) {
      adoptStyles(root, styles as CSSResultOrNative[]);
    }
    return root;
  }

  /** Schedule a callback in the next animation frame, after DOM flush. */
  protected requestFrame(cb: FrameRequestCallback): number {
    return requestAnimationFrame(cb);
  }
}
