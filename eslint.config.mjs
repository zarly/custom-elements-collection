/**
 * ESLint config for `custom-elements-collection`.
 *
 * Flat config (ESLint 9). Two halves:
 *
 *  1. Code-quality rules — size, complexity, TS hygiene. Set as `warn` so
 *     existing corpus outliers surface without blocking `pnpm check`. Flip to
 *     `error` after a cleanup sweep.
 *
 *  2. ADR-013 safety contract — XSS / code-execution / forbidden-import
 *     surface. Set as `error` from day one. These match the closed forbidden
 *     list in `docs/adr/adr-013-safety-contract.md` and complement the CSS-side
 *     enforcement done by stylelint.
 *
 * Levels are intentionally asymmetric: code style is advisory, safety is
 * mandatory. Migration sweep before flipping size/complexity rules to `error`.
 */

import tseslint from "typescript-eslint";
import globals from "globals";

const SAFETY_AST_RULES = [
  // ── ADR-013: DOM mutation sinks ────────────────────────────────────────
  {
    selector:
      "AssignmentExpression[left.type='MemberExpression'][left.property.name='innerHTML']",
    message:
      "ADR-013: No innerHTML writes. Use textContent or Lit html`` templates.",
  },
  {
    selector:
      "AssignmentExpression[left.type='MemberExpression'][left.property.name='outerHTML']",
    message: "ADR-013: No outerHTML writes.",
  },
  {
    selector:
      "AssignmentExpression[left.type='MemberExpression'][left.property.name='srcdoc']",
    message: "ADR-013: No iframe srcdoc writes.",
  },
  {
    selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
    message:
      "ADR-013: No insertAdjacentHTML. Use textContent or Lit html`` templates.",
  },
  {
    selector:
      "MemberExpression[object.name='document'][property.name='write']",
    message: "ADR-013: No document.write.",
  },
  {
    selector:
      "MemberExpression[object.name='document'][property.name='writeln']",
    message: "ADR-013: No document.writeln.",
  },
  // ── ADR-013: style.cssText is the dangerous string-style write ────────
  {
    selector:
      "AssignmentExpression[left.type='MemberExpression'][left.object.property.name='style'][left.property.name='cssText']",
    message:
      "ADR-013: No style.cssText = userText. Set individual properties or use Lit styleMap / static styles.",
  },
  // ── ADR-013: Range.createContextualFragment is an HTML-string parser ──
  {
    selector: "CallExpression[callee.property.name='createContextualFragment']",
    message:
      "ADR-013: No createContextualFragment on user-controlled strings. Parse via DOMParser with `text/html` AND only after explicit sanitisation, or build the tree via createElement.",
  },
];

const SAFETY_FORBIDDEN_IMPORTS = [
  {
    name: "lit/directives/unsafe-html.js",
    message: "ADR-013: unsafeHTML directive is forbidden.",
  },
  {
    name: "lit/directives/unsafe-svg.js",
    message: "ADR-013: unsafeSVG directive is forbidden.",
  },
  {
    name: "lit/directives/unsafe-mathml.js",
    message: "ADR-013: unsafeMathML directive is forbidden.",
  },
  {
    name: "lit-html/directives/unsafe-html.js",
    message: "ADR-013: unsafeHTML directive is forbidden.",
  },
  {
    name: "lit/static-html.js",
    importNames: ["unsafeStatic"],
    message:
      "ADR-013: unsafeStatic is forbidden. Use the typed `html`/`literal` tags.",
  },
];

export default tseslint.config(
  // ── Base recommendations (typescript-eslint preset) ────────────────────
  ...tseslint.configs.recommended,

  // ── Project rules (apply to src/) ──────────────────────────────────────
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.es2024 },
    },
    rules: {
      // ── Size & complexity (warn — corpus migration first, then promote) ─
      "max-lines": [
        "warn",
        { max: 400, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "warn",
        { max: 100, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      complexity: ["warn", { max: 15 }],
      "max-depth": ["warn", { max: 4 }],
      "max-params": ["warn", { max: 4 }],
      "max-nested-callbacks": ["warn", { max: 3 }],

      // ── ADR-013 §"Forbidden code execution" — JS sinks stylelint can't see
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",

      // ── ADR-013 §"Forbidden DOM mutations" + style.cssText sink ────────
      "no-restricted-syntax": ["error", ...SAFETY_AST_RULES],
      "no-restricted-imports": [
        "error",
        { paths: SAFETY_FORBIDDEN_IMPORTS },
      ],

      // ── ADR-013 §"Console policy" — strict (warn / error / log / info / debug)
      "no-console": "error",

      // ── TS hygiene (mechanical, low controversy) ───────────────────────
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports" },
      ],
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "smart"],

      // ── TS quality (warn — context-dependent calls) ─────────────────────
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
    },
  },

  // ── Tests — relaxed size, console, and safety surface ──────────────────
  // ADR-013's threat model is production XSS from LLM-emitted markup. Test
  // files set up fixtures with author-controlled literal HTML in jsdom; there
  // is no untrusted input. Allow innerHTML / unsafeHTML for fixture setup so
  // the safety lint stays meaningful in component source.
  {
    files: ["**/*.test.ts", "**/*.spec.ts", "src/**/*.e2e.ts"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.es2024 },
    },
    rules: {
      "max-lines": [
        "warn",
        { max: 800, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": "off", // describe / it blocks legitimately long
      "no-console": "off", // diagnostic logs in tests are fine
      "no-restricted-syntax": "off", // innerHTML fixture setup is fine in tests
      "no-restricted-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },

  // ── Scripts (CLI / generators) — different audience ────────────────────
  {
    files: ["scripts/**/*.ts"],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2024 },
    },
    rules: {
      "no-console": "off", // CLI tooling writes to stdout
      "max-lines": [
        "warn",
        { max: 600, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "warn",
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
    },
  },

  // ── Global ignores ─────────────────────────────────────────────────────
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "demo/**",
      "vis/**",
      "e2e/**",
      "src/entries/**", // generated
      "src/index.ts", // generated
      "src/auto.ts", // generated
      "src/manifest.ts", // generated
      "src/manifest.publish.ts", // generated
    ],
  },
);
