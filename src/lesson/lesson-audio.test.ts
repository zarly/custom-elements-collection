import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../core/index.js";
import { LessonAudio } from "./lesson-audio.js";

beforeAll(() => defineOnce("lesson-audio", LessonAudio));

describe("<lesson-audio>", () => {
  it("renders the play button", async () => {
    const el = document.createElement("lesson-audio") as LessonAudio;
    el.src = "/sounds/x.mp3";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("button")?.textContent?.trim()).toBe("🔊 Play");
    el.remove();
  });

  it("renders phonetic when set", async () => {
    const el = document.createElement("lesson-audio") as LessonAudio;
    el.src = "/x.mp3";
    el.phonetic = "/ə/";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".la-phonetic")?.textContent).toBe("/ə/");
    el.remove();
  });

  it("renders custom label", async () => {
    const el = document.createElement("lesson-audio") as LessonAudio;
    el.label = "Listen";
    el.src = "/x.mp3";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("button")?.textContent?.trim()).toBe("Listen");
    el.remove();
  });

  it("shows error when src is empty and play clicked", async () => {
    const el = document.createElement("lesson-audio") as LessonAudio;
    document.body.appendChild(el);
    await el.updateComplete;
    (el.shadowRoot!.querySelector("button") as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".la-error")?.textContent).toBe("no src");
    el.remove();
  });
});
