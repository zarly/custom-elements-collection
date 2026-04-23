/**
 * Register a custom element tag once. Subsequent calls for the same tag are
 * silent no-ops, so importing the same module twice (which can happen in
 * multi-bundle pages) doesn't throw.
 */
export function defineOnce(
  tagName: string,
  ctor: CustomElementConstructor
): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, ctor);
  }
}
