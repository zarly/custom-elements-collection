/**
 * Per-component docs data: richer than the public manifest.
 * Keyed by tag name. Fields:
 *   description   — short paragraph (the manifest's description is the sidebar line)
 *   syntax        — a single representative snippet (optional)
 *   properties[]  — { name, type, default?, description }
 *   examples[]    — { title, html }  (omitted for internal components on purpose)
 *
 * Important: every example is pure HTML with no <script>. Object/array props
 * are JSON-stringified inside double-quoted attributes. Single quotes are used
 * inside the JSON strings so the outer double quotes don't need escaping.
 */
export const DOCS = {
  "ce-shell": {
    description: "Page wrapper that clamps width, applies default padding, and anchors the theme root.",
    syntax: `<ce-shell width="wide"> ...page content... </ce-shell>`,
    properties: [
      { name: "width", type: "narrow | default | wide | full", default: "default", description: "Max-width container." },
      { name: "theme", type: "dark | light", default: "dark", description: "Active token bundle." },
    ],
    examples: [
      { title: "Default", html: `<ce-shell><h3>Shell</h3><p>Default 1200px wide.</p></ce-shell>` },
    ],
  },
  "ce-hero": {
    description: "Page header with kicker, title, lede, and an optional stats slot.",
    syntax: `<ce-hero kicker="Status" title="Title" lede="Supporting line."> <ce-kpi slot="stats" /> </ce-hero>`,
    properties: [
      { name: "kicker", type: "string", description: "Eyebrow text above the title." },
      { name: "title", type: "string", description: "Main heading." },
      { name: "lede", type: "string", description: "Supporting paragraph under the title." },
      { name: "flat", type: "boolean", default: "false", description: "Suppresses the radial gradient background." },
    ],
    examples: [
      {
        title: "With stats",
        html: `<ce-hero kicker="Release" title="v0.1" lede="31 framework-agnostic tags.">
  <ce-kpi slot="stats" value="31" label="Components" color="green"></ce-kpi>
  <ce-kpi slot="stats" value="218" label="Tests" color="blue"></ce-kpi>
  <ce-kpi slot="stats" value="~21KB" label="gzip" color="purple"></ce-kpi>
</ce-hero>`,
      },
    ],
  },
  "ce-section": {
    description: "Section block with optional number badge, heading, count chip, and body.",
    properties: [
      { name: "title", type: "string", description: "Section heading." },
      { name: "lede", type: "string", description: "Subtitle under the heading." },
      { name: "number", type: "string", description: "Number or symbol badge shown at the left." },
      { name: "count-label", type: "string", description: "Right-aligned count chip." },
    ],
    examples: [
      {
        title: "Numbered with count",
        html: `<ce-section number="1" title="Components" count-label="31 tags">
  Body content for the section.
</ce-section>`,
      },
    ],
  },
  "ce-grid": {
    description: "Responsive grid — fixed 2/3/4 columns or auto-fit with a minimum column width.",
    properties: [
      { name: "cols", type: "2 | 3 | 4", default: "3", description: "Fixed column count." },
      { name: "auto", type: "boolean", description: "Use repeat(auto-fit) instead of fixed cols." },
      { name: "min", type: "number", default: "240", description: "Min column width when auto-fit." },
      { name: "gap", type: "sm | md | lg", default: "md", description: "Gap scale." },
    ],
    examples: [
      {
        title: "Auto-fit, min 180px",
        html: `<ce-grid auto min="180" gap="sm">
  <ce-card compact>1</ce-card><ce-card compact>2</ce-card>
  <ce-card compact>3</ce-card><ce-card compact>4</ce-card>
</ce-grid>`,
      },
    ],
  },
  "ce-card": {
    description: "Surface with optional left-border accent, hover effect, and clickable behaviour.",
    properties: [
      { name: "accent", type: "green | red | amber | blue | purple | cyan", description: "Left-border color." },
      { name: "hoverable", type: "boolean", description: "Lifts on hover." },
      { name: "compact", type: "boolean", description: "Tighter padding." },
      { name: "clickable", type: "boolean", description: "role=button + Enter/Space activation." },
    ],
    examples: [
      {
        title: "Accent variants",
        html: `<ce-grid cols="3" gap="sm">
  <ce-card accent="green"><h4 slot="title">Pass</h4>All gates green.</ce-card>
  <ce-card accent="amber"><h4 slot="title">Watch</h4>Borderline metric.</ce-card>
  <ce-card accent="red"><h4 slot="title">Block</h4>Blocking issue.</ce-card>
</ce-grid>`,
      },
    ],
  },
  "ce-chip": {
    description: "Compact status pill with semantic color variants.",
    properties: [
      { name: "type", type: "neutral | green | red | amber | blue | purple | cyan", default: "neutral", description: "Color tone." },
      { name: "dot", type: "boolean", description: "Prepend a colored dot." },
      { name: "outlined", type: "boolean", description: "No fill, just a border." },
    ],
    examples: [
      {
        title: "Variants",
        html: `<ce-chip>Neutral</ce-chip>
<ce-chip type="green" dot>Live</ce-chip>
<ce-chip type="red" dot>Down</ce-chip>
<ce-chip type="amber">Warn</ce-chip>
<ce-chip type="blue">Info</ce-chip>
<ce-chip type="purple" outlined>Beta</ce-chip>`,
      },
    ],
  },
  "ce-table": {
    description: "Styled wrapper around a native &lt;table&gt;.",
    properties: [
      { name: "sticky", type: "boolean", description: "Header row stays at the top on scroll." },
      { name: "compact", type: "boolean", description: "Tighter cell padding." },
    ],
    examples: [
      {
        title: "Standard",
        html: `<ce-table>
  <table>
    <thead><tr><th>Tag</th><th class="num">Tests</th></tr></thead>
    <tbody>
      <tr><td>ce-card</td><td class="num">10</td></tr>
      <tr><td>ce-kpi</td><td class="num">6</td></tr>
    </tbody>
  </table>
</ce-table>`,
      },
    ],
  },
  "ce-callout": {
    description: "Tinted admonition box with semantic type variants.",
    properties: [
      { name: "type", type: "info | success | warn | danger | neutral", default: "info", description: "Color tone." },
      { name: "title", type: "string", description: "Bold title row." },
    ],
    examples: [
      {
        title: "Variants",
        html: `<ce-callout type="info" title="Heads up">Default info.</ce-callout>
<ce-callout type="success" title="Ready">All gates green.</ce-callout>
<ce-callout type="warn" title="Migrate">Run codemod first.</ce-callout>
<ce-callout type="danger" title="Breaking">Renames in v2.</ce-callout>`,
      },
    ],
  },
  "ce-details": {
    description: "Animated collapsible disclosure panel.",
    properties: [
      { name: "summary", type: "string", description: "Summary row shown when collapsed." },
      { name: "open", type: "boolean", description: "Whether the panel is expanded." },
    ],
    examples: [
      {
        title: "Default",
        html: `<ce-details summary="Why light DOM?">
  Because Mermaid, Chart.js, and markdown work inside regular slots.
</ce-details>`,
      },
    ],
  },
  "ce-toc": {
    description: "Table of contents. Entries are supplied as a JSON array on the `entries` attribute.",
    properties: [
      { name: "entries", type: "TocEntry[] (JSON attr)", description: "Array of { href, label }. JSON-stringified attribute OR JS property." },
      { name: "sticky", type: "boolean", description: "Sticks to the top of its scroll parent." },
      { name: "numbered", type: "boolean", description: "Show a monospace number beside each entry." },
    ],
    examples: [
      {
        title: "Numbered",
        html: `<ce-toc
  numbered
  entries='[{"href":"#a","label":"Alpha"},{"href":"#b","label":"Bravo"},{"href":"#c","label":"Charlie"}]'
></ce-toc>`,
      },
    ],
  },
  "ce-kpi": {
    description: "Single-stat KPI block with label, value, and optional delta/trend.",
    properties: [
      { name: "value", type: "string", description: "The primary figure." },
      { name: "label", type: "string", description: "Short label under the value." },
      { name: "delta", type: "string", description: "Change indicator (e.g. \"+12%\")." },
      { name: "color", type: "neutral | green | red | amber | blue | purple | cyan", default: "neutral", description: "Accent color." },
    ],
    examples: [
      {
        title: "Row of KPIs",
        html: `<ce-grid cols="3" gap="sm">
  <ce-kpi value="96%" label="Pass rate" color="green" delta="+3%"></ce-kpi>
  <ce-kpi value="4" label="Open bugs" color="amber"></ce-kpi>
  <ce-kpi value="0" label="Blockers" color="red"></ce-kpi>
</ce-grid>`,
      },
    ],
  },
  "ce-progress": {
    description: "Horizontal progress bar with semantic color.",
    properties: [
      { name: "value", type: "number", default: "0", description: "Current progress (0–100 when max=100)." },
      { name: "max", type: "number", default: "100", description: "Max value." },
      { name: "label", type: "string", description: "Inline label." },
      { name: "color", type: "green | red | amber | blue | purple", default: "blue", description: "Fill color." },
    ],
    examples: [
      {
        title: "Labelled bar",
        html: `<ce-progress value="72" label="Coverage" color="green"></ce-progress>`,
      },
    ],
  },
  "ce-bar-chart": {
    description: "Horizontal bar chart. Pass rows as a JSON array on the `data` attribute — no <script> needed.",
    properties: [
      { name: "data", type: "BarRow[] (JSON attr)", description: "Array of { label, value, meta?, color? }." },
      { name: "max", type: "number", description: "Max value (auto-detected if 0)." },
      { name: "color", type: "CecColor", default: "blue", description: "Default bar color." },
      { name: "label-width", type: "string", default: "180px", description: "Width of the left label column." },
      { name: "compact", type: "boolean", description: "Tighter rows." },
    ],
    examples: [
      {
        title: "Three bars from a JSON attribute",
        html: `<ce-bar-chart
  data='[{"label":"Hero","value":42,"color":"green"},{"label":"Kpi","value":27,"color":"blue"},{"label":"Card","value":14,"color":"amber"}]'
></ce-bar-chart>`,
      },
    ],
  },
  "ce-chart": {
    description: "Chart.js-backed chart. Pass `data` (and optional `options`) as JSON attributes.",
    properties: [
      { name: "type", type: "line | bar | radar | doughnut | pie", default: "line", description: "Chart.js chart kind." },
      { name: "data", type: "Chart.js data (JSON attr)", description: "Labels + datasets." },
      { name: "options", type: "Chart.js options (JSON attr)", description: "Optional Chart.js options object." },
    ],
    examples: [
      {
        title: "Bar chart from a JSON attribute",
        html: `<ce-chart
  type="bar"
  data='{"labels":["Mon","Tue","Wed","Thu"],"datasets":[{"label":"Signups","data":[4,9,7,12]}]}'
></ce-chart>`,
      },
    ],
  },
  "ce-heatmap": {
    description: "2D heatmap. `rows` + `cols` are string-array attributes; `data` is a number-of-number-arrays attribute.",
    properties: [
      { name: "rows", type: "string[] (JSON attr)", description: "Row labels (Y axis)." },
      { name: "cols", type: "string[] (JSON attr)", description: "Column labels (X axis)." },
      { name: "data", type: "number[][] (JSON attr)", description: "Grid values." },
      { name: "palette", type: "blue | green | amber | red | purple", default: "blue", description: "Color ramp." },
    ],
    examples: [
      {
        title: "Small grid",
        html: `<ce-heatmap
  rows='["A","B"]'
  cols='["Mon","Tue","Wed"]'
  data='[[1,3,7],[2,5,4]]'
  palette="green"
></ce-heatmap>`,
      },
    ],
  },
  "ce-verdict": {
    description: "Final-answer pill with icon — go / no-go / caution / info.",
    properties: [
      { name: "type", type: "go | no-go | caution | info", default: "info", description: "Verdict flavor." },
      { name: "title", type: "string", description: "Bold headline." },
      { name: "detail", type: "string", description: "Supporting sentence." },
    ],
    examples: [
      {
        title: "Go",
        html: `<ce-verdict type="go" title="Ship it" detail="All quality gates green."></ce-verdict>`,
      },
    ],
  },
  "ce-timeline": {
    description: "Vertical (or horizontal) timeline. Items are a JSON array on the `items` attribute.",
    properties: [
      { name: "items", type: "TimelineItem[] (JSON attr)", description: "Array of { title, meta?, description?, color?, icon? }." },
      { name: "orientation", type: "vertical | horizontal", default: "vertical", description: "Layout axis." },
    ],
    examples: [
      {
        title: "Three events",
        html: `<ce-timeline
  items='[{"title":"Kickoff","meta":"2026-04-01","description":"Plan approved."},{"title":"Alpha","meta":"2026-04-15","description":"Internal preview.","color":"blue"},{"title":"Release","meta":"2026-04-23","description":"v0.1 shipped.","color":"green"}]'
></ce-timeline>`,
      },
    ],
  },
  "ce-compare": {
    description: "Side-by-side comparison with before/after slots.",
    properties: [
      { name: "before-label", type: "string", default: "Before", description: "Heading over the left slot." },
      { name: "after-label", type: "string", default: "After", description: "Heading over the right slot." },
      { name: "arrow", type: "string", default: "→", description: "Separator glyph." },
    ],
    examples: [
      {
        title: "Before / after",
        html: `<ce-compare>
  <div slot="before"><strong>Before</strong><p>Manual CSS in every file.</p></div>
  <div slot="after"><strong>After</strong><p>One &lt;ce-card&gt; tag.</p></div>
</ce-compare>`,
      },
    ],
  },
  "ce-flow": {
    description: "Step-flow diagram. Steps are a JSON array on the `steps` attribute.",
    properties: [
      { name: "steps", type: "FlowStep[] (JSON attr)", description: "Array of { title, caption?, color? }." },
      { name: "arrow", type: "string", default: "→", description: "Separator glyph." },
      { name: "vertical", type: "boolean", description: "Flow top-to-bottom instead of left-to-right." },
    ],
    examples: [
      {
        title: "Pipeline",
        html: `<ce-flow
  steps='[{"title":"Input","caption":"raw data"},{"title":"Parse","caption":"structured","color":"blue"},{"title":"Render","caption":"HTML","color":"green"}]'
></ce-flow>`,
      },
    ],
  },
  "ce-decision-tree": {
    description: "Q + branches tree. Question is a string; branches is a JSON array on the `branches` attribute.",
    properties: [
      { name: "question", type: "string", description: "The top-level question." },
      { name: "branches", type: "DecisionBranch[] (JSON attr)", description: "Array of { label, kind?, result }." },
    ],
    examples: [
      {
        title: "Has tests?",
        html: `<ce-decision-tree
  question="Has tests?"
  branches='[{"label":"Yes","kind":"yes","result":"Ship"},{"label":"No","kind":"no","result":"Add tests first"}]'
></ce-decision-tree>`,
      },
    ],
  },
  "ce-example": {
    description: "Good / bad / neutral example block with a caption.",
    properties: [
      { name: "type", type: "good | bad | neutral", default: "neutral", description: "Tone." },
      { name: "caption", type: "string", description: "Label shown at the top." },
    ],
    examples: [
      {
        title: "Good vs bad",
        html: `<ce-example type="good" caption="Do">Clear label on every input.</ce-example>
<ce-example type="bad"  caption="Don't">Rely on placeholder as label.</ce-example>`,
      },
    ],
  },
  "ce-feature-card": {
    description: "Feature card with icon, title, description, and optional CTA.",
    properties: [
      { name: "icon", type: "string", description: "Emoji or short text used as a glyph." },
      { name: "title", type: "string", description: "Heading." },
      { name: "cta", type: "string", description: "Call-to-action label." },
      { name: "href", type: "string", description: "Link target for the CTA." },
      { name: "color", type: "neutral | green | red | amber | blue | purple | cyan", default: "neutral", description: "Accent." },
    ],
    examples: [
      {
        title: "Card",
        html: `<ce-feature-card icon="🎨" title="Tokens" color="cyan" cta="Learn more" href="#">
  One source of truth for color, space, type.
</ce-feature-card>`,
      },
    ],
  },
  "ce-persona": {
    description: "Persona card with name, role, avatar, and color accent. Put attributes in the default slot as a &lt;dl&gt;.",
    properties: [
      { name: "name", type: "string", description: "Persona name." },
      { name: "role", type: "string", description: "Role / title." },
      { name: "avatar", type: "string", description: "URL or emoji." },
      { name: "color", type: "CecColor", default: "neutral", description: "Accent color." },
    ],
    examples: [
      {
        title: "Persona",
        html: `<ce-persona name="Ada" role="Frontend engineer" avatar="👩‍💻" color="purple">
  <dl>
    <dt>Goal</dt><dd>Ship fast</dd>
    <dt>Pain</dt><dd>CSS drift</dd>
  </dl>
</ce-persona>`,
      },
    ],
  },
  "ce-code": {
    description: "Code block with a language label and optional copy button.",
    properties: [
      { name: "lang", type: "string", description: "Language label." },
      { name: "copy", type: "boolean", description: "Show a copy-to-clipboard button." },
    ],
    examples: [
      {
        title: "TypeScript",
        html: `<ce-code lang="ts" copy>
import "custom-elements-collection/auto";
</ce-code>`,
      },
    ],
  },
  "ce-filter-bar": {
    description: "Filter bar with chip-based single- or multi-select. Options via JSON attribute.",
    properties: [
      { name: "label", type: "string", description: "Optional label shown on the left." },
      { name: "options", type: "FilterOption[] (JSON attr)", description: "Array of { value, label, count? }." },
      { name: "value", type: "string", description: "Current value. Comma-separated when multiple." },
      { name: "multiple", type: "boolean", description: "Allow multi-select." },
    ],
    examples: [
      {
        title: "Three filters",
        html: `<ce-filter-bar
  label="Filter by"
  value="all"
  options='[{"value":"all","label":"All","count":31},{"value":"ui","label":"UI","count":25},{"value":"lesson","label":"Lesson","count":6}]'
></ce-filter-bar>`,
      },
    ],
  },
  "lesson-frame": {
    description: "Wrapper frame with progress indicator for a lesson sequence.",
    properties: [
      { name: "title", type: "string", description: "Lesson title." },
      { name: "meta", type: "string", description: "Meta line under the title." },
      { name: "progress", type: "number", default: "0", description: "0–100 percent." },
    ],
    examples: [
      {
        title: "Lesson shell",
        html: `<lesson-frame title="Lesson 1" meta="Beginner · 12 min" progress="35">
  Lesson content goes here.
</lesson-frame>`,
      },
    ],
  },
  "lesson-rule": {
    description: "Rule card: numbered rule with title, explanation, and examples.",
    properties: [
      { name: "number", type: "string", description: "Number shown in the badge." },
      { name: "title", type: "string", description: "Rule title." },
    ],
    examples: [
      {
        title: "Single rule",
        html: `<lesson-rule number="1" title="Use 'a' before consonant sounds">
  Write "a car", not "an car".
</lesson-rule>`,
      },
    ],
  },
  "lesson-gap": {
    description: "Fill-in-the-blank. Options as a JSON string array.",
    properties: [
      { name: "prompt", type: "string", description: "Sentence with ___ as the blank." },
      { name: "options", type: "string[] (JSON attr)", description: "Answer choices." },
      { name: "correct", type: "string", description: "The expected answer value." },
      { name: "explanation", type: "string", description: "Shown after answer is submitted." },
    ],
    examples: [
      {
        title: "Gap fill",
        html: `<lesson-gap
  prompt="I want ___ apple."
  options='["a","an","the"]'
  correct="an"
  explanation="Use 'an' before a vowel sound."
></lesson-gap>`,
      },
    ],
  },
  "lesson-quiz": {
    description: "Multiple-choice quiz with feedback and scoring. Options as a JSON string array.",
    properties: [
      { name: "question", type: "string", description: "Question text." },
      { name: "options", type: "string[] (JSON attr)", description: "Answer choices." },
      { name: "correct", type: "number", description: "Index of the correct choice." },
      { name: "explanation", type: "string", description: "Shown after an answer is selected." },
    ],
    examples: [
      {
        title: "Quiz",
        html: `<lesson-quiz
  question="Which tag wraps the whole page?"
  options='["ce-shell","ce-card","ce-grid"]'
  correct="0"
  explanation="ce-shell is the page-level wrapper."
></lesson-quiz>`,
      },
    ],
  },
  "lesson-quickfire": {
    description: "Timed rapid-fire round of short-answer prompts. Rounds as a JSON array.",
    properties: [
      { name: "rounds", type: "QuickfireRound[] (JSON attr)", description: "Array of { prompt, options }." },
      { name: "timer", type: "number", default: "8", description: "Seconds per round." },
    ],
    examples: [
      {
        title: "Quickfire",
        html: `<lesson-quickfire
  timer="6"
  rounds='[{"prompt":"2 + 2","options":["3","4","5"]},{"prompt":"5 * 3","options":["10","15","20"]}]'
></lesson-quickfire>`,
      },
    ],
  },
  "lesson-audio": {
    description: "Audio phrase button with phonetic label.",
    properties: [
      { name: "src", type: "string", description: "Audio file URL." },
      { name: "phonetic", type: "string", description: "Phonetic transcription shown below." },
      { name: "label", type: "string", default: "🔊 Play", description: "Button label." },
    ],
    examples: [
      {
        title: "Phrase",
        html: `<lesson-audio src="/placeholder.mp3" phonetic="/həˈloʊ/" label="🔊 Hello"></lesson-audio>`,
      },
    ],
  },

  // Internal — no examples on purpose.
  "ce-docs-layout": {
    description:
      "Two-pane documentation layout with a sticky header, a sticky sidebar, and a scrollable main area. This demo app is built from a single instance of this tag. Live examples are intentionally omitted because the surrounding chrome IS the example.",
    properties: [
      { name: "sidebar-width", type: "string", default: "260px", description: "CSS length for the left column." },
    ],
  },
  "ce-nav-list": {
    description:
      "Grouped anchor list for docs sidebars. Auto-groups items by their `group` field and highlights the one whose `href` matches `value`. Dispatches `ce-nav-select` on click. This demo's left sidebar is a live instance. Live examples omitted.",
    properties: [
      { name: "items", type: "NavItem[] (JSON attr)", description: "Array of { label, href, group?, tag? }." },
      { name: "value", type: "string", description: "The active href (for highlighting)." },
      { name: "title", type: "string", description: "Optional sidebar title." },
    ],
  },
};
