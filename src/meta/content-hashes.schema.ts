/**
 * Zod schema for `src/meta/content-hashes.json` — the global registry of
 * per-component source-file hashes used by `scripts/sync-meta-dates.ts`
 * to know when to bump a meta's `updated` date.
 *
 * See ADR-012 for the why; ADR-011 for the date-field contract this feeds.
 *
 * Hash scope (ratified M-1): ONLY `<stem>.ts`. Not examples, not tests,
 * not meta.json, not CONCEPT.md. This is what makes `updated` mean
 * "the component's code surface changed" rather than "anything in the
 * folder changed".
 */

import { z } from "zod";

const TAG_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/;
const SHA256_HEX = /^[a-f0-9]{64}$/;

export const ContentHashesSchema = z.object({
  schemaVersion: z.literal(1),
  /** Map of registered tag → SHA-256 hex digest of the component's `<stem>.ts`. */
  components: z.record(
    z.string().regex(TAG_PATTERN, "invalid custom-element tag"),
    z.string().regex(SHA256_HEX, "must be 64-char lowercase sha256 hex"),
  ),
});

export type ContentHashes = z.infer<typeof ContentHashesSchema>;
