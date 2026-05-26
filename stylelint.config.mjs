/**
 * Stylelint config for `custom-elements-collection`.
 *
 * Targets `css`` template literals embedded in `src/**\/*.ts` (via postcss-lit)
 * and the standalone token CSS files under `src/tokens/`.
 *
 * Rule selection follows three principles:
 *
 * 1. Catch real bugs (unknown properties, invalid hex, duplicate selectors,
 *    `!important` without justification, `@import` at runtime).
 * 2. Enforce identity markers (ADR-003: no hex/named colors in components —
 *    use `--ce-*` tokens; ADR-001: no runtime CSS deps).
 * 3. Stay silent on cosmetic spacing inside `css`` template literals — the
 *    template-literal indentation is the author's, not Stylelint's job.
 *
 * Override surface: list per-file exemptions under `overrides`. Token files
 * legitimately define hex values; component test files are excluded entirely.
 */

/** @type {import('stylelint').Config} */
export default {
  extends: ["stylelint-config-standard"],
  // Default parser is plain PostCSS — applied to standalone `*.css` files
  // (tokens, theme bundles). The `postcss-lit` parser is opted into per-file
  // via the override below for `*.ts` (extracts `css\`\`` template literals).

  rules: {
    // ── ADR-003: components reference --ce-* tokens; no inline color values ──
    "color-no-hex": [true, { message: "Use --ce-color-* tokens, not hex values (ADR-003)." }],
    "color-no-invalid-hex": true,

    // ── ADR-001: no runtime CSS deps ─────────────────────────────────────────
    "at-rule-disallowed-list": [
      ["import"],
      { message: "No @import in component CSS — runtime CSS deps forbidden (ADR-001)." },
    ],

    // ── Bug-catchers worth keeping (catch typos and dead patterns) ───────────
    "property-no-unknown": true,
    "unit-no-unknown": true,
    "function-no-unknown": true,
    "no-duplicate-selectors": true,
    "no-invalid-double-slash-comments": true,
    "block-no-empty": true,
    "comment-no-empty": true,
    "declaration-block-no-duplicate-properties": [
      true,
      { ignore: ["consecutive-duplicates-with-different-values"] },
    ],

    // ── Web-component selector discipline (Shadow DOM + light-DOM friendly) ──
    "selector-max-id": 0,
    "selector-pseudo-element-no-unknown": [
      true,
      { ignorePseudoElements: ["slotted"] },
    ],
    "selector-pseudo-class-no-unknown": [
      true,
      { ignorePseudoClasses: ["host", "host-context", "defined"] },
    ],
    "declaration-no-important": [
      true,
      { message: "Avoid !important; if truly required, disable per-line with a reason." },
    ],

    // ── Pragmatics for Lit `css`` template literals ──────────────────────────
    // postcss-lit can't fully see leading whitespace of a tagged template;
    // cosmetic spacing rules generate noise without catching real bugs.
    "rule-empty-line-before": null,
    "comment-empty-line-before": null,
    "declaration-empty-line-before": null,
    "custom-property-empty-line-before": null,
    "at-rule-empty-line-before": null,
    "no-empty-source": null,
    "no-descending-specificity": null, // too noisy in small per-host blocks
    // Lit components often pack a small attribute-selector override on one line
    // (e.g. `:host([size="sm"]) .more { min-width: 24px; height: 24px; font-size: 10px; }`).
    // Allow up to 4 declarations on a single line; bump if a real case needs more.
    "declaration-block-single-line-max-declarations": 4,

    // ── Project conventions (deliberately not policed) ───────────────────────
    "selector-class-pattern": null,    // BEM `.ce-card__title` is canonical
    "custom-property-pattern": null,   // --ce-* is the project token convention
    "keyframes-name-pattern": null,
    "color-named": null,               // `transparent`, `currentcolor` are valid keywords
    "value-keyword-case": null,
    "alpha-value-notation": null,      // both `0.5` and `50%` acceptable
    "color-function-notation": null,   // legacy `rgb(…)` and modern `rgb(… / …)` both OK
    "hue-degree-notation": null,
    "shorthand-property-no-redundant-values": null,
    "declaration-block-no-redundant-longhand-properties": null,
    "media-feature-range-notation": null,
    "selector-not-notation": null,
    "import-notation": null,
  },

  overrides: [
    {
      // `*.ts` files use the postcss-lit parser to extract `css`` template
      // literals. Babel options for postcss-lit live in `package.json` under
      // the `"postcss-lit"` key (legacy decorators for Lit @property/@state).
      files: ["**/*.ts"],
      customSyntax: "postcss-lit",
    },
    {
      // Token-definition files DEFINE hex values — exempt from color-no-hex.
      // Theme bundles also @import the base tokens.css at author-time (bundled
      // by Vite into each per-theme CSS asset published via the package's
      // `exports` map); the ADR-001 ban on @import targets *runtime* component
      // CSS, not author-time token composition. Exempt the directory.
      files: ["src/tokens/**"],
      rules: {
        "color-no-hex": null,
        "at-rule-disallowed-list": null,
      },
    },
  ],

  ignoreFiles: [
    "dist/**",
    "node_modules/**",
    "demo/**",
    "vis/**",
    "src/entries/**",          // generated
    "src/index.ts",             // generated
    "src/auto.ts",              // generated
    "src/manifest.ts",          // generated
    "src/manifest.publish.ts",  // generated
    "**/*.test.ts",
    "**/*.spec.ts",
  ],
};
