/**
 * Named exports of every component class shipped in this package.
 *
 * Importing this module does NOT auto-register tags — call `defineAll()`,
 * import a per-tag entry (e.g. `custom-elements-collection/hero`), or import
 * the side-effect `./auto` module to register them.
 */

// UI — layout & primitives
export { CeShell } from "./components/shell.js";
export { CeHero } from "./components/hero.js";
export { CeSection } from "./components/section.js";
export { CeGrid } from "./components/grid.js";
export { CeCard } from "./components/card.js";
export { CeChip } from "./components/chip.js";
export { CeTable } from "./components/table.js";
export { CeCallout, type CalloutType } from "./components/callout.js";
export { CeDetails } from "./components/details.js";
export { CeToc, type TocEntry } from "./components/toc.js";

// UI — metrics & charts
export { CeKpi } from "./components/kpi.js";
export { CeProgress } from "./components/progress.js";
export { CeBarChart, type BarRow } from "./components/bar-chart.js";
export { CeChart } from "./components/chart.js";
export { CeHeatmap } from "./components/heatmap.js";

// UI — comparison & narrative
export { CeVerdict, type VerdictType } from "./components/verdict.js";
export { CeTimeline, type TimelineItem } from "./components/timeline.js";
export { CeCompare } from "./components/compare.js";
export { CeFlow, type FlowStep } from "./components/flow.js";
export { CeDecisionTree, type DecisionBranch } from "./components/decision-tree.js";
export { CeExample, type ExampleType } from "./components/example.js";
export { CeFeatureCard } from "./components/feature-card.js";
export { CePersona } from "./components/persona.js";
export { CeCode } from "./components/code.js";
export { CeFilterBar, type FilterOption } from "./components/filter-bar.js";

// Internal — layout primitives used by docs/demos. Still exported from the
// umbrella so consumers who want them can opt in, but the demo labels them
// "internal" so their role is clear.
export { CeDocsLayout } from "./components/docs-layout.js";
export { CeNavList, type NavItem } from "./components/nav-list.js";

// Lesson
export { LessonFrame } from "./lesson/lesson-frame.js";
export { LessonRule } from "./lesson/lesson-rule.js";
export { LessonGap } from "./lesson/lesson-gap.js";
export { LessonQuiz } from "./lesson/lesson-quiz.js";
export { LessonQuickfire } from "./lesson/lesson-quickfire.js";
export { LessonAudio } from "./lesson/lesson-audio.js";

// Core helpers (for consumers authoring their own components)
export { CecElement, defineOnce } from "./core/index.js";

// Manifest (machine-readable catalog + on-demand loader)
export {
  COMPONENTS,
  UI_COMPONENTS,
  LESSON_COMPONENTS,
  loadOnDemand,
  type Category,
  type ComponentEntry,
} from "./manifest.js";

// Bulk registration
export { defineAll } from "./auto.js";
