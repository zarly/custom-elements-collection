import { html, css, nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-field>` — semantic wrapper that binds a label, help text, error text,
 * and any form control into one a11y-correct unit.
 *
 * Usage:
 *
 *   <ce-field label="Email" help="We never share it" required>
 *     <ce-input name="email" type="email"></ce-input>
 *   </ce-field>
 *
 *   <ce-field label="Password" error="At least 8 characters required" required>
 *     <ce-input name="password" type="password"></ce-input>
 *   </ce-field>
 *
 *   <ce-field>
 *     <span slot="label">Custom label</span>
 *     <span slot="help">Custom help with <code>inline code</code>.</span>
 *     <ce-input name="username"></ce-input>
 *   </ce-field>
 *
 * Attributes:
 *   label    — label text (overridden by slot="label")
 *   help     — help text (overridden by slot="help")
 *   error    — error text (overridden by slot="error"); also sets aria-invalid
 *   required — reflects `required` (or aria-required) onto the bound control
 *   for      — explicit id of the control to bind; if absent the first slotted
 *              child element is auto-discovered and assigned a generated id
 *
 * Slots:
 *   (default) — the form control
 *   label     — override label attr with rich content
 *   help      — override help attr with rich content
 *   error     — override error attr with rich content
 *
 * a11y wiring (see CONCEPT.md for the rationale):
 *   • label[for] → control id (generated if absent)
 *   • help text element id → control aria-describedby
 *   • error text element id → control aria-describedby, aria-invalid="true"
 *   • required reflects to control.required (native) or aria-required="true"
 */
export class CeField extends CecElement {
  static #idCounter = 0;

  static override styles = css`
    :host {
      display: block;
    }

    .ce-field__label {
      display: block;
      font-size: var(--ce-text-sm);
      font-weight: 600;
      color: var(--ce-text);
      margin-bottom: var(--ce-space-1);
    }

    .ce-field__label-required {
      color: var(--ce-color-red);
      margin-inline-start: 0.2em;
    }

    .ce-field__control {
      display: block;
    }

    .ce-field__help {
      display: block;
      margin-top: var(--ce-space-1);
      font-size: var(--ce-text-xs);
      color: var(--ce-muted);
    }

    .ce-field__error {
      display: block;
      margin-top: var(--ce-space-1);
      font-size: var(--ce-text-xs);
      color: var(--ce-color-red);
    }
  `;

  protected override createRenderRoot(): ShadowRoot {
    return this.createShadowRootWithStyles();
  }

  @property({ type: String }) label = "";
  @property({ type: String }) help = "";
  @property({ type: String }) error = "";
  @property({ type: Boolean, reflect: true }) required = false;

  /**
   * Explicit id of the control to bind. If absent, the first slotted child
   * element is discovered and assigned a generated id.
   */
  @property({ type: String, attribute: "for" }) controlId = "";

  /** Instance-level generated field id, e.g. "ce-field-3". */
  readonly #fieldId: string;

  /** The bound control element (resolved once in firstUpdated, re-validated). */
  #control: Element | null = null;

  constructor() {
    super();
    CeField.#idCounter += 1;
    this.#fieldId = `ce-field-${CeField.#idCounter}`;
  }

  // ──────────────────────────────────────────────────
  // Lifecycle
  // ──────────────────────────────────────────────────

  override firstUpdated(changed: PropertyValues<this>): void {
    super.firstUpdated(changed);
    this.#resolveControl();
    this.#applyA11y();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    // On subsequent updates, re-apply a11y wiring when relevant props change.
    if (
      changed.has("error") ||
      changed.has("help") ||
      changed.has("required") ||
      changed.has("controlId")
    ) {
      // Control may not be resolved yet on first willUpdate (before firstUpdated).
      // Guard: only update if we already have a control reference.
      if (this.#control) {
        this.#applyA11y();
      }
    }
  }

  // ──────────────────────────────────────────────────
  // Control resolution
  // ──────────────────────────────────────────────────

  /**
   * Find and bind the target control.
   *
   * Priority:
   *   1. If `for` attr is set, look for an element with that id that is a
   *      descendant of this ce-field.
   *   2. Otherwise take the first non-slot/non-template child element in light
   *      DOM (the slotted control stays in the host's light DOM even with shadow
   *      DOM rendering; `this.children` gives direct light-DOM children).
   */
  #resolveControl(): void {
    if (this.controlId) {
      // Use attribute selector to avoid needing CSS.escape (not available in
      // all test environments including JSDOM).
      const byId = this.querySelector(`[id="${this.controlId}"]`);
      this.#control = byId;
    } else {
      // First element child that is not a slot content placeholder
      this.#control = this.#firstControlChild();
    }
  }

  #firstControlChild(): Element | null {
    for (const child of Array.from(this.children)) {
      const tag = child.tagName.toLowerCase();
      // Skip elements that are slotted into named slots (label/help/error).
      const slotAttr = child.getAttribute("slot");
      if (slotAttr === "label" || slotAttr === "help" || slotAttr === "error") {
        continue;
      }
      // Skip template and style elements.
      if (tag === "template" || tag === "style") continue;
      return child;
    }
    return null;
  }

  // ──────────────────────────────────────────────────
  // a11y attribute wiring
  // ──────────────────────────────────────────────────

  /**
   * Apply id, aria-describedby, aria-invalid, and required/aria-required to
   * the bound control. Called after firstUpdated and whenever relevant props
   * change.
   *
   * The generated control id is `<fieldId>-control` so it is stable and
   * unique across multiple field instances on the same page.
   */
  #applyA11y(): void {
    const ctrl = this.#control;
    if (!ctrl) return;

    // 1. Assign an id to the control if it lacks one.
    if (!ctrl.id) {
      ctrl.id = `${this.#fieldId}-control`;
    }

    // 2. Compute aria-describedby parts.
    const describedByParts: string[] = [];
    if (this.help || this.#hasNamedSlot("help")) {
      describedByParts.push(`${this.#fieldId}-help`);
    }
    if (this.error || this.#hasNamedSlot("error")) {
      describedByParts.push(`${this.#fieldId}-error`);
    }

    if (describedByParts.length > 0) {
      ctrl.setAttribute("aria-describedby", describedByParts.join(" "));
    } else {
      ctrl.removeAttribute("aria-describedby");
    }

    // 3. aria-invalid when error is present.
    if (this.error || this.#hasNamedSlot("error")) {
      ctrl.setAttribute("aria-invalid", "true");
    } else {
      ctrl.removeAttribute("aria-invalid");
    }

    // 4. required — prefer native attribute for native controls, fall back to
    //    aria-required for custom elements that don't support the required IDL.
    if (this.required) {
      if ("required" in ctrl) {
        // Native form element — set the IDL property so validity works.
        (ctrl as HTMLInputElement).required = true;
      } else {
        ctrl.setAttribute("aria-required", "true");
      }
    } else {
      if ("required" in ctrl) {
        (ctrl as HTMLInputElement).required = false;
      } else {
        ctrl.removeAttribute("aria-required");
      }
    }
  }

  #hasNamedSlot(name: string): boolean {
    return !!this.querySelector(`[slot="${name}"]`);
  }

  // ──────────────────────────────────────────────────
  // Computed ids for shadow-side elements
  // ──────────────────────────────────────────────────

  get #helpId(): string {
    return `${this.#fieldId}-help`;
  }

  get #errorId(): string {
    return `${this.#fieldId}-error`;
  }

  /** The id to put on the <label> element's `for` attribute. */
  get #labelForId(): string {
    // If the user specified an explicit `for`, defer to that.
    if (this.controlId) return this.controlId;
    // Otherwise the generated control id.
    return `${this.#fieldId}-control`;
  }

  // ──────────────────────────────────────────────────
  // Slot-change handler — re-wire when light-DOM content changes
  // ──────────────────────────────────────────────────

  #onSlotChange(): void {
    this.#resolveControl();
    this.#applyA11y();
  }

  // ──────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────

  override render() {
    const hasLabel = this.label || this.#hasNamedSlot("label");
    const hasHelp = this.help || this.#hasNamedSlot("help");
    const hasError = this.error || this.#hasNamedSlot("error");

    return html`
      ${hasLabel
        ? html`
            <label class="ce-field__label" for=${this.#labelForId}>
              <slot name="label">${this.label}</slot>${this.required
                ? html`<span class="ce-field__label-required" aria-hidden="true"> *</span>`
                : nothing}
            </label>
          `
        : nothing}

      <div class="ce-field__control">
        <slot @slotchange=${this.#onSlotChange}></slot>
      </div>

      ${hasHelp && !hasError
        ? html`<span class="ce-field__help" id=${this.#helpId} role="note">
            <slot name="help">${this.help}</slot>
          </span>`
        : nothing}

      ${hasError
        ? html`<span class="ce-field__error" id=${this.#errorId} role="alert" aria-live="polite">
            <slot name="error">${this.error}</slot>
          </span>`
        : nothing}
    `;
  }
}
