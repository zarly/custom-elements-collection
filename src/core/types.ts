/** Semantic colors exposed as `color="..."` attribute on components. */
export type CecColor =
  | "neutral"
  | "green"
  | "red"
  | "amber"
  | "blue"
  | "purple"
  | "cyan";

/** Size scale used by sizeable components (chips, kpi, buttons if any). */
export type CecSize = "sm" | "md" | "lg";

/** Theme attribute values — matches the token sets shipped in src/tokens/. */
export type CecTheme = "dark" | "light";
