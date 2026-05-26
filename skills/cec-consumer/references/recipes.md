# Recipes

Composition examples. Each one is copy-pasteable into a plain HTML file with the CDN setup; they assume `auto.js` and `tokens.css` are linked.

For the precise API of any tag in these recipes, open `src/<area>/<stem>/<stem>.meta.json` or run `node scripts/components.mjs --tag <tag>`.

---

## 1 — Release readiness dashboard

Use `ce-shell` for layout, `ce-hero` + `ce-kpi` for the headline, `ce-section` to group, `ce-bar-chart` and `ce-card` + `ce-progress` for module breakdown.

```html
<ce-shell theme="dark">
  <ce-hero kicker="Q4 2025" title="Release readiness">
    <ce-kpi slot="stats" value="148" label="Total tests"  color="blue"></ce-kpi>
    <ce-kpi slot="stats" value="142" label="Passing"      color="green" trend="+3"></ce-kpi>
    <ce-kpi slot="stats" value="6"   label="Failing"      color="red"></ce-kpi>
  </ce-hero>

  <ce-section title="Coverage by module" number="1">
    <ce-bar-chart data='[
      {"label":"auth",   "value":96, "meta":"96%", "color":"green"},
      {"label":"api",    "value":78, "meta":"78%", "color":"blue"},
      {"label":"legacy", "value":41, "meta":"41%", "color":"red"}
    ]'></ce-bar-chart>
  </ce-section>

  <ce-section title="Hot spots" number="2">
    <ce-grid cols="2" gap="md">
      <ce-card accent="green">
        <h3 slot="title">Auth module</h3>
        <ce-progress value="96" show-value color="green"></ce-progress>
      </ce-card>
      <ce-card accent="red">
        <h3 slot="title">Legacy module</h3>
        <ce-progress value="41" show-value color="red"></ce-progress>
      </ce-card>
    </ce-grid>
  </ce-section>

  <ce-callout type="warn" title="Action required">
    Legacy module needs 30+ new tests before ship.
  </ce-callout>
</ce-shell>
```

---

## 2 — Lesson page

```html
<lesson-frame title="Promises in JavaScript" meta="Intermediate · 10 min" progress="0">
  <lesson-rule number="1" title="Always handle rejection">
    Every <code>.then()</code> chain needs a <code>.catch()</code>.
  </lesson-rule>

  <lesson-quiz
    question="What state is a Promise in before it resolves?"
    options='["fulfilled","rejected","pending","settled"]'
    correct="2">
  </lesson-quiz>

  <lesson-quickfire timer="8" rounds='[
    {"prompt":"Promise.all fails if ___ promise rejects","options":["any","all","no","the last"],"correct":"any"}
  ]'></lesson-quickfire>
</lesson-frame>
```

`lesson-quiz` and `lesson-quickfire` track answers internally and emit completion events — wire them up via `addEventListener` if you want analytics.

---

## 3 — LLM chat surface

A streaming-token chat bubble with a cursor that disappears once the model finishes, plus a tool-call panel and per-message rating.

```html
<ce-chat-bubble role="assistant" author="Claude" model="opus-4.7" timestamp="2026-04-29T12:34:00Z">
  Here's a draft for your release notes:
  <ce-tool-call slot="footer" name="search_changelog" status="ok" duration-ms="312" open>
    <pre slot="args">{ "since": "v0.2.0" }</pre>
    <pre slot="result">[12 commits returned]</pre>
  </ce-tool-call>
  <ce-cursor slot="footer" shape="bar"></ce-cursor>

  <div slot="footer">
    <ce-copy-button for="reply-1" label="Copy"></ce-copy-button>
    <ce-rating mode="thumbs"></ce-rating>
    <ce-retry-button label="Try again"></ce-retry-button>
  </div>
</ce-chat-bubble>

<script>
  // Strip the cursor when streaming completes
  document.querySelector("ce-chat-bubble[role=assistant]")
    .addEventListener("ce-stream-done", (e) => e.target.querySelector("ce-cursor")?.remove());
</script>
```

Note: `ce-cursor` is just a visual indicator; the *event* signaling end-of-stream comes from your own LLM client. The components don't model the stream lifecycle — they only render.

---

## 4 — Feedback dashboard (no backend)

Wrap a list of items in `ce-feedback-sink` and the per-row controls persist to `localStorage` with zero server. User clicks Copy markdown / Download JSON to take their state to the next prompt.

```html
<ce-feedback-sink subject="naming-2026-04-29" transport="localstorage">
  <ce-section title="Candidate names">
    <ce-feedback-bar item="genrender" label="Generative render">
      <ce-rating mode="thumbs"></ce-rating>
      <ce-rating mode="stars" max="5"></ce-rating>
      <ce-bookmark></ce-bookmark>
      <ce-dismiss></ce-dismiss>
      <ce-comment placeholder="Why?"></ce-comment>
    </ce-feedback-bar>

    <ce-feedback-bar item="prosewave" label="Prosewave">
      <ce-rating mode="thumbs"></ce-rating>
      <ce-rating mode="stars" max="5"></ce-rating>
      <ce-bookmark></ce-bookmark>
      <ce-dismiss></ce-dismiss>
      <ce-comment placeholder="Why?"></ce-comment>
    </ce-feedback-bar>

    <!-- repeat per candidate -->
  </ce-section>

  <ce-feedback-summary show="counts avg top-liked"></ce-feedback-summary>
  <ce-feedback-export formats="markdown json clear"></ce-feedback-export>
</ce-feedback-sink>
```

To wire to a server instead, change `transport="http"` and set `endpoint="https://your-host/feedback"`. To gracefully degrade when the server is down, add `offline-fallback="localstorage"`.

A live working version of this recipe ships in the repo at `demo/feedback.html`.

---

## 5 — Docs site shell

`ce-docs-layout` + `ce-nav-list` is what powers the demo itself. Reuse it for any documentation page.

```html
<ce-docs-layout>
  <header slot="header" style="padding: 0 24px; line-height: 48px; font-weight: 700;">
    My Docs
  </header>

  <ce-nav-list slot="sidebar" title="Components"
    value="#ce-hero"
    items='[
      {"group":"Layout","label":"Shell","href":"#ce-shell","tag":"ce-shell"},
      {"group":"Layout","label":"Hero","href":"#ce-hero","tag":"ce-hero"}
    ]'>
  </ce-nav-list>

  <ce-section title="ce-hero">
    <ce-hero title="Page title" kicker="Section"></ce-hero>
  </ce-section>
</ce-docs-layout>
```

---

## Composition patterns worth remembering

- **`ce-grid` + `ce-card`** — the workhorse pattern for any "row of summaries" layout.
- **`ce-hero` + `<ce-kpi slot="stats">`** — landing metric strip.
- **`ce-callout` after `ce-section`** — call out a status / risk under a section.
- **`ce-feedback-sink` around dashboard** — turns any read-only summary into a feedback surface; the sink intercepts events from any descendant `ce-rating` / `ce-bookmark` / `ce-comment`.
- **`ce-chat-bubble` + slotted controls in `slot="footer"`** — keeps message metadata + post-reply actions in one element instead of fragmenting layout.
