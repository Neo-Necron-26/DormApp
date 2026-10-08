// Shared visual tokens used by the mobile app and the administration panel.
// (`project/SFU Dorm Super-App v2.dc.html`, const THEMES).
export type ThemeName = "light" | "dark" | "blue" | "monokai" | "nord" | "catppuccin";

export interface ThemeTokens {
  bg: string;
  card: string;
  tx: string;
  mu: string;
  bd: string;
  glass: string;
  gbd: string;
  sub: string;
  inp: string;
  ph1: string;
  ph2: string;
  warnGlass: string;
  toastBg: string;
  toastTx: string;
}

export const THEMES: Record<ThemeName, ThemeTokens> = {
  light: {
    bg: "#F4F5F7",
    card: "#FFFFFF",
    tx: "#121212",
    mu: "#6B7280",
    bd: "rgba(0,0,0,.07)",
    glass: "rgba(255,255,255,.9)",
    gbd: "rgba(255,255,255,.8)",
    sub: "#EDEEF1",
    inp: "#FFFFFF",
    ph1: "#E9EAEE",
    ph2: "#F3F4F6",
    warnGlass: "rgba(255,240,230,.75)",
    toastBg: "#121212",
    toastTx: "#fff",
  },
  dark: {
    bg: "#121212",
    card: "#1C1C1E",
    tx: "#FFFFFF",
    mu: "#9CA3AF",
    bd: "rgba(255,255,255,.09)",
    glass: "rgba(20,20,22,.92)",
    gbd: "rgba(255,255,255,.14)",
    sub: "#262628",
    inp: "#232325",
    ph1: "#26262A",
    ph2: "#1F1F22",
    warnGlass: "rgba(60,36,20,.7)",
    toastBg: "#FFFFFF",
    toastTx: "#121212",
  },
  blue: {
    bg: "#0A192F",
    card: "#112240",
    tx: "#CCD6F6",
    mu: "#8892B0",
    bd: "rgba(255,255,255,.1)",
    glass: "rgba(10,25,47,.9)",
    gbd: "rgba(255,255,255,.15)",
    sub: "#233554",
    inp: "#1F2D4C",
    ph1: "#1A253C",
    ph2: "#141D2F",
    warnGlass: "rgba(40,40,70,.7)",
    toastBg: "#CCD6F6",
    toastTx: "#0A192F",
  },
  monokai: {
    bg: "#272822",
    card: "#3E3D32",
    tx: "#F8F8F2",
    mu: "#75715E",
    bd: "rgba(255,255,255,.12)",
    glass: "rgba(39,40,34,.9)",
    gbd: "rgba(255,255,255,.2)",
    sub: "#49483E",
    inp: "#403F35",
    ph1: "#38372D",
    ph2: "#2F2E25",
    warnGlass: "rgba(100,60,30,.7)",
    toastBg: "#F8F8F2",
    toastTx: "#272822",
  },
  nord: {
    bg: "#2E3440",
    card: "#3B4252",
    tx: "#D8DEE9",
    mu: "#9098A7",
    bd: "rgba(255,255,255,.1)",
    glass: "rgba(46,52,64,.9)",
    gbd: "rgba(255,255,255,.15)",
    sub: "#434C5E",
    inp: "#4C566A",
    ph1: "#3B4252",
    ph2: "#2E3440",
    warnGlass: "rgba(191,97,106,.7)",
    toastBg: "#D8DEE9",
    toastTx: "#2E3440",
  },
  catppuccin: {
    bg: "#1E1E2E",
    card: "#313244",
    tx: "#CDD6F4",
    mu: "#A6ADC8",
    bd: "rgba(255,255,255,.1)",
    glass: "rgba(30,30,46,.9)",
    gbd: "rgba(255,255,255,.15)",
    sub: "#45475A",
    inp: "#585B70",
    ph1: "#313244",
    ph2: "#1E1E2E",
    warnGlass: "rgba(243,139,168,.7)",
    toastBg: "#CDD6F4",
    toastTx: "#1E1E2E",
  },
};

export const ACCENT = "#FF6B00";
export const ACCENT_SOFT = "#FF9A4D";
export const ACCENT_GRADIENT: [string, string] = [ACCENT, ACCENT_SOFT];

export const RADII = {
  sm: 12,
  md: 18,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const FONT_FAMILY = "Onest";
