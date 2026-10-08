import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { THEMES, ThemeTokens, ThemeName, ACCENT, ACCENT_SOFT, RADII } from "@sfu/shared";

let NavigationBarModule: any = null;
if (Platform.OS === "android") {
  try {
    NavigationBarModule = require("expo-navigation-bar");
  } catch {}
}

function applyNavBarStyle(themeName: ThemeName) {
  if (Platform.OS !== "android" || !NavigationBarModule) return;
  try {
    const isLight = themeName === "light";
    // expo-navigation-bar v57 API: setStyle("dark"|"light")
    // "dark" = dark icons (for light backgrounds), "light" = light icons (for dark backgrounds)
    if (typeof NavigationBarModule.setStyle === "function") {
      NavigationBarModule.setStyle(isLight ? "dark" : "light");
    } else if (typeof NavigationBarModule.default?.setStyle === "function") {
      NavigationBarModule.default.setStyle(isLight ? "dark" : "light");
    }
  } catch {}
}

const STORAGE_KEY = "sfu_theme";

export type AccentColor = "orange" | "blue" | "green";

interface ThemeCtx {
  themeName: ThemeName;
  accentMode: AccentColor;
  tokens: ThemeTokens;
  accent: string;
  accentSoft: string;
  radii: typeof RADII;
  toggleTheme: () => void;
  setThemeName: (t: ThemeName) => void;
  setAccentMode: (a: AccentColor) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [themeName, setThemeNameState] = useState<ThemeName>(system === "dark" ? "dark" : "light");
  const [accentMode, setAccentModeState] = useState<AccentColor>("orange");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.theme) setThemeNameState(parsed.theme as ThemeName);
          if (parsed.accent) setAccentModeState(parsed.accent as AccentColor);
        } catch (e) {
          const validThemes = ["light", "dark", "blue", "monokai", "nord", "catppuccin"];
          if (validThemes.includes(saved)) {
            setThemeNameState(saved as ThemeName);
          }
        }
      }

      // Apply nav bar style on initial load
      AsyncStorage.getItem(STORAGE_KEY).then((s) => {
        let t: ThemeName = system === "dark" ? "dark" : "light";
        if (s) {
          try {
            const parsed = JSON.parse(s);
            if (parsed.theme && parsed.theme in THEMES) t = parsed.theme;
          } catch {
            if (s in THEMES) t = s as ThemeName;
          }
        }
        applyNavBarStyle(t);
      });
    });
  }, []);

  const setThemeName = (t: ThemeName) => {
    setThemeNameState(t);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: t, accent: accentMode })).catch(() => {});
    applyNavBarStyle(t);
  };

  const setAccentMode = (a: AccentColor) => {
    setAccentModeState(a);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: themeName, accent: a })).catch(() => {});
  };

  const value = useMemo<ThemeCtx>(() => {
    let acc = ACCENT;
    let accSoft = ACCENT_SOFT;
    if (accentMode === "blue") {
      acc = "#3B82F6";
      accSoft = "#60A5FA";
    } else if (accentMode === "green") {
      acc = "#10B981";
      accSoft = "#34D399";
    }

    return {
      themeName,
      accentMode,
      tokens: THEMES[themeName],
      accent: acc,
      accentSoft: accSoft,
      radii: RADII,
      toggleTheme: () => setThemeName(themeName === "light" ? "dark" : "light"),
      setThemeName,
      setAccentMode,
    };
  }, [themeName, accentMode]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
