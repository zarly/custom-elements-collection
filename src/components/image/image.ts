import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-image>` — lazy image with caption and graceful fallback.
 *
 * Attributes:
 *   src, alt, caption, width, height, fallback (URL used on load error),
 *   loading (eager|lazy, default lazy)
 *
 * Slot: caption — overrides caption attribute.
 *
 * Events: ce-image-error — { src }
 */
export class CeImage extends CecElement {
  static override styles = css`
    :host {
      display: inline-block;
      vertical-align: top;
      max-width: 100%;
    }
    figure {
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: var(--ce-space-2);
    }
    img {
      display: block;
      max-width: 100%;
      height: auto;
      border-radius: var(--ce-radius);
      background: var(--ce-surface-2);
    }
    figcaption {
      font-size: var(--ce-text-sm);
      color: var(--ce-muted);
      line-height: var(--ce-line-snug);
    }
    .err {
      padding: var(--ce-space-3);
      background: var(--ce-surface-2);
      color: var(--ce-muted);
      border: 1px dashed var(--ce-border);
      border-radius: var(--ce-radius);
      font-size: var(--ce-text-sm);
      text-align: center;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) src = "";
  @property({ type: String }) alt = "";
  @property({ type: String }) caption = "";
  @property({ type: Number }) width: number | null = null;
  @property({ type: Number }) height: number | null = null;
  @property({ type: String }) fallback = "";
  @property({ type: String }) loading: "eager" | "lazy" = "lazy";

  @state() private _failed = false;

  #onError = (): void => {
    if (this._failed) return;
    this._failed = true;
    this.dispatchEvent(
      new CustomEvent("ce-image-error", {
        bubbles: true,
        composed: true,
        detail: { src: this.src },
      })
    );
  };

  override render() {
    const showFallback = this._failed && this.fallback;
    const showErr = this._failed && !this.fallback;
    const url = showFallback ? this.fallback : this.src;

    return html`
      <figure>
        ${showErr
          ? html`<div class="err" role="img" aria-label=${this.alt || "image failed to load"}>${this.alt || "Image failed to load"}</div>`
          : html`<img
              src=${url}
              alt=${this.alt}
              loading=${this.loading}
              width=${this.width != null ? this.width : ""}
              height=${this.height != null ? this.height : ""}
              @error=${this.#onError}
            />`}
        ${this.caption || (this.querySelector('[slot="caption"]') as HTMLElement | null)
          ? html`<figcaption><slot name="caption">${this.caption}</slot></figcaption>`
          : ""}
      </figure>
    `;
  }
}
