import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-code>` — code block with optional language label and copy button.
 *
 * No syntax-highlighting runtime is bundled — keeping `<ce-code>` small and
 * theme-agnostic. Consumers who want tokens have two paths:
 *
 *   1. **Pre-render token spans** as slotted children, then style them per
 *      whichever class scheme they pick. The slot accepts any inline content
 *      verbatim — copy/paste keeps working because spans are inert.
 *   2. **In a streaming-markdown pipeline**, plug a highlighter into
 *      `@generative-dom/plugin-companion`'s `contentRenderers` option. The
 *      canonical recipe wires `@generative-dom/plugin-highlight`'s public
 *      `tokenize` + `renderTokens` exports into a per-tag renderer for
 *      `<ce-code>`, emitting `<span class="hl-keyword">`, `hl-string`,
 *      `hl-number`, etc. See the plugin-companion README.
 *
 * Either way, the consumer owns the token-class palette. `<ce-code>` itself
 * stays neutral and styles only the frame (border, header, copy button).
 *
 * Attributes:
 *   lang       — optional language label shown top-right. Any string is
 *                accepted; the `@generative-dom/plugin-highlight` runtime
 *                ships built-in tokenisers for: `js`/`javascript`,
 *                `ts`/`typescript`, `json`, `html`, `css`, `bash`/`sh`/
 *                `shell`/`zsh`, `c`, `cpp`/`c++`, `yaml`/`yml`,
 *                `markdown`/`md`, `diff`/`patch`, `julia`/`jl`, `zig`.
 *                Authoritative list lives in that package's `BUILTIN_LANGS`.
 *                Other tags render as a plain label.
 *   filename   — optional filename label shown top-left
 *   copy       — boolean; show a copy button (default true)
 *
 * Slots:
 *   (default)  — the code text (plain text or pre-highlighted spans)
 */
export class CeCode extends CecElement {
  static override styles = css`
    :host {
      display: block;
      position: relative;
      background: var(--ce-code-bg);
      border: 1px solid var(--ce-border-soft);
      border-radius: var(--ce-radius);
      overflow: hidden;
      margin: var(--ce-space-3) 0;
    }
    .ce-code__header {
      display: flex;
      align-items: center;
      gap: var(--ce-space-2);
      padding: var(--ce-inset-md) var(--ce-inset-lg);
      background: var(--ce-state-hover);
      border-bottom: 1px solid var(--ce-border-soft);
      font-size: var(--ce-text-xs);
      color: var(--ce-muted);
      font-family: var(--ce-font-mono);
    }
    .ce-code__filename { flex: 1; }
    .ce-code__lang {
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .ce-code__copy {
      background: transparent;
      color: var(--ce-muted);
      border: 1px solid var(--ce-border-soft);
      border-radius: var(--ce-radius-sm);
      padding: var(--ce-inset-xs) var(--ce-space-2);
      cursor: pointer;
      font-family: inherit;
      font-size: inherit;
      transition: all var(--ce-transition-fast);
    }
    .ce-code__copy:hover {
      color: var(--ce-text);
      border-color: var(--ce-color-blue);
    }
    .ce-code__copy[data-state="copied"] {
      color: var(--ce-color-green);
      border-color: var(--ce-color-green);
    }
    .ce-code__body {
      padding: var(--ce-space-3) var(--ce-space-4);
      overflow-x: auto;
      font-family: var(--ce-font-mono);
      font-size: var(--ce-text-sm);
      line-height: var(--ce-line-normal);
      color: var(--ce-code-text);
      white-space: pre;
    }
    :host(:not([lang]):not([filename]):not([copy])) .ce-code__header { display: none; }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) lang = "";
  @property({ type: String }) filename = "";
  @property({ type: Boolean }) copy = true;

  override render() {
    return html`
      <div class="ce-code__header">
        ${this.filename
          ? html`<span class="ce-code__filename">${this.filename}</span>`
          : html`<span class="ce-code__filename"></span>`}
        ${this.lang ? html`<span class="ce-code__lang">${this.lang}</span>` : ""}
        ${this.copy
          ? html`<button
              class="ce-code__copy"
              type="button"
              aria-label="Copy code"
              @click=${this.#onCopy}
            >
              copy
            </button>`
          : ""}
      </div>
      <pre class="ce-code__body"><code><slot></slot></code></pre>
    `;
  }

  async #onCopy(e: Event): Promise<void> {
    const btn = e.currentTarget as HTMLButtonElement;
    const text = this.textContent ?? "";
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback: create a hidden textarea
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      btn.dataset.state = "copied";
      btn.textContent = "copied!";
      setTimeout(() => {
        btn.dataset.state = "";
        btn.textContent = "copy";
      }, 1400);
      this.dispatchEvent(
        new CustomEvent("ce-code-copy", { bubbles: true, composed: true, detail: { text } })
      );
    } catch (err) {
      btn.textContent = "error";
    }
  }
}
