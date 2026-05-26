/**
 * Tests for the registry generator (ADR-007). Covers:
 *
 *   - tsTypeToJsonSchema: TS-type → JSON-Schema heuristic
 *   - slugifyGroup: group name → filename slug
 *   - projectComponent: meta → registry record (smoke test through ce-button)
 *   - buildRegistry end-to-end: writes full + filter views to a temp dist
 */
import { describe, it, expect } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import {
  buildRegistry,
  slugifyGroup,
  tsTypeToJsonSchema,
} from "../../scripts/generate-registry.js";
import type { Registry } from "./registry-types.js";

describe("slugifyGroup", () => {
  it("lowercases simple names", () => {
    expect(slugifyGroup("Feedback")).toBe("feedback");
    expect(slugifyGroup("Forms")).toBe("forms");
    expect(slugifyGroup("Dashboard")).toBe("dashboard");
  });

  it("replaces & with 'and'", () => {
    expect(slugifyGroup("Layout & primitives")).toBe("layout-and-primitives");
    expect(slugifyGroup("Metrics & charts")).toBe("metrics-and-charts");
    expect(slugifyGroup("Comparison & narrative")).toBe(
      "comparison-and-narrative"
    );
  });

  it("collapses runs of non-alphanumeric to a single dash", () => {
    expect(slugifyGroup("Chat surfaces")).toBe("chat-surfaces");
    expect(slugifyGroup("  Foo //  Bar  ")).toBe("foo-bar");
  });
});

describe("tsTypeToJsonSchema — primitives", () => {
  it("recognises string", () => {
    const r = tsTypeToJsonSchema("string");
    expect(r.type).toBe("string");
    expect(r["x-tsType"]).toBe("string");
  });
  it("recognises number", () => {
    expect(tsTypeToJsonSchema("number").type).toBe("number");
  });
  it("recognises boolean", () => {
    expect(tsTypeToJsonSchema("boolean").type).toBe("boolean");
  });
});

describe("tsTypeToJsonSchema — enums", () => {
  it("extracts string-literal unions", () => {
    const r = tsTypeToJsonSchema("'sm' | 'md' | 'lg'");
    expect(r.type).toBe("string");
    expect(r.enum).toEqual(["sm", "md", "lg"]);
  });
  it("extracts double-quoted literal unions", () => {
    const r = tsTypeToJsonSchema('"primary" | "secondary"');
    expect(r.type).toBe("string");
    expect(r.enum).toEqual(["primary", "secondary"]);
  });
});

describe("tsTypeToJsonSchema — nullable", () => {
  it("primitive | null becomes [type, null]", () => {
    const r = tsTypeToJsonSchema("string | null");
    expect(r.type).toEqual(["string", "null"]);
    expect(r["x-tsType"]).toBe("string | null");
  });
  it("alias | null falls back to string + null with x-tsType preserved", () => {
    const r = tsTypeToJsonSchema("CecColor | null");
    expect(r.type).toEqual(["string", "null"]);
    expect(r["x-tsType"]).toBe("CecColor | null");
  });
});

describe("tsTypeToJsonSchema — arrays", () => {
  it("recognises T[]", () => {
    const r = tsTypeToJsonSchema("string[]");
    expect(r.type).toBe("array");
    expect(r.items?.type).toBe("string");
    expect(r["x-tsType"]).toBe("string[]");
  });
  it("recognises Array<T>", () => {
    const r = tsTypeToJsonSchema("Array<number>");
    expect(r.type).toBe("array");
    expect(r.items?.type).toBe("number");
  });
});

describe("tsTypeToJsonSchema — fallback", () => {
  it("opaque alias falls back to string with x-tsType", () => {
    const r = tsTypeToJsonSchema("BarRow");
    expect(r.type).toBe("string");
    expect(r["x-tsType"]).toBe("BarRow");
  });
  it("complex shape falls back to string", () => {
    const r = tsTypeToJsonSchema("{ a: number; b: string }");
    // Fallback: not an enum, not an array — opaque object → string + x-tsType.
    expect(r.type).toBe("string");
    expect(r["x-tsType"]).toBe("{ a: number; b: string }");
  });
});

