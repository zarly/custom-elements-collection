import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeRating } from "./rating.js";

beforeAll(() => defineOnce("ce-rating", CeRating));

describe("<ce-rating> — thumbs mode (default)", () => {
  it("upgrades and renders shadow root", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-rating></ce-rating>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-rating") as CeRating;
    await el.updateComplete;
    expect(el.shadowRoot).not.toBeNull();
    expect(el.mode).toBe("thumbs");
    expect(el.value).toBeNull();
    host.remove();
  });

  it("renders two thumb buttons with aria-pressed", async () => {
    const el = document.createElement("ce-rating") as CeRating;
    document.body.appendChild(el);
    await el.updateComplete;
    const thumbs = el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".ce-rating__thumb");
    expect(thumbs.length).toBe(2);
    expect(thumbs[0].getAttribute("aria-pressed")).toBe("false");
    expect(thumbs[1].getAttribute("aria-pressed")).toBe("false");
    el.remove();
  });

  it("clicking thumbs-up sets value=up and emits ce-rating-change", async () => {
    const el = document.createElement("ce-rating") as CeRating;
    document.body.appendChild(el);
    await el.updateComplete;
    let detail: { mode: string; value: unknown; max: number } | null = null;
    el.addEventListener("ce-rating-change", (e) => {
      detail = (e as CustomEvent).detail;
    });
    const thumbs = el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".ce-rating__thumb");
    thumbs[0].click();
    await el.updateComplete;
    expect(el.value).toBe("up");
    expect(detail).toEqual({ mode: "thumbs", value: "up", max: 5 });
    el.remove();
  });

  it("clicking same thumb again clears to null", async () => {
    const el = document.createElement("ce-rating") as CeRating;
    document.body.appendChild(el);
    await el.updateComplete;
    const thumbs = el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".ce-rating__thumb");
    thumbs[0].click(); // up
    await el.updateComplete;
    thumbs[0].click(); // null
    await el.updateComplete;
    expect(el.value).toBeNull();
    el.remove();
  });

  it("readonly prevents click toggling", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-rating readonly></ce-rating>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-rating") as CeRating;
    await el.updateComplete;
    const thumbs = el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".ce-rating__thumb");
    thumbs[0].click();
    await el.updateComplete;
    expect(el.value).toBeNull();
    expect(el.getAttribute("aria-disabled")).toBe("true");
    host.remove();
  });
});

describe("<ce-rating> — stars mode", () => {
  it("renders max star buttons with role=radio", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-rating mode="stars" max="5"></ce-rating>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-rating") as CeRating;
    await el.updateComplete;
    expect(el.getAttribute("role")).toBe("radiogroup");
    const stars = el.shadowRoot!.querySelectorAll('[role="radio"]');
    expect(stars.length).toBe(5);
    host.remove();
  });

  it("clicking star N sets value=N and emits", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-rating mode="stars" max="5"></ce-rating>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-rating") as CeRating;
    await el.updateComplete;
    let detail: { mode: string; value: unknown; max: number } | null = null;
    el.addEventListener("ce-rating-change", (e) => {
      detail = (e as CustomEvent).detail;
    });
    const stars = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    stars[2].click(); // 3rd star
    await el.updateComplete;
    expect(el.value).toBe(3);
    expect(detail).toEqual({ mode: "stars", value: 3, max: 5 });
    host.remove();
  });

  it("clicking the current value clears to 0", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-rating mode="stars" max="5"></ce-rating>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-rating") as CeRating;
    await el.updateComplete;
    const stars = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    stars[2].click();
    await el.updateComplete;
    expect(el.value).toBe(3);
    stars[2].click();
    await el.updateComplete;
    expect(el.value).toBe(0);
    host.remove();
  });

  it("ArrowRight increments stars value, ArrowLeft decrements", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-rating mode="stars" max="5"></ce-rating>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-rating") as CeRating;
    await el.updateComplete;
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await el.updateComplete;
    expect(el.value).toBe(2);
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    await el.updateComplete;
    expect(el.value).toBe(1);
    host.remove();
  });

  it("Escape clears stars to 0", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-rating mode="stars" max="5"></ce-rating>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-rating") as CeRating;
    await el.updateComplete;
    const stars = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    stars[2].click();
    await el.updateComplete;
    expect(el.value).toBe(3);
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await el.updateComplete;
    expect(el.value).toBe(0);
    host.remove();
  });
});

describe("<ce-rating> — form association", () => {
  it("declares formAssociated = true", () => {
    expect((CeRating as unknown as { formAssociated: boolean }).formAssociated).toBe(true);
  });

  it("attribute reflection: mode + max + size", async () => {
    const host = document.createElement("div");
    host.innerHTML = `<ce-rating mode="stars" max="7" size="lg"></ce-rating>`;
    document.body.appendChild(host);
    const el = host.querySelector("ce-rating") as CeRating;
    await el.updateComplete;
    expect(el.getAttribute("mode")).toBe("stars");
    expect(el.getAttribute("max")).toBe("7");
    expect(el.getAttribute("size")).toBe("lg");
    host.remove();
  });
});
