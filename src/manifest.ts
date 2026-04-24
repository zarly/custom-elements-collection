/**
 * Machine-readable catalog of every component shipped in this package.
 *
 * Consumers can use this for:
 *   - build-time discovery (which tags exist?)
 *   - docs generation
 *   - dynamic on-demand loading (see `loadOnDemand` below)
 */

export type Category = "ui" | "lesson" | "internal";

export interface ComponentEntry {
  /** Short subpath name (also the import specifier after the package name). */
  readonly name: string;
  /** Registered custom-element tag name. */
  readonly tag: string;
  /** Exported class name. */
  readonly className: string;
  /** Subpath import specifier (e.g. "custom-elements-collection/hero"). */
  readonly import: string;
  /** One-line human-readable description. */
  readonly description: string;
  readonly category: Category;
  /** Optional sub-group within the category (for sidebar sectioning). */
  readonly group?: string;
}

export const COMPONENTS: ReadonlyArray<ComponentEntry> = [
  // UI — layout & primitives
  { name: "shell",         tag: "ce-shell",         className: "CeShell",         import: "custom-elements-collection/shell",         category: "ui", group: "Layout & primitives", description: "Page shell wrapper with width clamp, padding, and theme root." },
  { name: "hero",          tag: "ce-hero",          className: "CeHero",          import: "custom-elements-collection/hero",          category: "ui", group: "Layout & primitives", description: "Page header with kicker, title, lede, and stats slot." },
  { name: "section",       tag: "ce-section",       className: "CeSection",       import: "custom-elements-collection/section",       category: "ui", group: "Layout & primitives", description: "Titled content section with optional eyebrow and divider." },
  { name: "grid",          tag: "ce-grid",          className: "CeGrid",          import: "custom-elements-collection/grid",          category: "ui", group: "Layout & primitives", description: "Responsive auto-fit grid with configurable min column width." },
  { name: "card",          tag: "ce-card",          className: "CeCard",          import: "custom-elements-collection/card",          category: "ui", group: "Layout & primitives", description: "Generic content card with title, body slot, and optional footer." },
  { name: "chip",          tag: "ce-chip",          className: "CeChip",          import: "custom-elements-collection/chip",          category: "ui", group: "Layout & primitives", description: "Inline status / tag chip with semantic color variants." },
  { name: "table",         tag: "ce-table",         className: "CeTable",         import: "custom-elements-collection/table",         category: "ui", group: "Layout & primitives", description: "Data table with optional caption, sticky header, and row hover." },
  { name: "callout",       tag: "ce-callout",       className: "CeCallout",       import: "custom-elements-collection/callout",       category: "ui", group: "Layout & primitives", description: "Info / warn / error / success callout block with icon." },
  { name: "details",       tag: "ce-details",       className: "CeDetails",       import: "custom-elements-collection/details",       category: "ui", group: "Layout & primitives", description: "Animated collapsible disclosure panel with summary." },
  { name: "toc",           tag: "ce-toc",           className: "CeToc",           import: "custom-elements-collection/toc",           category: "ui", group: "Layout & primitives", description: "Scroll-spy table of contents generated from section headings." },

  // UI — metrics & charts
  { name: "kpi",           tag: "ce-kpi",           className: "CeKpi",           import: "custom-elements-collection/kpi",           category: "ui", group: "Metrics & charts", description: "Single-stat KPI card with label, value, delta, and trend." },
  { name: "progress",      tag: "ce-progress",      className: "CeProgress",      import: "custom-elements-collection/progress",      category: "ui", group: "Metrics & charts", description: "Horizontal progress bar with label and semantic color." },
  { name: "bar-chart",     tag: "ce-bar-chart",     className: "CeBarChart",      import: "custom-elements-collection/bar-chart",     category: "ui", group: "Metrics & charts", description: "Minimal bar chart from an array of { label, value } rows." },
  { name: "chart",         tag: "ce-chart",         className: "CeChart",         import: "custom-elements-collection/chart",         category: "ui", group: "Metrics & charts", description: "Chart.js-powered chart (line / bar / pie / radar) with data prop." },
  { name: "heatmap",       tag: "ce-heatmap",       className: "CeHeatmap",       import: "custom-elements-collection/heatmap",       category: "ui", group: "Metrics & charts", description: "2D value heatmap with axis labels and legend." },

  // UI — comparison & narrative
  { name: "verdict",       tag: "ce-verdict",       className: "CeVerdict",       import: "custom-elements-collection/verdict",       category: "ui", group: "Comparison & narrative", description: "Final-answer pill: good / bad / neutral / warning verdict." },
  { name: "timeline",      tag: "ce-timeline",      className: "CeTimeline",      import: "custom-elements-collection/timeline",      category: "ui", group: "Comparison & narrative", description: "Vertical timeline from an array of events with dates." },
  { name: "compare",       tag: "ce-compare",       className: "CeCompare",       import: "custom-elements-collection/compare",       category: "ui", group: "Comparison & narrative", description: "Side-by-side comparison column with pros / cons slots." },
  { name: "flow",          tag: "ce-flow",          className: "CeFlow",          import: "custom-elements-collection/flow",          category: "ui", group: "Comparison & narrative", description: "Horizontal step flow diagram from an array of steps." },
  { name: "decision-tree", tag: "ce-decision-tree", className: "CeDecisionTree",  import: "custom-elements-collection/decision-tree", category: "ui", group: "Comparison & narrative", description: "Branching decision tree rendered from nested data." },
  { name: "example",       tag: "ce-example",       className: "CeExample",       import: "custom-elements-collection/example",       category: "ui", group: "Comparison & narrative", description: "Good / bad / neutral example block with caption." },
  { name: "feature-card",  tag: "ce-feature-card",  className: "CeFeatureCard",   import: "custom-elements-collection/feature-card",  category: "ui", group: "Comparison & narrative", description: "Feature card with icon, title, description, and CTA." },
  { name: "persona",       tag: "ce-persona",       className: "CePersona",       import: "custom-elements-collection/persona",       category: "ui", group: "Comparison & narrative", description: "Persona card with avatar, name, role, and attributes list." },
  { name: "code",          tag: "ce-code",          className: "CeCode",          import: "custom-elements-collection/code",          category: "ui", group: "Comparison & narrative", description: "Code block with language label and optional copy button." },
  { name: "filter-bar",    tag: "ce-filter-bar",    className: "CeFilterBar",     import: "custom-elements-collection/filter-bar",    category: "ui", group: "Comparison & narrative", description: "Filter bar with chip-based multi-select options." },

  // Lesson
  { name: "lesson-frame",     tag: "lesson-frame",     className: "LessonFrame",     import: "custom-elements-collection/lesson-frame",     category: "lesson", description: "Wrapper frame with progress indicator for lesson sequences." },
  { name: "lesson-rule",      tag: "lesson-rule",      className: "LessonRule",      import: "custom-elements-collection/lesson-rule",      category: "lesson", description: "Rule card: title + explanation + examples (good / bad)." },
  { name: "lesson-gap",       tag: "lesson-gap",       className: "LessonGap",       import: "custom-elements-collection/lesson-gap",       category: "lesson", description: "Fill-in-the-blank exercise with validation." },
  { name: "lesson-quiz",      tag: "lesson-quiz",      className: "LessonQuiz",      import: "custom-elements-collection/lesson-quiz",      category: "lesson", description: "Multiple-choice quiz with feedback and scoring." },
  { name: "lesson-quickfire", tag: "lesson-quickfire", className: "LessonQuickfire", import: "custom-elements-collection/lesson-quickfire", category: "lesson", description: "Timed rapid-fire round of short-answer prompts." },
  { name: "lesson-audio",     tag: "lesson-audio",     className: "LessonAudio",     import: "custom-elements-collection/lesson-audio",     category: "lesson", description: "Audio player with transcript and per-line highlight." },

  // Internal — layout primitives for docs/demos. No live example in the demo
  // catalog: the demo IS built with these components, so rendering one again
  // inside itself is noise. Description + properties only.
  { name: "docs-layout",      tag: "ce-docs-layout",      className: "CeDocsLayout",      import: "custom-elements-collection/docs-layout",      category: "internal", description: "Two-pane documentation layout (sidebar + main) with optional header." },
  { name: "nav-list",         tag: "ce-nav-list",         className: "CeNavList",         import: "custom-elements-collection/nav-list",         category: "internal", description: "Grouped anchor list for docs sidebars with active-item highlight." },
  { name: "theme-switcher",   tag: "ce-theme-switcher",   className: "CeThemeSwitcher",   import: "custom-elements-collection/theme-switcher",   category: "internal", description: "Compact cycler + dropdown for selecting a named value (e.g., theme). Left/right arrows step through options; clicking the label toggles the dropdown list." },
];

/**
 * Dynamic on-demand loader — resolves a subset of components by tag or name
 * via native ESM `import()`. Bundlers tree-shake the unused branches.
 *
 *   await loadOnDemand(["ce-hero", "ce-kpi"]);
 *   await loadOnDemand("lesson-rule");
 */
export async function loadOnDemand(
  selection: string | ReadonlyArray<string>
): Promise<void> {
  const wanted = typeof selection === "string" ? [selection] : selection;
  const set = new Set(wanted);
  const matched = COMPONENTS.filter(
    (c) => set.has(c.tag) || set.has(c.name)
  );
  await Promise.all(matched.map((c) => import(/* @vite-ignore */ c.import)));
}

/** Filter helper: all UI components. */
export const UI_COMPONENTS = COMPONENTS.filter((c) => c.category === "ui");

/** Filter helper: all lesson components. */
export const LESSON_COMPONENTS = COMPONENTS.filter((c) => c.category === "lesson");

/** Filter helper: internal / layout components. */
export const INTERNAL_COMPONENTS = COMPONENTS.filter((c) => c.category === "internal");
