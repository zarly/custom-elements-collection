import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { CecElement } from "../core/index.js";

/**
 * `<lesson-audio>` — pronunciation/audio clip with optional phonetic transcription.
 *
 * Attributes:
 *   src       — audio URL
 *   phonetic  — IPA or pronunciation guide ("/ə/")
 *   label     — button label (default "🔊 Play")
 *
 * Events:
 *   lesson-audio-play — fires on each play
 */
export class LessonAudio extends CecElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--ce-space-2);
      padding: var(--ce-space-1) var(--ce-space-3);
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius-sm);
      vertical-align: middle;
    }
    button {
      background: var(--ce-color-blue);
      color: var(--ce-text-inverse);
      border: none;
      padding: 4px 10px;
      border-radius: var(--ce-radius-sm);
      cursor: pointer;
      font: inherit;
      font-weight: 600;
      font-size: var(--ce-text-sm);
    }
    button:disabled { opacity: 0.6; cursor: default; }
    .la-phonetic {
      color: var(--ce-muted);
      font-family: var(--ce-font-mono);
      font-size: var(--ce-text-sm);
    }
    .la-error {
      color: var(--ce-color-red);
      font-size: var(--ce-text-xs);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) src = "";
  @property({ type: String }) phonetic = "";
  @property({ type: String }) label = "🔊 Play";

  @state() private _playing = false;
  @state() private _error = "";

  #audio: HTMLAudioElement | null = null;

  async #play(): Promise<void> {
    if (!this.src) {
      this._error = "no src";
      return;
    }
    this._error = "";
    if (!this.#audio) {
      this.#audio = new Audio(this.src);
      this.#audio.addEventListener("ended", () => {
        this._playing = false;
      });
      this.#audio.addEventListener("error", () => {
        this._playing = false;
        this._error = "audio failed to load";
      });
    }
    try {
      this._playing = true;
      this.dispatchEvent(
        new CustomEvent("lesson-audio-play", {
          bubbles: true,
          composed: true,
          detail: { src: this.src },
        })
      );
      await this.#audio.play();
    } catch (e) {
      this._playing = false;
      this._error = (e as Error).message;
    }
  }

  override render() {
    return html`
      <button type="button" ?disabled=${this._playing} @click=${this.#play}>
        ${this.label}
      </button>
      ${this.phonetic ? html`<span class="la-phonetic">${this.phonetic}</span>` : ""}
      ${this._error ? html`<span class="la-error">${this._error}</span>` : ""}
    `;
  }
}