describe("buildRegistry — end-to-end", () => {
  it("writes full + filtered views with consistent component counts", async () => {
    const dist = await fs.mkdtemp(path.join(tmpdir(), "registry-test-"));
    try {
      const { written, total } = await buildRegistry({
        distDir: dist,
        generatedAt: "2026-05-06T00:00:00.000Z",
      });
      expect(total).toBeGreaterThan(50); // 72 today

      // Full registry sanity-check
      const fullRaw = await fs.readFile(
        path.join(dist, "registry.json"),
        "utf8"
      );
      const full = JSON.parse(fullRaw) as Registry;
      expect(full.schemaVersion).toBe(1);
      expect(full.library).toBe("custom-elements-collection");
      expect(full.filter).toBeNull();
      expect(full.components.length).toBe(total);
      // Components sorted by category then tag (ui first).
      expect(full.components[0].category).toBe("ui");

      // by-tier — 3 files; counts sum to total.
      const tiers = ["brick", "widget", "layout"] as const;
      let perTierSum = 0;
      for (const t of tiers) {
        const raw = await fs.readFile(
          path.join(dist, "registry", "by-tier", `${t}.json`),
          "utf8"
        );
        const reg = JSON.parse(raw) as Registry;
        expect(reg.filter).toEqual({ axis: "tier", value: t });
        expect(reg.components.every((c) => c.tier === t)).toBe(true);
        perTierSum += reg.components.length;
      }
      expect(perTierSum).toBe(total);

      // by-category — 3 files; all components in each match the axis.
      for (const cat of ["ui", "lesson", "internal"] as const) {
        const raw = await fs.readFile(
          path.join(dist, "registry", "by-category", `${cat}.json`),
          "utf8"
        );
        const reg = JSON.parse(raw) as Registry;
        expect(reg.filter).toEqual({ axis: "category", value: cat });
        expect(reg.components.every((c) => c.category === cat)).toBe(true);
      }

      // Per-tag — every component appears as a single-component file.
      for (const c of full.components) {
        const raw = await fs.readFile(
          path.join(dist, "registry", `${c.tag}.json`),
          "utf8"
        );
        const reg = JSON.parse(raw) as Registry;
        expect(reg.components.length).toBe(1);
        expect(reg.components[0].tag).toBe(c.tag);
        expect(reg.filter).toEqual({ axis: "tag", value: c.tag });
      }

      // Generator returns the list of files it wrote — at least 1 (full)
      // + 3 tiers + 10 groups + 3 categories + 72 per-tag = 89 expected.
      expect(written.length).toBeGreaterThanOrEqual(total + 16);
    } finally {
      await fs.rm(dist, { recursive: true, force: true });
    }
  });

  it("every component has a JSON Schema input_schema", async () => {
    const dist = await fs.mkdtemp(path.join(tmpdir(), "registry-test-"));
    try {
      await buildRegistry({ distDir: dist });
      const full = JSON.parse(
        await fs.readFile(path.join(dist, "registry.json"), "utf8")
      ) as Registry;
      for (const c of full.components) {
        expect(c.input_schema.type).toBe("object");
        expect(c.input_schema.additionalProperties).toBe(false);
        expect(Array.isArray(c.input_schema.required)).toBe(true);
        // Every required prop must exist in properties.
        for (const r of c.input_schema.required) {
          expect(c.input_schema.properties).toHaveProperty(r);
        }
      }
    } finally {
      await fs.rm(dist, { recursive: true, force: true });
    }
  });

  it("ce-button records emit clean enum schemas for variant + size", async () => {
    const dist = await fs.mkdtemp(path.join(tmpdir(), "registry-test-"));
    try {
      await buildRegistry({ distDir: dist });
      const full = JSON.parse(
        await fs.readFile(path.join(dist, "registry.json"), "utf8")
      ) as Registry;
      const button = full.components.find((c) => c.tag === "ce-button");
      expect(button).toBeDefined();
      const props = button!.input_schema.properties;
      expect(props.variant?.type).toBe("string");
      expect(props.variant?.enum).toContain("primary");
      expect(props.variant?.enum).toContain("destructive");
      expect(props.size?.enum).toEqual(["sm", "md", "lg", "icon"]);
      expect(props.disabled?.type).toBe("boolean");
    } finally {
      await fs.rm(dist, { recursive: true, force: true });
    }
  });
});
