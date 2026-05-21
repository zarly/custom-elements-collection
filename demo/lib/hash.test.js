import { describe, it, expect, beforeEach } from "vitest";
import { parseHash, writeHash, parseSetParam, parseDaysParam, stateQueryString } from "./hash.js";
import { VALID_STAB } from "./filters.js";

function setHash(h) {
  history.replaceState(null, "", `${location.pathname}${location.search}${h}`);
}

describe("parseSetParam", () => {
  it("returns an empty set on absent / blank", () => {
    const p = new URLSearchParams("");
    expect(parseSetParam(p, "stab", VALID_STAB)).toEqual(new Set());
  });
  it("splits by comma and drops out-of-allow-list values", () => {
    const p = new URLSearchParams("stab=stable,bogus,beta");
    expect(parseSetParam(p, "stab", VALID_STAB)).toEqual(
      new Set(["stable", "beta"]),
    );
  });
  it("with allowed=null accepts everything", () => {
    const p = new URLSearchParams("tags=foo,bar");
    expect(parseSetParam(p, "tags", null)).toEqual(new Set(["foo", "bar"]));
  });
});

describe("parseDaysParam", () => {
  it("returns 0 when absent", () => {
    expect(parseDaysParam(new URLSearchParams(""), "created")).toBe(0);
  });
  it("accepts NNd and bare integers", () => {
    expect(parseDaysParam(new URLSearchParams("created=7d"), "created")).toBe(7);
    expect(parseDaysParam(new URLSearchParams("created=14"), "created")).toBe(14);
  });
  it("rejects malformed input", () => {
    expect(parseDaysParam(new URLSearchParams("created=abc"), "created")).toBe(0);
    expect(parseDaysParam(new URLSearchParams("created=-3"), "created")).toBe(0);
  });
});

describe("parseHash + writeHash round-trip", () => {
  const suppressRef = { value: false };

  beforeEach(() => {
    setHash("");
    suppressRef.value = false;
  });

  it("parses a tag-only hash", () => {
    setHash("#/ce-card");
    expect(parseHash().tag).toBe("ce-card");
  });

  it("parses a full state hash", () => {
    setHash(
      "#/ce-card?q=chart&group=tier&sort=most-deps&stab=stable,beta&tier=brick&has=events&created=7d",
    );
    const s = parseHash();
    expect(s.tag).toBe("ce-card");
    expect(s.query).toBe("chart");
    expect(s.groupBy).toBe("tier");
    expect(s.sortBy).toBe("most-deps");
    expect(s.filters.stab).toEqual(new Set(["stable", "beta"]));
    expect(s.filters.tier).toEqual(new Set(["brick"]));
    expect(s.filters.has).toEqual(new Set(["events"]));
    expect(s.filters.created).toBe(7);
  });

  it("falls back to defaults on unknown group/sort values", () => {
    setHash("#?group=bogus&sort=junk");
    const s = parseHash();
    expect(s.groupBy).toBe("group");
    expect(s.sortBy).toBe("a-z");
  });

  it("writeHash + parseHash is symmetric", () => {
    const state = {
      tag: "ce-card",
      query: "foo",
      groupBy: "tier",
      sortBy: "z-a",
      filters: {
        stab: new Set(["stable"]),
        tier: new Set(),
        cat: new Set(),
        has: new Set(),
        tags: new Set(),
        created: 30,
        updated: 0,
      },
    };
    writeHash(state, suppressRef);
    expect(suppressRef.value).toBe(true);
    const parsed = parseHash();
    expect(parsed.tag).toBe("ce-card");
    expect(parsed.query).toBe("foo");
    expect(parsed.groupBy).toBe("tier");
    expect(parsed.sortBy).toBe("z-a");
    expect(parsed.filters.stab).toEqual(new Set(["stable"]));
    expect(parsed.filters.created).toBe(30);
    expect(parsed.filters.updated).toBe(0);
  });

  it("stateQueryString is empty for default state (so sidebar hrefs stay clean)", () => {
    const state = {
      tag: null,
      query: "",
      groupBy: "group",
      sortBy: "a-z",
      filters: {
        stab: new Set(),
        tier: new Set(),
        cat: new Set(),
        has: new Set(),
        tags: new Set(),
        created: 0,
        updated: 0,
      },
    };
    expect(stateQueryString(state)).toBe("");
  });

  it("stateQueryString reflects non-default fields (preserves sidebar-link state)", () => {
    const state = {
      tag: null,
      query: "card",
      groupBy: "tier",
      sortBy: "a-z",
      filters: {
        stab: new Set(["stable"]),
        tier: new Set(),
        cat: new Set(),
        has: new Set(),
        tags: new Set(),
        created: 7,
        updated: 0,
      },
    };
    const qs = stateQueryString(state);
    expect(qs).toContain("q=card");
    expect(qs).toContain("group=tier");
    expect(qs).toContain("stab=stable");
    expect(qs).toContain("created=7d");
  });

  it("omits defaults from the URL", () => {
    const state = {
      tag: null,
      query: "",
      groupBy: "group",
      sortBy: "a-z",
      filters: {
        stab: new Set(),
        tier: new Set(),
        cat: new Set(),
        has: new Set(),
        tags: new Set(),
        created: 0,
        updated: 0,
      },
    };
    writeHash(state, suppressRef);
    // No params except potentially the bare "#"
    expect(location.hash === "" || location.hash === "#").toBe(true);
  });
});
