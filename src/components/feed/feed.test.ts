import { describe, it, expect, beforeAll } from "vitest";
import { defineOnce } from "../../core/index.js";
import { CeFeed } from "./feed.js";
import { CeFeedEntry } from "./feed.js";

beforeAll(() => {
  defineOnce("ce-feed", CeFeed);
  defineOnce("ce-feed-entry", CeFeedEntry);
});

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

async function ready(el: Element): Promise<void> {
  await (el as CeFeed).updateComplete;
}

const flattenEntryTimes = (
  groups: Array<{ entries: Array<{ time: Date | null }> }>,
): number[] => groups.flatMap((g) => g.entries.map((e) => e.time?.getTime() ?? 0));

// ---------------------------------------------------------------------------
// Test 1: Upgrades and renders
// ---------------------------------------------------------------------------

describe("<ce-feed>", () => {
  it("upgrades and renders a shadow root", async () => {
    const host = mount(`<ce-feed></ce-feed>`);
    const feed = host.querySelector("ce-feed")!;
    await ready(feed);
    expect(feed.shadowRoot).not.toBeNull();
    host.remove();
  });

  // -------------------------------------------------------------------------
  // Test 2: With slot entries — renders all entries
  // -------------------------------------------------------------------------

  it("renders all slotted entries", async () => {
    const host = mount(`
      <ce-feed>
        <ce-feed-entry time="2026-05-23T10:00:00Z">Alpha</ce-feed-entry>
        <ce-feed-entry time="2026-05-23T08:00:00Z">Beta</ce-feed-entry>
        <ce-feed-entry time="2026-05-22T18:00:00Z">Gamma</ce-feed-entry>
      </ce-feed>
    `);
    const feed = host.querySelector("ce-feed") as CeFeed;
    await ready(feed);
    // Slotted children are tracked in the internal _slotEntries state after slotchange
    // @ts-expect-error — accessing private state for assertion
    const slotEntries = (feed as unknown as { _slotEntries: unknown[] })._slotEntries;
    expect(slotEntries.length).toBe(3);
    host.remove();
  });

  // -------------------------------------------------------------------------
  // Test 3: order="newest" sorts newest-first
  // -------------------------------------------------------------------------

  it("order='newest' lists newest entry first via slotted order", async () => {
    const host = mount(`
      <ce-feed order="newest">
        <ce-feed-entry time="2026-05-21T00:00:00Z">Oldest</ce-feed-entry>
        <ce-feed-entry time="2026-05-23T00:00:00Z">Newest</ce-feed-entry>
        <ce-feed-entry time="2026-05-22T00:00:00Z">Middle</ce-feed-entry>
      </ce-feed>
    `);
    const feed = host.querySelector("ce-feed") as CeFeed;
    await ready(feed);

    // Access the internal _groups to verify sort order
    // @ts-expect-error — private state accessed for test
    const groups = (feed as unknown as { _groups: Array<{ entries: Array<{ time: Date | null }> }> })._groups;
    expect(groups.length).toBeGreaterThan(0);
    const times = flattenEntryTimes(groups);
    // Newest first: times should be non-increasing
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeLessThanOrEqual(times[i - 1]);
    }
    host.remove();
  });

  // -------------------------------------------------------------------------
  // Test 4: order="oldest" sorts oldest-first
  // -------------------------------------------------------------------------

  it("order='oldest' lists oldest entry first", async () => {
    const host = mount(`
      <ce-feed order="oldest">
        <ce-feed-entry time="2026-05-23T00:00:00Z">Newest</ce-feed-entry>
        <ce-feed-entry time="2026-05-21T00:00:00Z">Oldest</ce-feed-entry>
        <ce-feed-entry time="2026-05-22T00:00:00Z">Middle</ce-feed-entry>
      </ce-feed>
    `);
    const feed = host.querySelector("ce-feed") as CeFeed;
    await ready(feed);

    // @ts-expect-error — accessing private state for test assertion
    const groups = (feed as unknown as { _groups: Array<{ entries: Array<{ time: Date | null }> }> })._groups;
    const times = flattenEntryTimes(groups);
    // Oldest first: times should be non-decreasing
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
    }
    host.remove();
  });

  // -------------------------------------------------------------------------
  // Test 5: group-by="day" produces group headers between distinct days
  // -------------------------------------------------------------------------

  it("group-by='day' produces separate groups for distinct days", async () => {
    const host = mount(`
      <ce-feed group-by="day">
        <ce-feed-entry time="2026-05-23T10:00:00Z">Day1 A</ce-feed-entry>
        <ce-feed-entry time="2026-05-23T08:00:00Z">Day1 B</ce-feed-entry>
        <ce-feed-entry time="2026-05-22T18:00:00Z">Day2</ce-feed-entry>
      </ce-feed>
    `);
    const feed = host.querySelector("ce-feed") as CeFeed;
    await ready(feed);

    // @ts-expect-error — accessing private state for test assertion
    const groups = (feed as unknown as { _groups: unknown[] })._groups;
    // Two days → two groups
    expect(groups.length).toBe(2);
    host.remove();
  });

  // -------------------------------------------------------------------------
  // Test 6: group-by="none" produces no group headers
  // -------------------------------------------------------------------------

  it("group-by='none' produces exactly one synthetic group with no label", async () => {
    const host = mount(`
      <ce-feed group-by="none">
        <ce-feed-entry time="2026-05-23T10:00:00Z">A</ce-feed-entry>
        <ce-feed-entry time="2026-05-22T10:00:00Z">B</ce-feed-entry>
      </ce-feed>
    `);
    const feed = host.querySelector("ce-feed") as CeFeed;
    await ready(feed);

    // @ts-expect-error — accessing private state for test assertion
    const groups = (feed as unknown as { _groups: Array<{ key: string; label: string }> })._groups;
    expect(groups.length).toBe(1);
    expect(groups[0].key).toBe("__none__");
    expect(groups[0].label).toBe("");

    // Shadow DOM should contain no .ce-feed__group headers
    const headers = feed.shadowRoot!.querySelectorAll(".ce-feed__group");
    expect(headers.length).toBe(0);
    host.remove();
  });

  // -------------------------------------------------------------------------
  // Test 7: dense reflects as attribute
  // -------------------------------------------------------------------------

  it("dense reflects as attribute on host", async () => {
    const host = mount(`<ce-feed dense></ce-feed>`);
    const feed = host.querySelector("ce-feed") as CeFeed;
    await ready(feed);
    expect(feed.hasAttribute("dense")).toBe(true);
    expect(feed.dense).toBe(true);
    host.remove();
  });

  // -------------------------------------------------------------------------
  // Test 8: ARIA roles — role="feed" on root, role="article" on entries
  // -------------------------------------------------------------------------

  it("has role='feed' on host and role='article' on each entry", async () => {
    const host = mount(`
      <ce-feed>
        <ce-feed-entry time="2026-05-23T10:00:00Z">Item</ce-feed-entry>
      </ce-feed>
    `);
    const feed = host.querySelector("ce-feed")!;
    const entry = host.querySelector("ce-feed-entry")!;
    await ready(feed);
    await (entry as CeFeedEntry).updateComplete;
    expect(feed.getAttribute("role")).toBe("feed");
    expect(entry.getAttribute("role")).toBe("article");
    host.remove();
  });

  // -------------------------------------------------------------------------
  // Test 9: group-by="month" groups entries across months
  // -------------------------------------------------------------------------

  it("group-by='month' produces separate groups for distinct months", async () => {
    const host = mount(`
      <ce-feed group-by="month" order="oldest">
        <ce-feed-entry time="2026-05-01T00:00:00Z">May entry</ce-feed-entry>
        <ce-feed-entry time="2026-06-15T00:00:00Z">June entry</ce-feed-entry>
      </ce-feed>
    `);
    const feed = host.querySelector("ce-feed") as CeFeed;
    await ready(feed);

    // @ts-expect-error — accessing private state for test assertion
    const groups = (feed as unknown as { _groups: unknown[] })._groups;
    expect(groups.length).toBe(2);
    host.remove();
  });

  // -------------------------------------------------------------------------
  // Test 10: data array path (CDR-005)
  // -------------------------------------------------------------------------

  it("accepts data array prop and renders entries from it", async () => {
    const host = mount(`<ce-feed></ce-feed>`);
    const feed = host.querySelector("ce-feed") as CeFeed;
    await ready(feed);

    feed.data = [
      { time: "2026-05-23T10:00:00Z", content: "From data prop" },
      { time: "2026-05-22T08:00:00Z", content: "Older entry" },
    ];
    await ready(feed);

    // @ts-expect-error — accessing private state for test assertion
    const groups = (feed as unknown as { _groups: Array<{ entries: unknown[] }> })._groups;
    const total = groups.reduce((n, g) => n + g.entries.length, 0);
    expect(total).toBe(2);
    host.remove();
  });
});
