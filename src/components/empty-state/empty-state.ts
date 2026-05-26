import { html, css, nothing } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

export type EmptyStateSize = "sm" | "md" | "lg";
export type EmptyStateSeverity = "none" | "success" | "error" | "info" | "warning";

/** Default icon glyphs auto-derived from severity when `icon` is unset. */
const DEFAULT_ICONS: Record<Exclude<EmptyStateSeverity, "none">, string> = {
  success: "check-circle",
  error: "x-circle",
  info: "info",
  warning: "alert-triangle",
};

/**
 * `<ce-empty-state>` — standardised centred-panel for empty regions,
 * completion outcomes, and error states.
 *
 * Renders a centred column: optional icon badge or illustration slot,
 * title slot, body (default slot), an actions slot for CTA buttons, and
 * an optional collapsible details slot for technical detail (e.g., error
 * codes, stack traces).
 *
 * Use cases:
 *   - severity="none"     (default) — empty inbox, no results, onboarding
 *   - severity="success"            — order placed, account created
 *   - severity="error"              — service unavailable, action failed
 *   - severity="info"               — informational outcome
 *   - severity="warning"            — trial expiring, action required
 *
 * Attributes:
 *   icon      — short string or emoji rendered inside a circular badge.
 *               Auto-derived from severity when unset and severity != "none".
 *               Ignored when the `illustration` slot is filled.
 *   size      — "sm" | "md" (default) | "lg" — scales spacing and icon badge.
 *   severity  — "none" (default) | "success" | "error" | "info" | "warning" —
 *               adds tinted background + colored icon/title when not "none".
 *
 * Slots:
 *   illustration — custom illustration / graphic; overrides the icon badge.
 *   title        — heading content; caller controls heading level (h2, h3…).
 *   (default)    — description body text.
 *   actions      — call-to-action area (ce-button, ce-link, etc.).
 *   details      — optional collapsible technical detail rendered inside a
 *                  native <details> block below the actions row. Primarily
 *                  used with severity="error" for stack traces / error codes.
 *
 * A11y:
 *   role="status" is set on the host (see connectedCallback). The caller
 *   is responsible for providing a meaningful heading level in the title slot.
 *
 * Shadow DOM rationale:
 *   :host([size="sm|md|lg"]) and :host([severity="…"]) attribute selectors
 *   require shadow DOM to avoid specificity collisions with host-page rules
 *   on padding/font-size/background. The component follows ce-card's
 *   precedent (ADR-002 exception via createShadowRootWithStyles()).
 *
 * Icon badge rationale:
 *   ce-icon (the sibling component) does NOT have a `name` attribute — it is
 *   a slot-based wrapper for SVGs/glyphs, not an icon set. There is no way
 *   to map an icon-name string through ce-icon without shipping an icon set,
 *   which contradicts ADR-007. The icon attribute value is therefore rendered
 *   directly as text inside a circular styled badge. Callers wanting a proper
 *   SVG illustration should use the `illustration` slot instead.
 *
 * Migration note: `ce-result` was merged into `ce-empty-state` on 2026-05-23.
 * Old `<ce-result severity="success">…</ce-result>` becomes
 * `<ce-empty-state severity="success">…</ce-empty-state>`.
 */
