import { useState, useCallback, useEffect, createContext, useContext } from "react";
import {
  baseColors, accentColors, chartPalettes, fontFamilies, bundledThemes,
  defaultThemeSettings, type ThemeSettings,
} from "@/data/theme-presets";

interface ThemeCustomizerContextValue {
  settings: ThemeSettings;
  updateSetting: <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => void;
  setTheme: (themeKey: string) => void;
  save: () => Promise<void>;
  reset: () => void;
  saving: boolean;
  mode: "light" | "dark";
  toggleMode: () => void;
}

export const ThemeCustomizerContext = createContext<ThemeCustomizerContextValue | null>(null);

function resolveMode(s: ThemeSettings): "light" | "dark" {
  if (s.mode === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  return s.mode;
}

function applyAllVars(s: ThemeSettings) {
  const isDark = resolveMode(s) === "dark";
  const modeKey = isDark ? "dark" : "light";
  const root = document.documentElement;

  // Dark class
  root.classList.toggle("dark", isDark);

  // Base color
  const base = baseColors[s.base_color] ?? baseColors.neutral;
  const vars = base[modeKey];
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(`--${key}`, value);
  }

  // Accent / primary
  const accent = accentColors[s.accent_color] ?? accentColors.default;
  const accentVars = accent[modeKey];
  for (const [key, value] of Object.entries(accentVars)) {
    root.style.setProperty(`--${key}`, value);
  }

  // Sidebar primary follows accent
  root.style.setProperty("--sidebar-primary", accentVars.primary);
  root.style.setProperty("--sidebar-primary-foreground", accentVars["primary-foreground"]);
  root.style.setProperty("--sidebar-ring", accentVars.ring);

  // Chart palette
  const palette = chartPalettes[s.chart_palette] ?? chartPalettes.default;
  const chartVars = palette[modeKey];
  for (const [key, value] of Object.entries(chartVars)) {
    root.style.setProperty(`--${key}`, value);
  }
  // Store hex colors for ApexCharts (which can't parse oklch)
  palette.colors.forEach((hex, i) => {
    root.style.setProperty(`--chart-hex-${i + 1}`, hex);
  });

  // Font family
  const font = fontFamilies[s.font_family] ?? fontFamilies.geist;
  root.style.setProperty("--font-sans", font.value);

  // Radius
  root.style.setProperty("--radius", `${s.radius}rem`);
}

export function useThemeCustomizerProvider() {
  const [settings, setSettings] = useState<ThemeSettings>(defaultThemeSettings);
  const [saving, setSaving] = useState(false);

  // Load saved settings from backend on mount
  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const merged = { ...defaultThemeSettings, ...data };
          setSettings(merged);
          applyAllVars(merged);
        } else {
          applyAllVars(defaultThemeSettings);
        }
      })
      .catch(() => { applyAllVars(defaultThemeSettings); });
  }, []);

  // Listen for system theme changes when mode is "system"
  useEffect(() => {
    if (settings.mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyAllVars(settings);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings]);

  const persistSettings = useCallback((s: ThemeSettings) => {
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    }).catch(() => {});
  }, []);

  const updateSetting = useCallback(<K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      applyAllVars(next);
      persistSettings(next);
      return next;
    });
  }, [persistSettings]);

  const setTheme = useCallback((themeKey: string) => {
    const theme = bundledThemes[themeKey];
    if (!theme) return;
    setSettings(prev => {
      const next = { ...prev, theme: themeKey, base_color: theme.base, accent_color: theme.accent, chart_palette: theme.chart };
      applyAllVars(next);
      persistSettings(next);
      return next;
    });
  }, [persistSettings]);

  const toggleMode = useCallback(() => {
    setSettings(prev => {
      const currentResolved = resolveMode(prev);
      const next = { ...prev, mode: (currentResolved === "dark" ? "light" : "dark") as "light" | "dark" };
      applyAllVars(next);
      persistSettings(next);
      return next;
    });
  }, [persistSettings]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const reset = useCallback(() => {
    setSettings(defaultThemeSettings);
    applyAllVars(defaultThemeSettings);
  }, []);

  const mode = resolveMode(settings);

  return { settings, updateSetting, setTheme, save, reset, saving, mode, toggleMode };
}

export function useThemeCustomizer() {
  const ctx = useContext(ThemeCustomizerContext);
  if (!ctx) throw new Error("useThemeCustomizer must be used within ThemeCustomizerContext");
  return ctx;
}
