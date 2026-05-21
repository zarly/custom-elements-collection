# ce-date-picker — design rationale

## 2026-05-20 — initial design

### Deviation: CDR-001 — type enum contains HTML spec terms

The `type` attribute accepts `"date" | "time" | "datetime-local" | "month" | "week"`. The CEC validator's `rule_no_vocab_in_enum` flags this because the values look like vocabulary.

**Why it's correct here:** CDR-001's own "When NOT to apply" clause excludes *"pure style enums where the words ARE the universal vocabulary — `direction='ltr|rtl'`, `size='sm|md|lg'`, `tier='brick|widget|layout'` — these are finite by spec, not vocabulary."* The date-picker's `type` is the canonical HTML5 input-type enum. Each value names a different native control variant; there is no team-specific phrasing or i18n burden because the words are HTML spec strings, not user-facing labels. The visible affordances (label, help, error, placeholder) all already live in dedicated attributes or slots.

The enum is finite (5 values), maps 1:1 to native `<input type=…>`, and will only grow when the HTML spec grows.

### Deviation: CDR-002 — `value` is a string attribute

CDR-002 says content-shaped values move to children. The validator flags `value: string`.

**Why it's correct here:** `value` on a form control is form data, not display content. The user submits the value, the page does not render it as rich markup. The CDR's "When NOT to apply" list covers this implicitly under "fixed-shape configuration strings". Reference component `ce-input` carries the same shape for the same reason.

### Why a native `<input type=date>` (not a custom calendar)

Two real options were weighed:

1. **Custom calendar UI** — full control over month grid, keyboard handling, locale formatting. Locks ~6 kB of date logic into every consumer bundle and re-implements `<input>` accessibility semantics.
2. **Wrap native input (chosen)** — delegates the popup, locale, keyboard, and screen-reader semantics to the browser. The trade-off is the popup look is browser-default; we accept that for the ~80% of consumers who just want a labelled date field.

If a future scenario needs a custom calendar (range picker overlay, embedded inline calendar) it can ship as a separate widget (`ce-calendar`, `ce-date-range`) without taking on `ce-date-picker`'s scope.
