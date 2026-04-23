import { describe, it, expect, beforeEach } from "vitest";
import { defineOnce } from "./register.js";

class FirstEl extends HTMLElement {}
class SecondEl extends HTMLElement {}

describe("defineOnce", () => {
  const tag = "ce-test-register-" + Math.random().toString(36).slice(2, 8);

  beforeEach(() => {
    // There's no public undefine; each test should use a fresh tag name.
  });

  it("registers a tag the first time", () => {
    defineOnce(tag, FirstEl);
    expect(customElements.get(tag)).toBe(FirstEl);
  });

  it("is a no-op on the second call, does not throw", () => {
    const alreadyRegistered = customElements.get(tag) ?? FirstEl;
    defineOnce(tag, SecondEl);
    // The originally registered ctor is preserved.
    expect(customElements.get(tag)).toBe(alreadyRegistered);
  });
});
