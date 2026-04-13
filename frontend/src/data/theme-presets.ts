/**
 * Shadcn-compatible theme presets in oklch format.
 * Each preset defines all CSS variables for both light and dark modes.
 */

export interface ThemePreset {
  label: string;
  light: Record<string, string>;
  dark: Record<string, string>;
}

export interface AccentColor {
  label: string;
  color: string; // display color (hex)
  light: { primary: string; "primary-foreground": string; ring: string };
  dark: { primary: string; "primary-foreground": string; ring: string };
}

export interface ChartPalette {
  label: string;
  colors: string[]; // display hex colors
  light: Record<string, string>;
  dark: Record<string, string>;
}

// --- Base color presets ---

export const baseColors: Record<string, ThemePreset> = {
  neutral: {
    label: "Neutral",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0 0)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.145 0 0)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.145 0 0)",
      secondary: "oklch(0.97 0 0)",
      "secondary-foreground": "oklch(0.205 0 0)",
      muted: "oklch(0.97 0 0)",
      "muted-foreground": "oklch(0.556 0 0)",
      accent: "oklch(0.97 0 0)",
      "accent-foreground": "oklch(0.205 0 0)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.922 0 0)",
      input: "oklch(0.922 0 0)",
      sidebar: "oklch(0.985 0 0)",
      "sidebar-foreground": "oklch(0.145 0 0)",
      "sidebar-accent": "oklch(0.97 0 0)",
      "sidebar-accent-foreground": "oklch(0.205 0 0)",
      "sidebar-border": "oklch(0.922 0 0)",
    },
    dark: {
      background: "oklch(0.145 0 0)",
      foreground: "oklch(0.985 0 0)",
      card: "oklch(0.205 0 0)",
      "card-foreground": "oklch(0.985 0 0)",
      popover: "oklch(0.205 0 0)",
      "popover-foreground": "oklch(0.985 0 0)",
      secondary: "oklch(0.269 0 0)",
      "secondary-foreground": "oklch(0.985 0 0)",
      muted: "oklch(0.269 0 0)",
      "muted-foreground": "oklch(0.708 0 0)",
      accent: "oklch(0.269 0 0)",
      "accent-foreground": "oklch(0.985 0 0)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      sidebar: "oklch(0.205 0 0)",
      "sidebar-foreground": "oklch(0.985 0 0)",
      "sidebar-accent": "oklch(0.269 0 0)",
      "sidebar-accent-foreground": "oklch(0.985 0 0)",
      "sidebar-border": "oklch(1 0 0 / 10%)",
    },
  },
  slate: {
    label: "Slate",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.129 0.042 264.695)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.129 0.042 264.695)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.129 0.042 264.695)",
      secondary: "oklch(0.968 0.007 264.536)",
      "secondary-foreground": "oklch(0.208 0.042 265.755)",
      muted: "oklch(0.968 0.007 264.536)",
      "muted-foreground": "oklch(0.554 0.046 257.417)",
      accent: "oklch(0.968 0.007 264.536)",
      "accent-foreground": "oklch(0.208 0.042 265.755)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.929 0.013 255.508)",
      input: "oklch(0.929 0.013 255.508)",
      sidebar: "oklch(0.985 0.003 264.542)",
      "sidebar-foreground": "oklch(0.129 0.042 264.695)",
      "sidebar-accent": "oklch(0.968 0.007 264.536)",
      "sidebar-accent-foreground": "oklch(0.208 0.042 265.755)",
      "sidebar-border": "oklch(0.929 0.013 255.508)",
    },
    dark: {
      background: "oklch(0.129 0.042 264.695)",
      foreground: "oklch(0.984 0.003 247.858)",
      card: "oklch(0.208 0.042 265.755)",
      "card-foreground": "oklch(0.984 0.003 247.858)",
      popover: "oklch(0.208 0.042 265.755)",
      "popover-foreground": "oklch(0.984 0.003 247.858)",
      secondary: "oklch(0.279 0.041 260.031)",
      "secondary-foreground": "oklch(0.984 0.003 247.858)",
      muted: "oklch(0.279 0.041 260.031)",
      "muted-foreground": "oklch(0.704 0.04 256.788)",
      accent: "oklch(0.279 0.041 260.031)",
      "accent-foreground": "oklch(0.984 0.003 247.858)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      sidebar: "oklch(0.208 0.042 265.755)",
      "sidebar-foreground": "oklch(0.984 0.003 247.858)",
      "sidebar-accent": "oklch(0.279 0.041 260.031)",
      "sidebar-accent-foreground": "oklch(0.984 0.003 247.858)",
      "sidebar-border": "oklch(1 0 0 / 10%)",
    },
  },
  zinc: {
    label: "Zinc",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.141 0.005 285.823)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.141 0.005 285.823)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.141 0.005 285.823)",
      secondary: "oklch(0.967 0.001 286.375)",
      "secondary-foreground": "oklch(0.21 0.006 285.885)",
      muted: "oklch(0.967 0.001 286.375)",
      "muted-foreground": "oklch(0.552 0.016 285.938)",
      accent: "oklch(0.967 0.001 286.375)",
      "accent-foreground": "oklch(0.21 0.006 285.885)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.92 0.004 286.32)",
      input: "oklch(0.92 0.004 286.32)",
      sidebar: "oklch(0.985 0.001 286.375)",
      "sidebar-foreground": "oklch(0.141 0.005 285.823)",
      "sidebar-accent": "oklch(0.967 0.001 286.375)",
      "sidebar-accent-foreground": "oklch(0.21 0.006 285.885)",
      "sidebar-border": "oklch(0.92 0.004 286.32)",
    },
    dark: {
      background: "oklch(0.141 0.005 285.823)",
      foreground: "oklch(0.985 0.001 286.375)",
      card: "oklch(0.21 0.006 285.885)",
      "card-foreground": "oklch(0.985 0.001 286.375)",
      popover: "oklch(0.21 0.006 285.885)",
      "popover-foreground": "oklch(0.985 0.001 286.375)",
      secondary: "oklch(0.274 0.006 286.033)",
      "secondary-foreground": "oklch(0.985 0.001 286.375)",
      muted: "oklch(0.274 0.006 286.033)",
      "muted-foreground": "oklch(0.705 0.015 286.067)",
      accent: "oklch(0.274 0.006 286.033)",
      "accent-foreground": "oklch(0.985 0.001 286.375)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      sidebar: "oklch(0.21 0.006 285.885)",
      "sidebar-foreground": "oklch(0.985 0.001 286.375)",
      "sidebar-accent": "oklch(0.274 0.006 286.033)",
      "sidebar-accent-foreground": "oklch(0.985 0.001 286.375)",
      "sidebar-border": "oklch(1 0 0 / 10%)",
    },
  },
  stone: {
    label: "Stone",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.147 0.004 49.25)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.147 0.004 49.25)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.147 0.004 49.25)",
      secondary: "oklch(0.97 0.001 106.424)",
      "secondary-foreground": "oklch(0.216 0.006 56.043)",
      muted: "oklch(0.97 0.001 106.424)",
      "muted-foreground": "oklch(0.553 0.013 58.071)",
      accent: "oklch(0.97 0.001 106.424)",
      "accent-foreground": "oklch(0.216 0.006 56.043)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.923 0.003 48.717)",
      input: "oklch(0.923 0.003 48.717)",
      sidebar: "oklch(0.985 0.001 106.424)",
      "sidebar-foreground": "oklch(0.147 0.004 49.25)",
      "sidebar-accent": "oklch(0.97 0.001 106.424)",
      "sidebar-accent-foreground": "oklch(0.216 0.006 56.043)",
      "sidebar-border": "oklch(0.923 0.003 48.717)",
    },
    dark: {
      background: "oklch(0.147 0.004 49.25)",
      foreground: "oklch(0.985 0.001 106.424)",
      card: "oklch(0.216 0.006 56.043)",
      "card-foreground": "oklch(0.985 0.001 106.424)",
      popover: "oklch(0.216 0.006 56.043)",
      "popover-foreground": "oklch(0.985 0.001 106.424)",
      secondary: "oklch(0.268 0.007 34.298)",
      "secondary-foreground": "oklch(0.985 0.001 106.424)",
      muted: "oklch(0.268 0.007 34.298)",
      "muted-foreground": "oklch(0.709 0.01 56.259)",
      accent: "oklch(0.268 0.007 34.298)",
      "accent-foreground": "oklch(0.985 0.001 106.424)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      sidebar: "oklch(0.216 0.006 56.043)",
      "sidebar-foreground": "oklch(0.985 0.001 106.424)",
      "sidebar-accent": "oklch(0.268 0.007 34.298)",
      "sidebar-accent-foreground": "oklch(0.985 0.001 106.424)",
      "sidebar-border": "oklch(1 0 0 / 10%)",
    },
  },
};

