import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

const ICON_BY_TYPE: Record<string, string> = {
  pdf: "📕",
  doc: "📘",
  docx: "📘",
  xls: "📗",
  xlsx: "📗",
  csv: "📗",
  txt: "📄",
  md: "📝",
  zip: "🗜",
  png: "🖼",
  jpg: "🖼",
  jpeg: "🖼",
  gif: "🖼",
  mp3: "🎧",
  wav: "🎧",
  mp4: "🎬",
  mov: "🎬",
};

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

/**
 * `<ce-file-card>` — downloadable attachment card with name, size, type, and
 * optional thumbnail.
 *
 * Attributes:
 *   name, size (bytes), type (extension or mime), href, thumbnail
 *
 * Slot: meta — extra metadata rendered under the size line.
 *
 * Events: ce-file-open — fired when the card is activated.
 */
export class CeFileCard extends CecElement {
  static override styles = css`
    :host {
      display: block;
    }
    a, .stack {
      display: flex;
      gap: var(--ce-space-3);
      align-items: center;
      padding: var(--ce-space-3);
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      color: var(--ce-text);
      text-decoration: none;
      transition: border-color var(--ce-transition), box-shadow var(--ce-transition);
    }
    a:hover {
      border-color: var(--ce-border-strong);
      box-shadow: var(--ce-shadow);
    }
    .icon {
      width: var(--ce-sz-lg);
      height: var(--ce-sz-lg);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--ce-surface-2);
      border-radius: var(--ce-radius-sm);
      font-size: 22px;
      flex: 0 0 auto;
    }
    img.thumb {
      width: var(--ce-sz-lg);
      height: var(--ce-sz-lg);
      object-fit: cover;
      border-radius: var(--ce-radius-sm);
      flex: 0 0 auto;
    }
    .body { min-width: 0; flex: 1; }
    .name {
      font-weight: 600;
      font-size: var(--ce-text-sm);
      color: var(--ce-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .meta {
      font-size: var(--ce-text-xs);
      color: var(--ce-muted);
    }
    a:focus-visible {
      outline: 0;
      box-shadow: var(--ce-focus-ring);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) name = "";
  @property({ type: Number }) size = 0;
  @property({ type: String }) type = "";
  @property({ type: String }) href = "";
  @property({ type: String }) thumbnail = "";

  #icon(): string {
    const t = (this.type || this.name.split(".").pop() || "").toLowerCase();
    return ICON_BY_TYPE[t] || "📄";
  }

  #onActivate = (): void => {
    this.dispatchEvent(
      new CustomEvent("ce-file-open", {
        bubbles: true,
        composed: true,
        detail: { name: this.name, href: this.href },
      })
    );
  };

  override render() {
    const sizeLabel = this.size ? formatBytes(this.size) : "";
    const typeLabel = this.type ? this.type.toUpperCase() : "";
    const meta = [typeLabel, sizeLabel].filter(Boolean).join(" · ");
    const inner = html`
      ${this.thumbnail
        ? html`<img class="thumb" src=${this.thumbnail} alt="" loading="lazy" />`
        : html`<span class="icon" aria-hidden="true">${this.#icon()}</span>`}
      <span class="body">
        <span class="name">${this.name}</span>
        ${meta ? html`<span class="meta">${meta}</span>` : ""}
        <slot name="meta"></slot>
      </span>
    `;
    return this.href
      ? html`<a href=${this.href} @click=${this.#onActivate} target="_blank" rel="noopener">${inner}</a>`
      : html`<div class="stack" role="group" aria-label=${this.name || "file"}>${inner}</div>`;
  }
}
