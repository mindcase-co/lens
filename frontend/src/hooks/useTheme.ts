import { useState, useEffect, useCallback } from "react";

export function useTheme(configTheme: "light" | "dark" | "system" = "system") {
  const [mode, setMode] = useState<"light" | "dark">(() => {
    if (configTheme !== "system") return configTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    if (configTheme !== "system") { setMode(configTheme); return; }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = (e: MediaQueryListEvent) => setMode(e.matches ? "dark" : "light");
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [configTheme]);

  useEffect(() => { document.documentElement.classList.toggle("dark", mode === "dark"); }, [mode]);

  const toggle = useCallback(() => setMode(p => p === "light" ? "dark" : "light"), []);
  return { mode, toggle };
}
