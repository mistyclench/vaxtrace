"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export const FONTS = [
  { label: "System Default", value: "system-ui, -apple-system, sans-serif" },
  { label: "Inter",          value: "'Inter', sans-serif" },
  { label: "Roboto",         value: "'Roboto', sans-serif" },
  { label: "Open Sans",      value: "'Open Sans', sans-serif" },
  { label: "Montserrat",     value: "'Montserrat', sans-serif" },
  { label: "Georgia (Serif)",value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono",           value: "'JetBrains Mono', 'Fira Code', monospace" },
];

export const FONT_SIZES = [
  { label: "Small (12px)",   value: "12px" },
  { label: "Default (14px)", value: "14px" },
  { label: "Medium (15px)",  value: "15px" },
  { label: "Large (16px)",   value: "16px" },
];

export const FONT_WEIGHTS = [
  { label: "Light (300)",    value: "300" },
  { label: "Normal (400)",   value: "400" },
  { label: "Medium (500)",   value: "500" },
  { label: "Semibold (600)", value: "600" },
];

interface ThemeConfig {
  theme: "light" | "dark";
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
}

interface ThemeContextValue extends ThemeConfig {
  toggle: () => void;
}

const defaults: ThemeConfig = {
  theme: "light",
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontSize: "14px",
  fontWeight: "400",
};

const ThemeContext = createContext<ThemeContextValue>({
  ...defaults,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(defaults);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then((s: Record<string, string>) => {
        const next: ThemeConfig = {
          theme:      (s.app_theme as "light" | "dark") ?? "light",
          fontFamily: s.app_font_family ?? defaults.fontFamily,
          fontSize:   s.app_font_size   ?? defaults.fontSize,
          fontWeight: s.app_font_weight ?? defaults.fontWeight,
        };
        setConfig(next);
        applyToDOM(next);
      })
      .catch(() => {});
  }, []);

  function applyToDOM(c: ThemeConfig) {
    const html = document.documentElement;
    if (c.theme === "dark") html.classList.add("dark");
    else html.classList.remove("dark");
    html.style.setProperty("--app-font",        c.fontFamily);
    html.style.setProperty("--app-font-size",   c.fontSize);
    html.style.setProperty("--app-font-weight", c.fontWeight);
  }

  function toggle() {
    const next: ThemeConfig = {
      ...config,
      theme: config.theme === "dark" ? "light" : "dark",
    };
    setConfig(next);
    applyToDOM(next);
    // Persist
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_theme: next.theme }),
    }).catch(() => {});
  }

  return (
    <ThemeContext.Provider value={{ ...config, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
