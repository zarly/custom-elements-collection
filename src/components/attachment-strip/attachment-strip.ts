import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement, jsonProp } from "../../core/index.js";

// ── Public types ────────────────────────────────────────────────────────────

export type CeAttachmentKind = "image" | "file" | "audio" | "video" | "other";

export interface CeAttachment {
  id: string;
  name: string;
  kind?: CeAttachmentKind;
  /** Optional image URL for thumbnail (shown when kind === "image"). */
  thumb?: string;
  /** File size in bytes. */
  size?: number;
}

// ── Size formatter ──────────────────────────────────────────────────────────

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return i === 0 ? `${Math.round(v)} B` : `${v.toFixed(1)} ${units[i]}`;
}

// ── Kind icons (inline SVG, ~16×16, currentColor) ──────────────────────────

function iconForKind(kind: CeAttachmentKind | undefined) {
  switch (kind) {
    case "image":
      // Mountain / landscape icon
      return html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="1" y="2" width="14" height="12" rx="1.5"/>
        <path d="M1 11l3.5-4 3 3.5 2.5-3 4 4"/>
        <circle cx="5.5" cy="5.5" r="1"/>
      </svg>`;
    case "audio":
      // Waveform icon
      return html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M1 8h2M3 5v6M5 3v10M7 6v4M9 4v8M11 5v6M13 7v2M15 8h-2"/>
      </svg>`;
    case "video":
      // Play triangle icon
      return html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="1" y="2" width="14" height="12" rx="1.5"/>
        <path d="M6 5.5l5 2.5-5 2.5V5.5z" fill="currentColor" stroke="none"/>
      </svg>`;
    case "other":
    case "file":
    default:
      // Paper / file icon
      return html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M9 1H3a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V6L9 1z"/>
        <path d="M9 1v5h5"/>
      </svg>`;
  }
}

// ── Remove button SVG ───────────────────────────────────────────────────────

const REMOVE_ICON = html`<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
  <path d="M2 2l6 6M8 2L2 8"/>
</svg>`;

// ── Component ───────────────────────────────────────────────────────────────

/**
 * `<ce-attachment-strip>` — horizontal scrolling strip of attachment previews
 * above a chat composer, each with a remove affordance.
 *
 * Two data modes (CDR-005 — resolution order):
 *   1. `items` JSON prop non-empty → renders JSON-mode tiles.
 *   2. Else → renders slotted custom tiles; the strip exposes a default `<slot>`.
 *   3. Neither → renders nothing (empty state — strip collapses).
 *
 * Event `ce-attachment-remove` fires with `{ id }` when a tile's ✕ is clicked.
 * The host is responsible for updating the source-of-truth.
 */
