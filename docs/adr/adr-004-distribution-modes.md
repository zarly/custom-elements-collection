# ADR-004 — Three supported distribution modes

**Status:** Accepted

## Context

Any HTML page that uses the library needs the runtime to be loaded somehow. The naive option — inlining the full bundle into every file — is the right choice for a single self-contained artifact but wasteful across a corpus:

- 100 files × 80 KB ≈ **8 MB** of duplicated runtime.
- A kit upgrade means regenerating every file.
- The browser cache cannot help: each file is a unique bytestream.

On the other hand, inlining is the **only** mode that survives being emailed, archived, or opened offline. It cannot be banned.

## Decision

Support three distribution modes, selected per artifact:

### 1. `inline` — fully self-contained

```html
<script>/* full minified IIFE */</script>
```

- ✅ Single file, shareable, archivable, works offline forever
- ❌ ~80 KB per file; a kit upgrade requires regenerating every file
- **Choose for:** one-off reports, emailable artifacts, anything that may leave the repo

### 2. `linked-local` — sibling script

```html
<script type="module" src="./custom-elements-collection.js"></script>
```

- ✅ ~60-byte per-file overhead; a kit upgrade is a single-file replace
- ✅ Still works offline (relative path)
- ❌ The HTML and the kit file must travel together (folder, zip, deploy)
- **Choose for:** multi-file reports, internal dashboards, project websites

### 3. `linked-cdn` — public CDN

```html
<script type="module"
        src="https://unpkg.com/custom-elements-collection/dist/auto.js"></script>
```

- ✅ Zero per-file overhead; the browser caches once across every page on the same pinned URL
- ✅ Zero hosting cost (unpkg / jsDelivr mirror npm releases)
- ✅ URL-pinned version → reproducible rendering
- ❌ Requires network; breaks in air-gapped environments
- ❌ External dependency (CDN uptime)
- **Choose for:** public pages, research artifacts, shared links, documentation sites

## Non-goals

- **Private CDN / own server** — deferred. A public CDN is the sensible starting point.
- **Split / lazy-loaded packs** — not worth the complexity at a ~80 KB bundle.
- **Import-map-based ESM CDN** — interesting but adds a layer; revisit after the package has a stable API.

## Authoring rules

- When CDN mode is selected, the URL MUST pin a version — never `@latest`.
- Offline artifacts (reports, archives, email attachments) always use `inline`.
- Multi-file deliverables default to `linked-local`.

## Cache story (CDN mode)

unpkg and jsDelivr serve pinned versions with `cache-control` headers measured in days and long-lived edge caching. Once a user's browser has fetched a given version from any page, every subsequent page pinned to the same URL loads from memory. A corpus benefits quadratically.
