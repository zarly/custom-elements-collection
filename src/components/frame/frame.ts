import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-frame>` — locked aspect-ratio container that crops or letterboxes
 * any child media (img, video, iframe, canvas, picture).
 *
 * Usage:
 *
 *   <ce-frame ratio="16:9">
 *     <img src="hero.jpg" alt="">
 *   </ce-frame>
 *
 *   <ce-frame ratio="1:1" fit="contain">
 *     <img src="logo.svg" alt="logo">
 *   </ce-frame>
 *
 *   <ce-frame ratio="3:4">
 *     <video src="portrait.mp4" muted></video>
 *   </ce-frame>
 *
 * Attributes (all reflected):
 *   ratio  — aspect ratio: 1:1|4:3|16:9|21:9|3:4|golden  (default: 16:9)
 *   fit    — object-fit mode: cover|contain               (default: cover)
 *
 * Slots:
 *   (default) — the media element to constrain
 *
 * Notes:
 *   - `golden` maps to 1.618:1 (the golden ratio).
 *   - `object-fit` applies only to img, video, and picture via `::slotted`.
 *     iframes always fill width/height (100%×100%) — letterbox for iframes
 *     is controlled by the iframe's own viewport, not object-fit.
 *   - `::slotted(img)` only matches DIRECT slot children. If the user wraps
 *     the img in another element, object-fit will not reach it.
 */
export class CeFrame extends CecElement {
  static override styles = css`
    :host {
      display: block;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      background: var(--ce-bg, transparent);
    }

    /* ---- ratio variants ---- */
    :host([ratio="1:1"])    { aspect-ratio: 1 / 1; }
    :host([ratio="4:3"])    { aspect-ratio: 4 / 3; }
    :host([ratio="16:9"])   { aspect-ratio: 16 / 9; }
    :host([ratio="21:9"])   { aspect-ratio: 21 / 9; }
    :host([ratio="3:4"])    { aspect-ratio: 3 / 4; }
    :host([ratio="golden"]) { aspect-ratio: 1.618 / 1; }

    /* ---- slotted media — fill the frame, cover by default ---- */
    ::slotted(img),
    ::slotted(video),
    ::slotted(iframe),
    ::slotted(canvas),
    ::slotted(picture) {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* ---- fit=contain: switch to letterbox for rasterised media ---- */
    :host([fit="contain"]) ::slotted(img),
    :host([fit="contain"]) ::slotted(video),
    :host([fit="contain"]) ::slotted(picture) {
      object-fit: contain;
    }
  `;

  /** Override: shadow DOM so :host([ratio]) and ::slotted() selectors work. */
  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  /**
   * Aspect ratio. One of: 1:1 | 4:3 | 16:9 | 21:9 | 3:4 | golden.
   * Defaults to 16:9.
   */
  @property({ type: String, reflect: true })
  ratio: "1:1" | "4:3" | "16:9" | "21:9" | "3:4" | "golden" = "16:9";

  /**
   * How child media fills the frame. cover (default) crops to fill;
   * contain letterboxes to show the full image.
   * Does not apply to iframe or canvas (they always fill 100%×100%).
   */
  @property({ type: String, reflect: true })
  fit: "cover" | "contain" = "cover";

  override render() {
    return html`<slot></slot>`;
  }
}
