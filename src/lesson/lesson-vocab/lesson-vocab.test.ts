import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { LessonVocab } from "./lesson-vocab.js";

beforeAll(() => defineOnce("lesson-vocab", LessonVocab));

describe("<lesson-vocab>", () => {
  it("renders term in prominent heading", async () => {
    const el = document.createElement("lesson-vocab") as LessonVocab;
    el.term = "ephemeral";
    document.body.appendChild(el);
    await el.updateComplete;
    const term = el.shadowRoot!.querySelector(".lv-term");
    expect(term?.textContent).toBe("ephemeral");
    el.remove();
  });

  it("phonetic rendered in monospace class", async () => {
    const el = document.createElement("lesson-vocab") as LessonVocab;
    el.term = "word";
    el.phonetic = "/ˈwɜːd/";
    document.body.appendChild(el);
    await el.updateComplete;
    const phonetic = el.shadowRoot!.querySelector(".lv-phonetic");
    expect(phonetic?.textContent).toBe("/ˈwɜːd/");
    el.remove();
  });

  it("pos badge rendered when set", async () => {
    const el = document.createElement("lesson-vocab") as LessonVocab;
    el.term = "run";
    el.pos = "verb";
    document.body.appendChild(el);
    await el.updateComplete;
    const pos = el.shadowRoot!.querySelector(".lv-pos");
    expect(pos?.textContent?.trim()).toBe("verb");
    el.remove();
  });

  it("pos badge hidden when empty", async () => {
    const el = document.createElement("lesson-vocab") as LessonVocab;
    el.term = "run";
    document.body.appendChild(el);
    await el.updateComplete;
    const pos = el.shadowRoot!.querySelector(".lv-pos");
    expect(pos).toBeNull();
    el.remove();
  });

  it("level badge rendered when set", async () => {
    const el = document.createElement("lesson-vocab") as LessonVocab;
    el.term = "word";
    el.level = "C1";
    document.body.appendChild(el);
    await el.updateComplete;
    const level = el.shadowRoot!.querySelector(".lv-level");
    expect(level?.textContent?.trim()).toBe("C1");
    el.remove();
  });

  it("level badge hidden when empty", async () => {
    const el = document.createElement("lesson-vocab") as LessonVocab;
    el.term = "word";
    document.body.appendChild(el);
    await el.updateComplete;
    const level = el.shadowRoot!.querySelector(".lv-level");
    expect(level).toBeNull();
    el.remove();
  });

  it("definition rendered in body", async () => {
    const el = document.createElement("lesson-vocab") as LessonVocab;
    el.term = "word";
    el.definition = "A unit of language.";
    document.body.appendChild(el);
    await el.updateComplete;
    const def = el.shadowRoot!.querySelector(".lv-definition");
    expect(def?.textContent).toBe("A unit of language.");
    el.remove();
  });

  it("example rendered in italic class when set", async () => {
    const el = document.createElement("lesson-vocab") as LessonVocab;
    el.term = "word";
    el.example = "She chose her words carefully.";
    document.body.appendChild(el);
    await el.updateComplete;
    const ex = el.shadowRoot!.querySelector(".lv-example");
    expect(ex).not.toBeNull();
    el.remove();
  });

  it("example hidden when empty", async () => {
    const el = document.createElement("lesson-vocab") as LessonVocab;
    el.term = "word";
    document.body.appendChild(el);
    await el.updateComplete;
    const ex = el.shadowRoot!.querySelector(".lv-example");
    expect(ex).toBeNull();
    el.remove();
  });

  it("all props empty — no crashes", async () => {
    const el = document.createElement("lesson-vocab") as LessonVocab;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot).not.toBeNull();
    el.remove();
  });
});
