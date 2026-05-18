import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * Step state enum (CDR-001 — finite, 3-value style enum driving visual treatment only).
 * - pending: neutral disk, normal title weight (default)
 * - active:  blue disk, bold title, aria-current="step"
 * - done:    green disk with check icon, visually-hidden "Completed:" prefix
 */
export type StepState = "pending" | "active" | "done";

/**
 * `<ce-step>` — a single numbered process step.
 *
 * Can be used standalone or as a slot child of `<ce-steps>` (CDR-006).
 * When nested in `<ce-steps>` with `auto-number` enabled, the parent assigns
 * `n` automatically if the attribute is absent.
 *
 * Usage:
 *
 *   <!-- Standalone -->
 *   <ce-step n="1" title="Discovery">15 interviews + analysis</ce-step>
 *
 *   <!-- Rich title slot (CDR-002) -->
 *   <ce-step n="2">
 *     <span slot="title">Prototype <ce-chip type="amber" inline>WIP</ce-chip></span>
 *     Clickable Figma prototype
 *   </ce-step>
 *
 *   <!-- State -->
 *   <ce-step n="3" title="Validate" state="done">5 follow-up interviews</ce-step>
 *
 * Attributes:
 *   n       — step number or letter. Optional; if absent, no disk renders (or parent auto-assigns).
 *   title   — plain-text short title. Rich title via slot="title" wins if both present (CDR-002).
 *   state   — "pending" | "active" | "done" (CDR-001 finite enum). Default "pending".
 *
 * Slots:
 *   (default) — description text; may contain rich children (<a>, <code>, <ce-chip>, etc.) per CDR-002.
 *   title     — rich title override; wins over the `title` attribute when provided.
 *   meta      — optional metadata line shown beside the title (e.g. "~2 weeks", "Q3 2026").
 *
 * ARIA:
 *   Number disk: aria-hidden="true" (decorative).
 *   state="active": aria-current="step" on host.
 *   state="done": visually-hidden "Completed:" prefix before title text.
 */
export class CeStep extends CecElement {
  static override styles = css`
    :host {
      display: block;
      --ce-step-disk-size: 32px;
      --ce-step-disk-bg: var(--ce-surface-2);
      --ce-step-disk-fg: var(--ce-muted);
      --ce-step-title-weight: 400;
      --ce-step-title-color: var(--ce-text);
      --ce-step-gap: var(--ce-space-3);
    }

    /* State: active — blue disk, bold title */
    :host([state="active"]) {
      --ce-step-disk-bg: var(--ce-color-blue-bg);
      --ce-step-disk-fg: var(--ce-color-blue);
      --ce-step-title-weight: 700;
    }

    /* State: done — green disk */
    :host([state="done"]) {
      --ce-step-disk-bg: var(--ce-color-green-bg);
      --ce-step-disk-fg: var(--ce-color-green);
    }

    .ce-step {
      display: flex;
      gap: var(--ce-step-gap);
      align-items: flex-start;
    }

    /* Number disk */
    .ce-step__disk {
      flex: 0 0 var(--ce-step-disk-size);
      width: var(--ce-step-disk-size);
      height: var(--ce-step-disk-size);
      border-radius: var(--ce-radius-pill);
      background: var(--ce-step-disk-bg);
      color: var(--ce-step-disk-fg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--ce-text-sm);
      font-weight: 700;
      line-height: 1;
      border: 1px solid var(--ce-border);
      transition: background var(--ce-transition), color var(--ce-transition),
        border-color var(--ce-transition);
    }

    :host([state="active"]) .ce-step__disk {
      border-color: var(--ce-color-blue-border);
    }

    :host([state="done"]) .ce-step__disk {
      border-color: var(--ce-color-green-border);
    }

    /* Body */
    .ce-step__body {
      flex: 1 1 0;
      min-width: 0;
    }

    /* Title row: title + meta inline */
    .ce-step__title-row {
      display: flex;
      align-items: baseline;
      gap: var(--ce-space-2);
      flex-wrap: wrap;
    }

    .ce-step__title {
      font-size: var(--ce-text-base);
      font-weight: var(--ce-step-title-weight);
      color: var(--ce-step-title-color);
      line-height: var(--ce-line-snug);
    }

    .ce-step__title ::slotted(*) {
      font-size: inherit;
      font-weight: inherit;
      color: inherit;
      line-height: inherit;
    }

    .ce-step__meta {
      font-size: var(--ce-text-sm);
      color: var(--ce-muted);
      white-space: nowrap;
    }

    /* Description */
    .ce-step__desc {
      margin-top: var(--ce-space-1);
      font-size: var(--ce-text-sm);
      color: var(--ce-muted);
      line-height: var(--ce-line-normal);
    }

    /* Visually hidden utility for screen-reader text */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    /* Hide disk when n is absent (no attribute) — controlled via has-n attr set in willUpdate */
    :host(:not([has-n])) .ce-step__disk {
      display: none;
    }

    /* Hide meta slot wrapper when slot is empty */
    .ce-step__meta:not(:has(::slotted(*))) {
      display: none;
    }

    /* Hide desc wrapper when no description content */
    .ce-step__desc:not(:has(::slotted(*))) {
      display: none;
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  /** Step number or letter rendered in the disk. Optional. */
  @property({ type: String, reflect: true })
  n: string | null = null;

  /** Plain-text title. Rich slot="title" content wins over this attribute (CDR-002). */
  @property({ type: String, reflect: true })
  title = "";

  /**
   * Visual state of the step.
   * CDR-001: finite 3-value style enum — drives color and weight, NOT domain vocabulary.
   */
  @property({ type: String, reflect: true })
  state: StepState = "pending";

  override willUpdate(): void {
    // Expose `has-n` attribute so the CSS can hide the disk when n is absent.
    if (this.n !== null && this.n !== "") {
      this.setAttribute("has-n", "");
    } else {
      this.removeAttribute("has-n");
    }

    // ARIA: aria-current="step" when active.
    if (this.state === "active") {
      this.setAttribute("aria-current", "step");
    } else {
      this.removeAttribute("aria-current");
    }
  }

  override render() {
    const isDone = this.state === "done";

    return html`
      <div class="ce-step">
        <div class="ce-step__disk" aria-hidden="true">
          ${isDone
            ? html`<span>&#10003;</span>` /* ✓ check mark */
            : this.n ?? ""}
        </div>
        <div class="ce-step__body">
          <div class="ce-step__title-row">
            <span class="ce-step__title">
              ${isDone
                ? html`<span class="sr-only">Completed:</span>`
                : nothing}
              <slot name="title">${this.title}</slot>
            </span>
            <span class="ce-step__meta">
              <slot name="meta"></slot>
            </span>
          </div>
          <div class="ce-step__desc">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }
}
