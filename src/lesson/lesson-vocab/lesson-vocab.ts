import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<lesson-vocab>` — vocabulary term card.
 *
 * Attributes:
 *   term       — the word or concept
 *   phonetic   — IPA or phonetic transcription
 *   pos        — part of speech (noun, verb, adj, etc.)
 *   definition — the meaning
 *   example    — example sentence
 *   level      — proficiency label (A1, B2, advanced, etc.)
 */
export class LessonVocab extends CecElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      padding: var(--ce-space-5);
      margin: var(--ce-space-3) 0;
    }
    .lv-head {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: var(--ce-space-2);
      margin-bottom: var(--ce-space-2);
    }
    .lv-term {
      font-size: var(--ce-text-xl);
      font-weight: 800;
      color: var(--ce-text);
    }
    .lv-phonetic {
      font-family: var(--ce-font-mono);
      font-size: var(--ce-text-sm);
      color: var(--ce-muted);
    }
    .lv-pos {
      font-size: var(--ce-text-xs);
      padding: 2px 8px;
      border-radius: var(--ce-radius-sm);
      background: var(--ce-color-amber-bg);
      color: var(--ce-color-amber);
      font-weight: 600;
    }
    .lv-level {
      font-size: var(--ce-text-xs);
      padding: 2px 8px;
      border-radius: var(--ce-radius-sm);
      background: var(--ce-surface-2);
      color: var(--ce-muted);
      margin-left: auto;
    }
    .lv-definition {
      color: var(--ce-text);
      font-size: var(--ce-text-base);
      margin-bottom: var(--ce-space-2);
    }
    .lv-example {
      color: var(--ce-muted);
      font-style: italic;
      font-size: var(--ce-text-sm);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) term = "";
  @property({ type: String }) phonetic = "";
  @property({ type: String }) pos = "";
  @property({ type: String }) definition = "";
  @property({ type: String }) example = "";
  @property({ type: String }) level = "";

  override render() {
    return html`
      <div class="lv-head">
        <span class="lv-term">${this.term}</span>
        ${this.phonetic ? html`<span class="lv-phonetic">${this.phonetic}</span>` : nothing}
        ${this.pos ? html`<span class="lv-pos">${this.pos}</span>` : nothing}
        ${this.level ? html`<span class="lv-level">${this.level}</span>` : nothing}
      </div>
      ${this.definition ? html`<div class="lv-definition">${this.definition}</div>` : nothing}
      ${this.example ? html`<div class="lv-example">"${this.example}"</div>` : nothing}
    `;
  }
}