export class CeAttachmentStrip extends CecElement {
  static override styles = css`
    :host {
      display: block;
    }
    :host([hidden]) {
      display: none;
    }

    /* ── Container ── */
    .ce-strip {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: var(--ce-space-2);
      padding: var(--ce-space-2) 0;
      overflow-x: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--ce-border) transparent;
    }
    .ce-strip::-webkit-scrollbar {
      height: 4px;
    }
    .ce-strip::-webkit-scrollbar-track {
      background: transparent;
    }
    .ce-strip::-webkit-scrollbar-thumb {
      background: var(--ce-border);
      border-radius: var(--ce-radius-pill);
    }

    /* ── Individual tile (JSON mode) ── */
    .ce-tile {
      display: inline-flex;
      flex-direction: column;
      align-items: stretch;
      min-width: 96px;
      max-width: 220px;
      flex: 0 0 auto;
      padding: var(--ce-space-2);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      background: var(--ce-surface);
      position: relative;
      box-sizing: border-box;
      transition: border-color var(--ce-transition-fast);
    }
    .ce-tile:hover {
      border-color: var(--ce-border-strong);
    }

    /* ── Compact modifier ── */
    :host([compact]) .ce-tile {
      min-width: 72px;
      padding: var(--ce-space-1);
    }
    :host([compact]) .ce-tile-thumb {
      aspect-ratio: 4/3;
    }

    /* ── Thumbnail (image kind with thumb URL) ── */
    .ce-tile-thumb {
      aspect-ratio: 4/3;
      object-fit: cover;
      border-radius: var(--ce-radius-sm);
      width: 100%;
      display: block;
      background: var(--ce-surface-2);
    }

    /* ── Kind icon (non-image or no thumb) ── */
    .ce-tile-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      aspect-ratio: 4/3;
      width: 100%;
      border-radius: var(--ce-radius-sm);
      background: var(--ce-surface-2);
      color: var(--ce-muted);
      box-sizing: border-box;
    }

    /* ── Text area ── */
    .ce-tile-body {
      margin-top: var(--ce-space-1);
      min-width: 0;
    }
    .ce-tile-name {
      font-size: var(--ce-text-xs);
      color: var(--ce-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: var(--ce-font-sans);
      line-height: var(--ce-line-snug);
    }
    .ce-tile-size {
      font-size: var(--ce-text-xs);
      color: var(--ce-muted);
      font-family: var(--ce-font-sans);
      line-height: var(--ce-line-snug);
    }

    /* ── Remove button ── */
    .ce-tile-remove {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ce-surface-2);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-pill);
      cursor: pointer;
      color: var(--ce-muted);
      padding: 0;
      transition:
        color var(--ce-transition-fast),
        border-color var(--ce-transition-fast),
        background var(--ce-transition-fast);
      box-sizing: border-box;
    }
    .ce-tile-remove:hover {
      color: var(--ce-color-red);
      border-color: var(--ce-color-red-border);
      background: var(--ce-color-red-bg);
    }
    .ce-tile-remove:focus-visible {
      outline: none;
      box-shadow: var(--ce-focus-ring);
    }

    /* ── Slot mode ── */
    .ce-slot-wrapper {
      display: contents;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  // ── Props ──────────────────────────────────────────────────────────────────

  @property(jsonProp<CeAttachment[]>([]))
  items: CeAttachment[] = [];

  /**
   * `jsonProp<boolean>(true)` is used so that `removable="false"` (as a plain
   * HTML attribute string) correctly deserialises to boolean false via
   * JSON.parse — Lit's standard `type: Boolean` would treat any attribute
   * presence as true regardless of value.
   */
  @property({ ...jsonProp<boolean>(true), reflect: true })
  removable = true;

  @property({ type: Boolean, reflect: true })
  compact = false;

  // ── Internal helpers ──────────────────────────────────────────────────────

  #onRemoveClick(id: string): void {
    this.dispatchEvent(
      new CustomEvent("ce-attachment-remove", {
        bubbles: true,
        composed: true,
        detail: { id },
      })
    );
  }

  #renderTile(item: CeAttachment) {
    const sizeLabel = item.size != null ? formatBytes(item.size) : "";

    return html`
      <div
        class="ce-tile"
        role="group"
        aria-label=${item.name}
      >
        ${item.kind === "image" && item.thumb
          ? html`<img
              class="ce-tile-thumb"
              src=${item.thumb}
              alt=""
              loading="lazy"
            />`
          : html`<div class="ce-tile-icon">${iconForKind(item.kind)}</div>`}
        <div class="ce-tile-body">
          <div class="ce-tile-name" title=${item.name}>${item.name}</div>
          ${sizeLabel
            ? html`<div class="ce-tile-size">${sizeLabel}</div>`
            : nothing}
        </div>
        ${this.removable
          ? html`<button
              class="ce-tile-remove"
              type="button"
              aria-label="Remove ${item.name}"
              @click=${() => this.#onRemoveClick(item.id)}
            >
              ${REMOVE_ICON}
            </button>`
          : nothing}
      </div>
    `;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  override render() {
    const useJsonMode = this.items && this.items.length > 0;

    if (useJsonMode) {
      return html`
        <div class="ce-strip" role="list" aria-label="Attachments">
          ${this.items.map((item) => this.#renderTile(item))}
        </div>
      `;
    }

    // Slot mode — always render the slot; the strip is visible when children
    // are assigned. We still render the container so slotted children are
    // discoverable via assignedElements().
    return html`
      <div class="ce-strip" role="list" aria-label="Attachments">
        <slot></slot>
      </div>
    `;
  }
}
