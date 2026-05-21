import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeRankList } from "./rank-list.js";

beforeAll(() => {
  defineOnce("ce-rank-list", CeRankList);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeRankList).updateComplete;
}

describe("<ce-rank-list>", () => {
  it("renders one row per JSON item with #1, #2, #3 ranks", async () => {
    const host = mount(
      `<ce-rank-list items='[
        {"label":"Alpha"},
        {"label":"Bravo"},
        {"label":"Charlie"}
      ]'></ce-rank-list>`,
    );
    const rl = host.querySelector("ce-rank-list") as CeRankList;
    await ready(rl);
    const ranks = Array.from(rl.shadowRoot!.querySelectorAll(".rank")).map(
      (r) => r.textContent,
    );
    expect(ranks).toEqual(["#1", "#2", "#3"]);
    host.remove();
  });

  it("offsets ranks using the start attribute", async () => {
    const host = mount(
      `<ce-rank-list start="11" items='[
        {"label":"x"},
        {"label":"y"}
      ]'></ce-rank-list>`,
    );
    const rl = host.querySelector("ce-rank-list") as CeRankList;
    await ready(rl);
    const ranks = Array.from(rl.shadowRoot!.querySelectorAll(".rank")).map(
      (r) => r.textContent,
    );
    expect(ranks).toEqual(["#11", "#12"]);
    host.remove();
  });

  it("renders a score column when score is provided", async () => {
    const host = mount(
      `<ce-rank-list items='[{"label":"Alpha","score":9.2}]'></ce-rank-list>`,
    );
    const rl = host.querySelector("ce-rank-list") as CeRankList;
    await ready(rl);
    expect(rl.shadowRoot!.querySelector(".score")!.textContent).toContain("9.2");
    host.remove();
  });

  it("renders an up delta in green and down delta in red", async () => {
    const host = mount(
      `<ce-rank-list items='[
        {"label":"a","delta":2},
        {"label":"b","delta":-1},
        {"label":"c","delta":0}
      ]'></ce-rank-list>`,
    );
    const rl = host.querySelector("ce-rank-list") as CeRankList;
    await ready(rl);
    const deltas = rl.shadowRoot!.querySelectorAll(".delta");
    expect(deltas[0].getAttribute("data-dir")).toBe("up");
    expect(deltas[1].getAttribute("data-dir")).toBe("down");
    expect(deltas[2].getAttribute("data-dir")).toBe("even");
    expect(deltas[0].textContent).toContain("▲");
    expect(deltas[1].textContent).toContain("▼");
    host.remove();
  });

  it("accepts string deltas with a leading + or - sign", async () => {
    const host = mount(
      `<ce-rank-list items='[
        {"label":"a","delta":"+3"},
        {"label":"b","delta":"-2"}
      ]'></ce-rank-list>`,
    );
    const rl = host.querySelector("ce-rank-list") as CeRankList;
    await ready(rl);
    const deltas = rl.shadowRoot!.querySelectorAll(".delta");
    expect(deltas[0].getAttribute("data-dir")).toBe("up");
    expect(deltas[1].getAttribute("data-dir")).toBe("down");
    host.remove();
  });

  it("renders the hint as a secondary line", async () => {
    const host = mount(
      `<ce-rank-list items='[{"label":"Alpha","hint":"Team APAC"}]'></ce-rank-list>`,
    );
    const rl = host.querySelector("ce-rank-list") as CeRankList;
    await ready(rl);
    expect(rl.shadowRoot!.querySelector(".hint")!.textContent).toContain("Team APAC");
    host.remove();
  });

  it("reflects flat attribute", async () => {
    const host = mount(`<ce-rank-list flat items='[{"label":"x"}]'></ce-rank-list>`);
    const rl = host.querySelector("ce-rank-list") as CeRankList;
    await ready(rl);
    expect(rl.hasAttribute("flat")).toBe(true);
    host.remove();
  });

  it("falls back to slotted <li> children when items is empty (CDR-005)", async () => {
    const host = mount(`
      <ce-rank-list>
        <li>First place finisher</li>
        <li>Runner-up</li>
        <li>Third</li>
      </ce-rank-list>
    `);
    const rl = host.querySelector("ce-rank-list") as CeRankList;
    await ready(rl);
    expect(rl.shadowRoot!.querySelector("slot")).not.toBeNull();
    expect(rl.children.length).toBe(3);
    host.remove();
  });
});