// --- Accent / Primary color presets ---

export const accentColors: Record<string, AccentColor> = {
  default: {
    label: "Default",
    color: "#737373",
    light: { primary: "oklch(0.205 0 0)", "primary-foreground": "oklch(0.985 0 0)", ring: "oklch(0.708 0 0)" },
    dark: { primary: "oklch(0.922 0 0)", "primary-foreground": "oklch(0.205 0 0)", ring: "oklch(0.556 0 0)" },
  },
  blue: {
    label: "Blue",
    color: "#3B82F6",
    light: { primary: "oklch(0.546 0.245 262.881)", "primary-foreground": "oklch(0.985 0 0)", ring: "oklch(0.546 0.245 262.881)" },
    dark: { primary: "oklch(0.623 0.214 259.815)", "primary-foreground": "oklch(0.985 0 0)", ring: "oklch(0.623 0.214 259.815)" },
  },
  violet: {
    label: "Violet",
    color: "#8B5CF6",
    light: { primary: "oklch(0.541 0.281 293.009)", "primary-foreground": "oklch(0.985 0 0)", ring: "oklch(0.541 0.281 293.009)" },
    dark: { primary: "oklch(0.627 0.265 303.9)", "primary-foreground": "oklch(0.985 0 0)", ring: "oklch(0.627 0.265 303.9)" },
  },
  green: {
    label: "Green",
    color: "#22C55E",
    light: { primary: "oklch(0.596 0.199 149.769)", "primary-foreground": "oklch(0.985 0 0)", ring: "oklch(0.596 0.199 149.769)" },
    dark: { primary: "oklch(0.696 0.17 162.48)", "primary-foreground": "oklch(0.145 0 0)", ring: "oklch(0.696 0.17 162.48)" },
  },
  orange: {
    label: "Orange",
    color: "#F97316",
    light: { primary: "oklch(0.637 0.237 25.331)", "primary-foreground": "oklch(0.985 0 0)", ring: "oklch(0.637 0.237 25.331)" },
    dark: { primary: "oklch(0.702 0.191 22.216)", "primary-foreground": "oklch(0.985 0 0)", ring: "oklch(0.702 0.191 22.216)" },
  },
  rose: {
    label: "Rose",
    color: "#F43F5E",
    light: { primary: "oklch(0.585 0.233 16.439)", "primary-foreground": "oklch(0.985 0 0)", ring: "oklch(0.585 0.233 16.439)" },
    dark: { primary: "oklch(0.645 0.246 16.439)", "primary-foreground": "oklch(0.985 0 0)", ring: "oklch(0.645 0.246 16.439)" },
  },
};

