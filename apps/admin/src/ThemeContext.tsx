import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ACCENT, ACCENT_SOFT, RADII, THEMES, ThemeName, ThemeTokens } from "@sfu/shared";

const STORAGE_KEY = "sfu_admin_theme";

interface ThemeCtx {
  themeName: ThemeName;
  tokens: ThemeTokens;
  accent: string;
  accentSoft: string;
  radii: typeof RADII;
  setThemeName: (t: ThemeName) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

function applyTokensToDocument(tokens: ThemeTokens, themeName: ThemeName) {
  const root = document.documentElement.style;
  root.setProperty("--bg", tokens.bg);
  root.setProperty("--card", tokens.card);
  root.setProperty("--tx", tokens.tx);
  root.setProperty("--mu", tokens.mu);
  root.setProperty("--bd", tokens.bd);
  root.setProperty("--sub", tokens.sub);
  root.setProperty("--inp", tokens.inp);
  root.setProperty("--glass", tokens.glass);
  root.setProperty("--gbd", tokens.gbd);
  root.setProperty("--accent", ACCENT);
  root.setProperty("--accent-soft", ACCENT_SOFT);
  document.documentElement.dataset.theme = themeName;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeName>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    applyTokensToDocument(THEMES[themeName], themeName);
  }, [themeName]);

  const setThemeName = (t: ThemeName) => {
    setThemeNameState(t);
    localStorage.setItem(STORAGE_KEY, t);
  };

  const value = useMemo<ThemeCtx>(
    () => ({ themeName, tokens: THEMES[themeName], accent: ACCENT, accentSoft: ACCENT_SOFT, radii: RADII, setThemeName }),
    [themeName]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
