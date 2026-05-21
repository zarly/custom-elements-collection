import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeChatInput } from "./chat-input.js";

beforeAll(() => {
  defineOnce("ce-chat-input", CeChatInput);
});

// ---- helpers ----

function mount(innerHtml: string): HTMLDivElement {
  const host = document.createElement("div");
  host.innerHTML = innerHtml;
  document.body.appendChild(host);
  return host;
}

async function ready(el: CeChatInput): Promise<void> {
  await el.updateComplete;
}

function getTextarea(el: CeChatInput): HTMLTextAreaElement {
  return el.shadowRoot!.querySelector(".ce-chat-input__textarea") as HTMLTextAreaElement;
}

// ---- tests ----

describe("<ce-chat-input>", () => {
  // 1. Upgrades and renders shadow DOM with textarea + button
  it("upgrades and renders a shadow root containing a textarea and a send button", async () => {
    const host = mount(`<ce-chat-input></ce-chat-input>`);
    const el = host.querySelector("ce-chat-input") as CeChatInput;
    await ready(el);

    expect(el.shadowRoot).not.toBeNull();
    expect(getTextarea(el)).not.toBeNull();
    expect(el.shadowRoot!.querySelector(".ce-chat-input__btn--send")).not.toBeNull();

    host.remove();
  });

  // 2. Default placeholder appears in the textarea
  it("shows the default placeholder in the textarea", async () => {
    const host = mount(`<ce-chat-input></ce-chat-input>`);
    const el = host.querySelector("ce-chat-input") as CeChatInput;
    await ready(el);

    expect(getTextarea(el).placeholder).toBe("Type a message…");
    host.remove();
  });

  // 3. Custom placeholder reflects
  it("reflects a custom placeholder attribute to the textarea", async () => {
    const host = mount(`<ce-chat-input placeholder="Ask anything…"></ce-chat-input>`);
    const el = host.querySelector("ce-chat-input") as CeChatInput;
    await ready(el);

    expect(getTextarea(el).placeholder).toBe("Ask anything…");
    host.remove();
  });

  // 4. Typing updates value property AND fires ce-chat-input
  it("typing updates the value property and fires ce-chat-input with the new value", async () => {
    const host = mount(`<ce-chat-input></ce-chat-input>`);
    const el = host.querySelector("ce-chat-input") as CeChatInput;
    await ready(el);

    const inputEvents: { value: string }[] = [];
    el.addEventListener("ce-chat-input", (e) => {
      inputEvents.push((e as CustomEvent<{ value: string }>).detail);
    });

    const ta = getTextarea(el);
    ta.value = "hello";
    ta.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await ready(el);

    expect(el.value).toBe("hello");
    expect(inputEvents).toHaveLength(1);
    expect(inputEvents[0].value).toBe("hello");

    host.remove();
  });

  // 5. Enter (no Shift) on non-empty value fires ce-chat-submit once
  it("Enter on a non-empty value fires ce-chat-submit once with the value", async () => {
    const host = mount(`<ce-chat-input></ce-chat-input>`);
    const el = host.querySelector("ce-chat-input") as CeChatInput;
    await ready(el);

    el.value = "hello world";
    await ready(el);

    const submitted: { value: string }[] = [];
    el.addEventListener("ce-chat-submit", (e) => {
      submitted.push((e as CustomEvent<{ value: string }>).detail);
    });

    const ta = getTextarea(el);
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, composed: true }));

    expect(submitted).toHaveLength(1);
    expect(submitted[0].value).toBe("hello world");

    host.remove();
  });

  // 6. Enter on empty/whitespace-only value does NOT fire ce-chat-submit
  it("Enter on an empty value does NOT fire ce-chat-submit", async () => {
    const host = mount(`<ce-chat-input></ce-chat-input>`);
    const el = host.querySelector("ce-chat-input") as CeChatInput;
    await ready(el);

    let fired = 0;
    el.addEventListener("ce-chat-submit", () => fired++);

    const ta = getTextarea(el);
    // empty
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    // whitespace only
    el.value = "   ";
    await ready(el);
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(fired).toBe(0);

    host.remove();
  });

  // 7. Shift+Enter does NOT fire ce-chat-submit
  it("Shift+Enter does NOT fire ce-chat-submit", async () => {
    const host = mount(`<ce-chat-input></ce-chat-input>`);
    const el = host.querySelector("ce-chat-input") as CeChatInput;
    await ready(el);

    el.value = "hi";
    await ready(el);

    let fired = 0;
    el.addEventListener("ce-chat-submit", () => fired++);

    const ta = getTextarea(el);
    ta.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", shiftKey: true, bubbles: true })
    );

    expect(fired).toBe(0);

    host.remove();
  });

  // 8. busy=true: stop button present; Enter does not submit; stop button fires ce-chat-stop
  it("when busy=true, stop button fires ce-chat-stop and Enter does not submit", async () => {
    const host = mount(`<ce-chat-input busy></ce-chat-input>`);
    const el = host.querySelector("ce-chat-input") as CeChatInput;
    await ready(el);

    el.value = "hello";
    await ready(el);

    const submits: unknown[] = [];
    const stops: unknown[] = [];
    el.addEventListener("ce-chat-submit", () => submits.push(1));
    el.addEventListener("ce-chat-stop", () => stops.push(1));

    // Enter should not submit while busy
    const ta = getTextarea(el);
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(submits).toHaveLength(0);

    // Stop button should exist and fire ce-chat-stop
    const stopBtn = el.shadowRoot!.querySelector(".ce-chat-input__btn--stop") as HTMLButtonElement;
    expect(stopBtn).not.toBeNull();
    stopBtn.click();
    expect(stops).toHaveLength(1);

    // Send button should NOT exist when busy
    expect(el.shadowRoot!.querySelector(".ce-chat-input__btn--send")).toBeNull();

    host.remove();
  });

  // 9. Escape while busy fires ce-chat-stop
  it("Escape while busy fires ce-chat-stop", async () => {
    const host = mount(`<ce-chat-input busy></ce-chat-input>`);
    const el = host.querySelector("ce-chat-input") as CeChatInput;
    await ready(el);

    let stops = 0;
    el.addEventListener("ce-chat-stop", () => stops++);

    const ta = getTextarea(el);
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(stops).toBe(1);

    host.remove();
  });

  // 10. allowAttach=true: attach button present and fires ce-chat-attach
  it("when allow-attach is true, attach button fires ce-chat-attach", async () => {
    const host = mount(`<ce-chat-input allow-attach></ce-chat-input>`);
    const el = host.querySelector("ce-chat-input") as CeChatInput;
    await ready(el);

    let fired = 0;
    el.addEventListener("ce-chat-attach", () => fired++);

    const attachBtn = el.shadowRoot!.querySelector(
      ".ce-chat-input__btn--attach"
    ) as HTMLButtonElement;
    expect(attachBtn).not.toBeNull();
    attachBtn.click();
    expect(fired).toBe(1);

    host.remove();
  });

  // 11. allowAttach=false: attach button absent
  it("when allow-attach is false (default), attach button is absent", async () => {
    const host = mount(`<ce-chat-input></ce-chat-input>`);
    const el = host.querySelector("ce-chat-input") as CeChatInput;
    await ready(el);

    expect(el.shadowRoot!.querySelector(".ce-chat-input__btn--attach")).toBeNull();

    host.remove();
  });

  // 12. disabled=true: textarea has disabled attribute, Enter does not submit
  it("when disabled, textarea is disabled and Enter does not submit", async () => {
    const host = mount(`<ce-chat-input disabled></ce-chat-input>`);
    const el = host.querySelector("ce-chat-input") as CeChatInput;
    await ready(el);

    el.value = "hello";
    await ready(el);

    let fired = 0;
    el.addEventListener("ce-chat-submit", () => fired++);

    expect(getTextarea(el).disabled).toBe(true);

    const ta = getTextarea(el);
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(fired).toBe(0);

    host.remove();
  });

  // 13. submitOnEnter=false: Enter does not submit (property set via JS)
  it("when submitOnEnter=false, Enter does not fire ce-chat-submit", async () => {
    const host = mount(`<ce-chat-input></ce-chat-input>`);
    const el = host.querySelector("ce-chat-input") as CeChatInput;
    await ready(el);
    el.submitOnEnter = false;
    await ready(el);

    el.value = "hello";
    await ready(el);

    let fired = 0;
    el.addEventListener("ce-chat-submit", () => fired++);

    const ta = getTextarea(el);
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(fired).toBe(0);

    host.remove();
  });

  // 14. Named slots present in shadow DOM
  it("shadow DOM contains prefix, suffix, send-icon, and stop-icon slots", async () => {
    const host = mount(`<ce-chat-input busy allow-attach></ce-chat-input>`);
    const el = host.querySelector("ce-chat-input") as CeChatInput;
    await ready(el);

    const slotNames = Array.from(el.shadowRoot!.querySelectorAll("slot")).map(
      (s) => s.getAttribute("name") ?? "default"
    );
    expect(slotNames).toContain("prefix");
    expect(slotNames).toContain("suffix");
    expect(slotNames).toContain("attach-icon");
    expect(slotNames).toContain("stop-icon");

    host.remove();
  });

  // 15. Send button click fires ce-chat-submit
  it("clicking the send button fires ce-chat-submit", async () => {
    const host = mount(`<ce-chat-input></ce-chat-input>`);
    const el = host.querySelector("ce-chat-input") as CeChatInput;
    await ready(el);

    el.value = "send via button";
    await ready(el);

    const submitted: { value: string }[] = [];
    el.addEventListener("ce-chat-submit", (e) =>
      submitted.push((e as CustomEvent<{ value: string }>).detail)
    );

    const sendBtn = el.shadowRoot!.querySelector(".ce-chat-input__btn--send") as HTMLButtonElement;
    sendBtn.click();

    expect(submitted).toHaveLength(1);
    expect(submitted[0].value).toBe("send via button");

    host.remove();
  });
});