// --- Chart color palettes ---

export const chartPalettes: Record<string, ChartPalette> = {
  default: {
    label: "Default",
    colors: ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"],
    light: { "chart-1": "oklch(0.585 0.233 277.117)", "chart-2": "oklch(0.696 0.17 162.48)", "chart-3": "oklch(0.795 0.184 86.047)", "chart-4": "oklch(0.577 0.245 27.325)", "chart-5": "oklch(0.623 0.214 259.815)" },
    dark: { "chart-1": "oklch(0.627 0.265 303.9)", "chart-2": "oklch(0.696 0.17 162.48)", "chart-3": "oklch(0.795 0.184 86.047)", "chart-4": "oklch(0.704 0.191 22.216)", "chart-5": "oklch(0.623 0.214 259.815)" },
  },
  vibrant: {
    label: "Vibrant",
    colors: ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"],
    light: { "chart-1": "oklch(0.585 0.233 277.117)", "chart-2": "oklch(0.696 0.17 162.48)", "chart-3": "oklch(0.795 0.184 86.047)", "chart-4": "oklch(0.577 0.245 27.325)", "chart-5": "oklch(0.623 0.214 259.815)" },
    dark: { "chart-1": "oklch(0.627 0.265 303.9)", "chart-2": "oklch(0.696 0.17 162.48)", "chart-3": "oklch(0.795 0.184 86.047)", "chart-4": "oklch(0.704 0.191 22.216)", "chart-5": "oklch(0.623 0.214 259.815)" },
  },
  ocean: {
    label: "Ocean",
    colors: ["#0EA5E9", "#06B6D4", "#14B8A6", "#3B82F6", "#6366F1"],
    light: { "chart-1": "oklch(0.685 0.169 237.323)", "chart-2": "oklch(0.715 0.143 215.221)", "chart-3": "oklch(0.717 0.143 181.028)", "chart-4": "oklch(0.623 0.214 259.815)", "chart-5": "oklch(0.585 0.233 277.117)" },
    dark: { "chart-1": "oklch(0.685 0.169 237.323)", "chart-2": "oklch(0.715 0.143 215.221)", "chart-3": "oklch(0.717 0.143 181.028)", "chart-4": "oklch(0.623 0.214 259.815)", "chart-5": "oklch(0.627 0.265 303.9)" },
  },
  sunset: {
    label: "Sunset",
    colors: ["#F97316", "#EF4444", "#F43F5E", "#EC4899", "#A855F7"],
    light: { "chart-1": "oklch(0.702 0.191 22.216)", "chart-2": "oklch(0.577 0.245 27.325)", "chart-3": "oklch(0.585 0.233 16.439)", "chart-4": "oklch(0.656 0.241 354.308)", "chart-5": "oklch(0.585 0.281 303.9)" },
    dark: { "chart-1": "oklch(0.702 0.191 22.216)", "chart-2": "oklch(0.704 0.191 22.216)", "chart-3": "oklch(0.645 0.246 16.439)", "chart-4": "oklch(0.656 0.241 354.308)", "chart-5": "oklch(0.627 0.265 303.9)" },
  },
};

