import { html } from "lit";
import { CecElement } from "../../core/index.js";

/**
 * `<ce-data>` — generic JSON data carrier (CDR-5 advanced shape).
 *
 * A hidden primitive whose only job is to carry structured data as a
 * child of a consuming widget. Typical usage:
 *
 *   <ce-sparkline>
 *     <ce-data>{"values":[1,2,3,4,5]}</ce-data>
 *   </ce-sparkline>
 *
 * The consuming widget reads `:scope > ce-data` and parses its
 * `textContent` as JSON. The text is not displayed (the element is
 * hidden via inline style). This is the "data as child, not attribute"
 * pattern for cases where:
 *   - the payload is too big or escaping-heavy for an attribute,
 *   - multiple data fields are needed (values + labels + baselines),
 *   - the producing pipeline (LLM, server template) naturally emits
 *     JSON as inline child content.
 *
 * `.data` is a getter — it parses on access and returns `null` on
 * invalid JSON (with a console.warn).
 */
export class CeData extends CecElement {
  protected override createRenderRoot(): HTMLElement {
    // Light DOM. The element has no visible representation; the
    // consumer reads textContent. The `display: none` is enforced via
    // inline style so it survives in any host stylesheet context.
    this.style.display = "none";
    return this;
  }

  /**
   * Parsed JSON payload. Returns `null` if the text content is empty
   * or invalid JSON.
   */
  get data(): unknown {
    const text = (this.textContent ?? "").trim();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  override render() {
    // Render nothing — the element is a data carrier, not a visual one.
    return html``;
  }
}
