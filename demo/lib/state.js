/**
 * Demo navigation state (Stage 2 of the demo-navigation roadmap).
 * All four axes round-trip through the URL hash.
 *   query     — substring search across IndexRecord.searchHaystack
 *   groupBy   — sidebar section axis: group | tier | stability | category | createdMonth | alpha
 *   sortBy    — order within each section: a-z | z-a | recent-updated | recent-created | most-deps | least-deps
 *   tag       — currently-active component (drives the right pane); unchanged from before
 *   view      — per-row display options; synced from ReactiveForm; persisted to localStorage
 */
export const STATE = {
  query: "",
  groupBy: "group",
  sortBy: "a-z",
  tag: null,
  filters: {
    stab: new Set(),       // stability values; empty = any
    tier: new Set(),       // tier values
    cat: new Set(),        // category values
    has: new Set(),        // capability flags: events|slots|cssVars|globalDeps|sideEffects
    tags: new Set(),       // free-form tags (excluding first/canonical group)
    created: 0,            // days; 0 = any
    updated: 0,            // days; 0 = any
  },
  view: {
    showDescription: false,
    showUpdated:     false,
    showCreated:     false,
    showStability:   true,
  },
};