// --- Font families (system stacks, no downloads) ---

export const fontFamilies: Record<string, { label: string; value: string }> = {
  system: {
    label: "System",
    value: "ui-sans-serif, system-ui, sans-serif",
  },
  mono: {
    label: "Mono",
    value: "'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
  },
  geist: {
    label: "Geist",
    value: "'Geist Variable', ui-sans-serif, system-ui, sans-serif",
  },
  georgia: {
    label: "Georgia",
    value: "Georgia, 'Times New Roman', serif",
  },
  palatino: {
    label: "Palatino",
    value: "'Palatino Linotype', Palatino, 'Book Antiqua', serif",
  },
};

// --- Bundled themes (base + accent + chart in one pick) ---

export interface BundledTheme {
  label: string;
  base: string;
  accent: string;
  chart: string;
  preview: { bg: string; accent: string; charts: string[] };
}

export const bundledThemes: Record<string, BundledTheme> = {
  neutral: {
    label: "Neutral",
    base: "neutral",
    accent: "default",
    chart: "default",
    preview: { bg: "#FAFAFA", accent: "#737373", charts: ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"] },
  },
  ocean: {
    label: "Ocean",
    base: "slate",
    accent: "blue",
    chart: "ocean",
    preview: { bg: "#F8FAFC", accent: "#3B82F6", charts: ["#0EA5E9", "#06B6D4", "#14B8A6", "#3B82F6", "#6366F1"] },
  },
  sunset: {
    label: "Sunset",
    base: "stone",
    accent: "orange",
    chart: "sunset",
    preview: { bg: "#FAFAF9", accent: "#F97316", charts: ["#F97316", "#EF4444", "#F43F5E", "#EC4899", "#A855F7"] },
  },
  violet: {
    label: "Violet",
    base: "zinc",
    accent: "violet",
    chart: "vibrant",
    preview: { bg: "#FAFAFA", accent: "#8B5CF6", charts: ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"] },
  },
};

// --- Default settings ---

export interface ThemeSettings {
  theme: string;
  base_color: string;
  accent_color: string;
  chart_palette: string;
  font_family: string;
  radius: number;
  mode: "light" | "dark" | "system";
}

export const defaultThemeSettings: ThemeSettings = {
  theme: "neutral",
  base_color: "neutral",
  accent_color: "default",
  chart_palette: "default",
  font_family: "system",
  radius: 0.625,
  mode: "system",
};
