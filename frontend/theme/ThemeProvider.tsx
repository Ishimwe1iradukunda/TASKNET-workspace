import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark" | "system";
export type Accent =
  | "blue"
  | "violet"
  | "rose"
  | "teal"
  | "amber"
  | "emerald"
  | "pink";

interface ThemeContextValue {
  mode: ThemeMode;
  accent: Accent;
  setMode: (m: ThemeMode) => void;
  setAccent: (a: Accent) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "tasknet_theme";
const DEFAULT_MODE: ThemeMode = "system";
const DEFAULT_ACCENT: Accent = "violet";

// HSL triplets (without hsl()) since shadcn uses hsl(var(--primary))
const ACCENTS: Record<Accent, { primary: string; foreground: string; ring: string }> = {
  blue: { primary: "221 83% 53%", foreground: "210 40% 98%", ring: "221 83% 53%" },
  violet: { primary: "262 83% 58%", foreground: "210 40% 98%", ring: "262 83% 58%" },
  rose: { primary: "346 77% 57%", foreground: "210 40% 98%", ring: "346 77% 57%" },
  teal: { primary: "173 80% 40%", foreground: "210 40% 98%", ring: "173 80% 40%" },
  amber: { primary: "38 92% 50%", foreground: "26 83% 14%", ring: "38 92% 50%" },
  emerald: { primary: "160 84% 39%", foreground: "154 75% 93%", ring: "160 84% 39%" },
  pink: { primary: "330 81% 60%", foreground: "210 40% 98%", ring: "330 81% 60%" },
};

function applyMode(mode: ThemeMode) {
  const root = document.documentElement;
  const systemPrefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  const effectiveDark = mode === "system" ? systemPrefersDark : mode === "dark";
  root.classList.toggle("dark", effectiveDark);
}

function applyAccent(accent: Accent) {
  const root = document.documentElement;
  const palette = ACCENTS[accent];
  root.style.setProperty("--primary", palette.primary);
  root.style.setProperty("--primary-foreground", palette.foreground);
  root.style.setProperty("--ring", palette.ring);
}

function loadTheme(): { mode: ThemeMode; accent: Accent } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { mode: DEFAULT_MODE, accent: DEFAULT_ACCENT };
    const parsed = JSON.parse(raw) as { mode?: ThemeMode; accent?: Accent };
    return {
      mode: parsed.mode ?? DEFAULT_MODE,
      accent: parsed.accent ?? DEFAULT_ACCENT,
    };
  } catch {
    return { mode: DEFAULT_MODE, accent: DEFAULT_ACCENT };
  }
}

function saveTheme(mode: ThemeMode, accent: Accent) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, accent }));
  } catch {
    // ignore
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(DEFAULT_MODE);
  const [accent, setAccent] = useState<Accent>(DEFAULT_ACCENT);

  useEffect(() => {
    const { mode: m, accent: a } = loadTheme();
    setMode(m);
    setAccent(a);
  }, []);

  useEffect(() => {
    applyMode(mode);
    const onChange = (e: MediaQueryListEvent) => {
      if (mode === "system") {
        applyMode("system");
      }
    };
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener?.("change", onChange);
    return () => {
      mq?.removeEventListener?.("change", onChange);
    };
  }, [mode]);

  useEffect(() => {
    applyAccent(accent);
  }, [accent]);

  useEffect(() => {
    saveTheme(mode, accent);
  }, [mode, accent]);

  const value = useMemo(
    () => ({ mode, accent, setMode, setAccent }),
    [mode, accent]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
