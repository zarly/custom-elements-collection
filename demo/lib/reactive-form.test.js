import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReactiveForm } from "./reactive-form.js";

const SAMPLE = {
  fields: {
    query: { type: "string", default: "" },
    groupBy: {
      type: "enum",
      values: ["group", "tier", "stability"],
      default: "group",
    },
    showDescription: { type: "bool", default: false },
    showStability: { type: "bool", default: true },
    stab: {
      type: "set",
      values: ["stable", "beta", "experimental", "deprecated"],
    },
    created: { type: "int", default: 0 },
  },
  hashParam: {
    query: "q",
    groupBy: "group",
    showDescription: "viewDesc",
    showStability: "viewStab",
    stab: "stab",
    created: "created",
  },
  localStorage: {
    showDescription: "test-view-desc",
    showStability: "test-view-stab",
  },
};

describe("ReactiveForm", () => {
  beforeEach(() => localStorage.clear());

  it("initialises every field to its declared default", () => {
    const f = new ReactiveForm(SAMPLE);
    expect(f.get("query")).toBe("");
    expect(f.get("groupBy")).toBe("group");
    expect(f.get("showDescription")).toBe(false);
    expect(f.get("showStability")).toBe(true);
    expect(f.get("stab")).toEqual(new Set());
    expect(f.get("created")).toBe(0);
  });

  it("set() returns true on change, false on no-op", () => {
    const f = new ReactiveForm(SAMPLE);
    expect(f.set("query", "card")).toBe(true);
    expect(f.set("query", "card")).toBe(false);
    expect(f.get("query")).toBe("card");
  });

  it("coerces enum to default when given an out-of-range value", () => {
    const f = new ReactiveForm(SAMPLE);
    f.set("groupBy", "unknown-axis");
    expect(f.get("groupBy")).toBe("group");
  });

  it("set on set fields drops values outside the allowed list", () => {
    const f = new ReactiveForm(SAMPLE);
    f.set("stab", ["stable", "rogue", "beta"]);
    expect(f.get("stab")).toEqual(new Set(["stable", "beta"]));
  });

  it("set on int fields coerces and clamps to non-negative integer", () => {
    const f = new ReactiveForm(SAMPLE);
    f.set("created", "14");
    expect(f.get("created")).toBe(14);
    f.set("created", -3);
    expect(f.get("created")).toBe(0);
    f.set("created", "abc");
    expect(f.get("created")).toBe(0);
  });

  it("subscribe fires the callback on every change and returns unsubscribe", () => {
    const f = new ReactiveForm(SAMPLE);
    const cb = vi.fn();
    const unsub = f.subscribe(cb);
    f.set("query", "x");
    f.set("query", "x"); // no-op
    f.set("query", "y");
    expect(cb).toHaveBeenCalledTimes(2);
    unsub();
    f.set("query", "z");
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("reset clears one field (or all) back to defaults", () => {
    const f = new ReactiveForm(SAMPLE);
    f.set("query", "hi");
    f.set("groupBy", "tier");
    f.set("stab", ["stable"]);
    f.reset("query");
    expect(f.get("query")).toBe("");
    expect(f.get("groupBy")).toBe("tier");
    f.reset();
    expect(f.get("groupBy")).toBe("group");
    expect(f.get("stab")).toEqual(new Set());
  });

  it("snapshot returns an immutable record (mutating it doesn't change form state)", () => {
    const f = new ReactiveForm(SAMPLE);
    f.set("stab", ["stable"]);
    const snap = f.snapshot();
    snap.stab.add("beta");
    expect(f.get("stab")).toEqual(new Set(["stable"]));
  });

  it("toHash omits defaults and writes sorted set values", () => {
    const f = new ReactiveForm(SAMPLE);
    expect(f.toHash()).toBe("");
    f.set("query", "card");
    f.set("groupBy", "tier");
    f.set("stab", ["experimental", "stable"]);
    f.set("created", 7);
    const qs = f.toHash();
    expect(qs).toContain("q=card");
    expect(qs).toContain("group=tier");
    expect(qs).toContain("stab=experimental%2Cstable");
    expect(qs).toContain("created=7");
  });

  it("hash round-trips state symmetrically", () => {
    const f = new ReactiveForm(SAMPLE);
    f.set("query", "foo");
    f.set("groupBy", "stability");
    f.set("stab", ["beta", "experimental"]);
    f.set("showDescription", true);
    f.set("created", 30);
    const qs = f.toHash();

    const g = new ReactiveForm(SAMPLE);
    g.fromHash(qs);
    expect(g.get("query")).toBe("foo");
    expect(g.get("groupBy")).toBe("stability");
    expect(g.get("stab")).toEqual(new Set(["beta", "experimental"]));
    expect(g.get("showDescription")).toBe(true);
    expect(g.get("created")).toBe(30);
  });

  it("fromHash resets fields that aren't present in the hash", () => {
    const f = new ReactiveForm(SAMPLE);
    f.set("query", "card");
    f.set("groupBy", "tier");
    f.fromHash("group=stability"); // query absent → reset to default
    expect(f.get("query")).toBe("");
    expect(f.get("groupBy")).toBe("stability");
  });

  it("loads from localStorage on construction", () => {
    localStorage.setItem("test-view-desc", "true");
    localStorage.setItem("test-view-stab", "false");
    const f = new ReactiveForm(SAMPLE);
    expect(f.get("showDescription")).toBe(true);
    expect(f.get("showStability")).toBe(false);
  });

  it("saves to localStorage on set for fields with an lsKey", () => {
    const f = new ReactiveForm(SAMPLE);
    f.set("showDescription", true);
    expect(localStorage.getItem("test-view-desc")).toBe("true");
    // `query` has no lsKey — no write
    f.set("query", "x");
    expect(localStorage.getItem("query")).toBeNull();
  });

  it("bindCheckbox two-way binds a checkbox to a bool field", () => {
    const f = new ReactiveForm(SAMPLE);
    const el = document.createElement("input");
    el.type = "checkbox";
    document.body.appendChild(el);

    const unbind = f.bindCheckbox("showDescription", el);
    expect(el.checked).toBe(false);

    el.checked = true;
    el.dispatchEvent(new Event("change"));
    expect(f.get("showDescription")).toBe(true);

    f.set("showDescription", false);
    expect(el.checked).toBe(false);

    unbind();
    el.checked = true;
    el.dispatchEvent(new Event("change"));
    expect(f.get("showDescription")).toBe(false);
    el.remove();
  });

  it("bindInput two-way binds an input to a string or int field", () => {
    const f = new ReactiveForm(SAMPLE);
    const el = document.createElement("input");
    document.body.appendChild(el);

    f.bindInput("query", el);
    el.value = "abc";
    el.dispatchEvent(new Event("input"));
    expect(f.get("query")).toBe("abc");

    f.set("query", "xyz");
    expect(el.value).toBe("xyz");
    el.remove();
  });

  it("bindRadioGroup two-way binds a set of radios to an enum field", () => {
    const f = new ReactiveForm(SAMPLE);
    const radios = ["group", "tier", "stability"].map((v) => {
      const el = document.createElement("input");
      el.type = "radio";
      el.name = "group";
      el.value = v;
      document.body.appendChild(el);
      return el;
    });
    f.bindRadioGroup("groupBy", radios);
    expect(radios[0].checked).toBe(true); // default "group"

    radios[1].checked = true;
    radios[1].dispatchEvent(new Event("change"));
    expect(f.get("groupBy")).toBe("tier");

    f.set("groupBy", "stability");
    expect(radios[2].checked).toBe(true);

    for (const r of radios) r.remove();
  });
});
