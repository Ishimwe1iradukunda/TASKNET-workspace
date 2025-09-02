import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "tasknet_theme";
const DEFAULT_MODE: ThemeMode = "system";

function applyMode(mode: ThemeMode) {
  const root = document.documentElement;
  const systemPrefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  const effectiveDark = mode === "system" ? systemPrefersDark : mode === "dark";
  root.classList.toggle("dark", effectiveDark);
}

function loadTheme(): { mode: ThemeMode } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { mode: DEFAULT_MODE };
    const parsed = JSON.parse(raw) as { mode?: ThemeMode };
    return {
      mode: parsed.mode ?? DEFAULT_MODE,
    };
  } catch {
    return { mode: DEFAULT_MODE };
  }
}

function saveTheme(mode: ThemeMode) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode }));
  } catch {
    // ignore
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(DEFAULT_MODE);

  useEffect(() => {
    const { mode: m } = loadTheme();
    setMode(m);
  }, []);

  useEffect(() => {
    applyMode(mode);
    const onChange = () => {
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
    saveTheme(mode);
  }, [mode]);

  const value = useMemo(
    () => ({ mode, setMode }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
