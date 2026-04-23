/**
 * Side-effect module: registers every ce-* and lesson-* tag from this package.
 *
 *   import "custom-elements-collection/auto";
 */

import { defineOnce } from "./core/index.js";

// UI — layout & primitives
import { CeShell } from "./components/shell.js";
import { CeHero } from "./components/hero.js";
import { CeSection } from "./components/section.js";
import { CeGrid } from "./components/grid.js";
import { CeCard } from "./components/card.js";
import { CeChip } from "./components/chip.js";
import { CeTable } from "./components/table.js";
import { CeCallout } from "./components/callout.js";
import { CeDetails } from "./components/details.js";
import { CeToc } from "./components/toc.js";

// UI — metrics & charts
import { CeKpi } from "./components/kpi.js";
import { CeProgress } from "./components/progress.js";
import { CeBarChart } from "./components/bar-chart.js";
import { CeChart } from "./components/chart.js";
import { CeHeatmap } from "./components/heatmap.js";

// UI — comparison & narrative
import { CeVerdict } from "./components/verdict.js";
import { CeTimeline } from "./components/timeline.js";
import { CeCompare } from "./components/compare.js";
import { CeFlow } from "./components/flow.js";
import { CeDecisionTree } from "./components/decision-tree.js";
import { CeExample } from "./components/example.js";
import { CeFeatureCard } from "./components/feature-card.js";
import { CePersona } from "./components/persona.js";
import { CeCode } from "./components/code.js";
import { CeFilterBar } from "./components/filter-bar.js";

// Internal — docs/layout primitives
import { CeDocsLayout } from "./components/docs-layout.js";
import { CeNavList } from "./components/nav-list.js";

// Lesson
import { LessonFrame } from "./lesson/lesson-frame.js";
import { LessonRule } from "./lesson/lesson-rule.js";
import { LessonGap } from "./lesson/lesson-gap.js";
import { LessonQuiz } from "./lesson/lesson-quiz.js";
import { LessonQuickfire } from "./lesson/lesson-quickfire.js";
import { LessonAudio } from "./lesson/lesson-audio.js";

export function defineAll(): void {
  // UI — layout & primitives
  defineOnce("ce-shell", CeShell);
  defineOnce("ce-hero", CeHero);
  defineOnce("ce-section", CeSection);
  defineOnce("ce-grid", CeGrid);
  defineOnce("ce-card", CeCard);
  defineOnce("ce-chip", CeChip);
  defineOnce("ce-table", CeTable);
  defineOnce("ce-callout", CeCallout);
  defineOnce("ce-details", CeDetails);
  defineOnce("ce-toc", CeToc);

  // UI — metrics & charts
  defineOnce("ce-kpi", CeKpi);
  defineOnce("ce-progress", CeProgress);
  defineOnce("ce-bar-chart", CeBarChart);
  defineOnce("ce-chart", CeChart);
  defineOnce("ce-heatmap", CeHeatmap);

  // UI — comparison & narrative
  defineOnce("ce-verdict", CeVerdict);
  defineOnce("ce-timeline", CeTimeline);
  defineOnce("ce-compare", CeCompare);
  defineOnce("ce-flow", CeFlow);
  defineOnce("ce-decision-tree", CeDecisionTree);
  defineOnce("ce-example", CeExample);
  defineOnce("ce-feature-card", CeFeatureCard);
  defineOnce("ce-persona", CePersona);
  defineOnce("ce-code", CeCode);
  defineOnce("ce-filter-bar", CeFilterBar);

  // Internal — docs/layout primitives
  defineOnce("ce-docs-layout", CeDocsLayout);
  defineOnce("ce-nav-list", CeNavList);

  // Lesson
  defineOnce("lesson-frame", LessonFrame);
  defineOnce("lesson-rule", LessonRule);
  defineOnce("lesson-gap", LessonGap);
  defineOnce("lesson-quiz", LessonQuiz);
  defineOnce("lesson-quickfire", LessonQuickfire);
  defineOnce("lesson-audio", LessonAudio);
}

defineAll();