export class CeEmptyState extends CecElement {
  static override styles = css`
    :host {
      display: block;
    }

    .ce-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: var(--ce-space-3);
      padding: var(--ce-space-6, 3rem) var(--ce-space-4);
      color: var(--ce-text);
    }

    /* Size variants */
    :host([size="sm"]) .ce-empty-state {
      gap: var(--ce-space-2);
      padding: var(--ce-space-4) var(--ce-space-3);
    }

    :host([size="lg"]) .ce-empty-state {
      gap: var(--ce-space-4);
      padding: var(--ce-space-8, 5rem) var(--ce-space-6, 3rem);
    }

    /* Icon badge */
    .ce-empty-state__icon-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      background: var(--ce-surface-raised, var(--ce-surface));
      border: 1px solid var(--ce-border-soft, var(--ce-border));
      font-size: var(--ce-text-lg, 1.25rem);
      line-height: 1;
      color: var(--ce-muted);
      flex-shrink: 0;
    }

    :host([size="sm"]) .ce-empty-state__icon-badge {
      width: 2rem;
      height: 2rem;
      font-size: var(--ce-text-md, 1rem);
    }

    :host([size="lg"]) .ce-empty-state__icon-badge {
      width: 4rem;
      height: 4rem;
      font-size: var(--ce-text-xl, 1.5rem);
    }

    /* ── Severity tints (former ce-result behavior) ───────────────── */
    /* severity="none" (default) leaves the panel unstyled — empty-state look. */
    :host([severity="success"]) .ce-empty-state {
      background: var(--ce-color-green-bg);
      border-radius: var(--ce-radius);
    }
    :host([severity="error"]) .ce-empty-state {
      background: var(--ce-color-red-bg);
      border-radius: var(--ce-radius);
    }
    :host([severity="info"]) .ce-empty-state {
      background: var(--ce-color-blue-bg);
      border-radius: var(--ce-radius);
    }
    :host([severity="warning"]) .ce-empty-state {
      background: var(--ce-color-amber-bg);
      border-radius: var(--ce-radius);
    }

    /* Severity-tinted icon badge: ditch the surface chrome, just color the glyph. */
    :host([severity="success"]) .ce-empty-state__icon-badge,
    :host([severity="error"]) .ce-empty-state__icon-badge,
    :host([severity="info"]) .ce-empty-state__icon-badge,
    :host([severity="warning"]) .ce-empty-state__icon-badge {
      background: transparent;
      border: none;
      font-size: 2.5rem;
      width: auto;
      height: auto;
    }
    :host([severity="success"]) .ce-empty-state__icon-badge { color: var(--ce-color-green); }
    :host([severity="error"])   .ce-empty-state__icon-badge { color: var(--ce-color-red);   }
    :host([severity="info"])    .ce-empty-state__icon-badge { color: var(--ce-color-blue);  }
    :host([severity="warning"]) .ce-empty-state__icon-badge { color: var(--ce-color-amber); }

    /* Severity-tinted title color (matches former ce-result behavior). */
    :host([severity="success"]) .ce-empty-state__title ::slotted(*) { color: var(--ce-color-green); }
    :host([severity="error"])   .ce-empty-state__title ::slotted(*) { color: var(--ce-color-red);   }
    :host([severity="info"])    .ce-empty-state__title ::slotted(*) { color: var(--ce-color-blue);  }
    :host([severity="warning"]) .ce-empty-state__title ::slotted(*) { color: var(--ce-color-amber); }

    /* ── Details slot (collapsible technical detail) ──────────────── */
    .ce-empty-state__details {
      width: 100%;
      max-width: 60ch;
      text-align: left;
    }
    .ce-empty-state__details summary {
      cursor: pointer;
      font-size: var(--ce-text-sm);
      color: var(--ce-muted);
      user-select: none;
      padding: var(--ce-space-2, 0.5rem) 0;
      list-style: none;
    }
    .ce-empty-state__details summary::-webkit-details-marker {
      display: none;
    }
    .ce-empty-state__details summary::before {
      content: "▶ ";
      font-size: 0.6em;
      vertical-align: middle;
    }
    .ce-empty-state__details[open] summary::before {
      content: "▼ ";
    }
    .ce-empty-state__details-body {
      padding: var(--ce-space-3, 0.75rem);
      background: var(--ce-surface);
      border: 1px solid var(--ce-border);
      border-radius: var(--ce-radius);
      font-size: var(--ce-text-sm);
      color: var(--ce-text);
      overflow-x: auto;
    }
    .ce-empty-state__details:not(:has(::slotted(*))) {
      display: none;
    }

    /* Illustration slot */
    .ce-empty-state__illustration {
      display: contents;
    }

    :host([size="sm"]) .ce-empty-state__illustration ::slotted(*) {
      max-width: 3rem;
      max-height: 3rem;
    }

    :host([size="lg"]) .ce-empty-state__illustration ::slotted(*) {
      max-width: 6rem;
      max-height: 6rem;
    }

    /* Title slot */
    .ce-empty-state__title {
      font-weight: 700;
      color: var(--ce-text);
    }

    .ce-empty-state__title ::slotted(*) {
      margin: 0;
      font-size: var(--ce-text-md, 1rem);
      font-weight: 700;
      color: var(--ce-text);
    }

    :host([size="sm"]) .ce-empty-state__title ::slotted(*) {
      font-size: var(--ce-text-sm, 0.875rem);
    }

    :host([size="lg"]) .ce-empty-state__title ::slotted(*) {
      font-size: var(--ce-text-lg, 1.25rem);
    }

    /* Body (default slot) */
    .ce-empty-state__body {
      color: var(--ce-muted);
      font-size: var(--ce-text-sm, 0.875rem);
      line-height: 1.5;
    }

    :host([size="sm"]) .ce-empty-state__body {
      font-size: var(--ce-text-xs, 0.75rem);
    }

    :host([size="lg"]) .ce-empty-state__body {
      font-size: var(--ce-text-md, 1rem);
    }

    /* Actions slot */
    .ce-empty-state__actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ce-space-2);
      justify-content: center;
    }

    /* Hide wrappers when their slot is empty (Baseline 2023 :has()). */
    .ce-empty-state__title:not(:has(::slotted(*))) {
      display: none;
    }

    .ce-empty-state__actions:not(:has(::slotted(*))) {
      display: none;
    }

    @media (prefers-reduced-motion: no-preference) {
      .ce-empty-state {
        animation: none;
      }
    }
  `;

