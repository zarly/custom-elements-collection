/** Theme management — side-effectful (touches DOM + localStorage). */

const THEME_KEY = "cec-demo-theme";
const themeMedia = window.matchMedia("(prefers-color-scheme: light)");

export const THEME_OPTIONS = [
  { value: "auto",       label: "Auto" },
  { value: "light",      label: "Light",              group: "Built-in" },
  { value: "dark",       label: "Dark",               group: "Built-in" },
  { value: "swiss",      label: "Swiss International", group: "Design Schools" },
  { value: "bauhaus",    label: "Bauhaus",             group: "Design Schools" },
  { value: "muji",       label: "Muji (Japanese)",     group: "Design Schools" },
  { value: "neo-brutal", label: "Neo-brutalist",       group: "Design Schools" },
  { value: "solarized",  label: "Solarized",           group: "Design Schools" },
  { value: "nordic",     label: "Nordic",              group: "Design Schools" },
  { value: "memphis",    label: "Memphis",             group: "Design Schools" },
  { value: "gruvbox",    label: "Gruvbox",             group: "Design Schools" },
];

export const VALID_THEMES = new Set(THEME_OPTIONS.map((o) => o.value));

export function applyTheme(mode) {
  const effective = mode === "auto" ? (themeMedia.matches ? "light" : "dark") : mode;
  document.documentElement.setAttribute("data-ce-theme", effective);
}

export function initTheme() {
  const switcher = document.getElementById("theme-switcher");
  const stored = localStorage.getItem(THEME_KEY);
  const initial = VALID_THEMES.has(stored) ? stored : "auto";

  switcher.options = THEME_OPTIONS;
  switcher.value = initial;
  applyTheme(initial);

  switcher.addEventListener("ce-change", (ev) => {
    const { value } = ev.detail;
    localStorage.setItem(THEME_KEY, value);
    applyTheme(value);
  });

  themeMedia.addEventListener("change", () => {
    if (switcher.value === "auto") applyTheme("auto");
  });
}
