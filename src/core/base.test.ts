import { describe, it, expect } from "vitest";
import { html } from "lit";
import { CecElement } from "./base.js";
import { defineOnce } from "./register.js";

class HelloEl extends CecElement {
  override render() {
    return html`<span class="hello">hi</span>`;
  }
}

const tag = "ce-test-base";
defineOnce(tag, HelloEl);

describe("CecElement", () => {
  it("renders into light DOM (no shadow root)", async () => {
    const el = document.createElement(tag);
    document.body.appendChild(el);
    await (el as HelloEl).updateComplete;
    expect(el.shadowRoot).toBeNull();
    expect(el.querySelector(".hello")?.textContent).toBe("hi");
    el.remove();
  });
});