  /** Shadow DOM: required for :host([size="…"]) selectors. */
  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  /** Short text or emoji rendered in the circular icon badge. */
  @property({ type: String, reflect: true })
  icon: string | null = null;

  /** Size variant — sm | md | lg. Default md. */
  @property({ type: String, reflect: true })
  size: EmptyStateSize = "md";

  /** Severity tint — none (default) | success | error | info | warning. */
  @property({ type: String, reflect: true })
  severity: EmptyStateSeverity = "none";

  override connectedCallback(): void {
    super.connectedCallback();
    // role="status" so screen readers announce when the empty state appears
    // dynamically (e.g., after a search returns no results).
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "status");
    }
  }

  override render() {
    // Detect whether the illustration slot has content so we can decide
    // whether to show the icon badge. We use querySelector to check at
    // render time; slot-based detection without slotchange listeners is
    // acceptable here because the component is static-first (CDR-004).
    const hasIllustration = this.querySelector('[slot="illustration"]') !== null;

    // Auto-derive an icon glyph from severity when icon attr is unset and
    // severity is one of the tinted variants. The user can always override
    // by setting the icon attribute explicitly.
    const effectiveIcon = this.icon
      ?? (this.severity !== "none" ? DEFAULT_ICONS[this.severity] : null);

    const showIconBadge = effectiveIcon && !hasIllustration;

    return html`
      <div class="ce-empty-state">
        ${hasIllustration
          ? html`<div class="ce-empty-state__illustration"><slot name="illustration"></slot></div>`
          : nothing}
        ${showIconBadge
          ? html`<div class="ce-empty-state__icon-badge" aria-hidden="true">${effectiveIcon}</div>`
          : nothing}
        <div class="ce-empty-state__title">
          <slot name="title"></slot>
        </div>
        <div class="ce-empty-state__body">
          <slot></slot>
        </div>
        <div class="ce-empty-state__actions">
          <slot name="actions"></slot>
        </div>
        <details class="ce-empty-state__details">
          <summary>Show details</summary>
          <div class="ce-empty-state__details-body">
            <slot name="details"></slot>
          </div>
        </details>
      </div>
    `;
  }
}
