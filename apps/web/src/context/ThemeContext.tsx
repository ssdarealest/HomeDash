import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export type ThemeMode = 'dark' | 'light';
export type SurfaceStyle = 'glass' | 'solid';

export interface ThemeContextType {
  theme: ThemeMode;
  surface: SurfaceStyle;
  toggleTheme: () => void;
  toggleSurface: () => void;
  setTheme: (theme: ThemeMode) => void;
  setSurface: (surface: SurfaceStyle) => void;
}

const THEME_STORAGE_KEY = 'homedash_theme';
const SURFACE_STORAGE_KEY = 'homedash_surface';

const ThemeContext = createContext<ThemeContextType | null>(null);

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Ignore storage error
  }
  return 'dark';
}

function getInitialSurface(): SurfaceStyle {
  if (typeof window === 'undefined') return 'glass';
  try {
    const saved = localStorage.getItem(SURFACE_STORAGE_KEY);
    if (saved === 'glass' || saved === 'solid') return saved;
  } catch {
    // Ignore storage error
  }
  return 'glass';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);
  const [surface, setSurfaceState] = useState<SurfaceStyle>(getInitialSurface);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage error
    }
  }, [theme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-surface', surface);
    try {
      localStorage.setItem(SURFACE_STORAGE_KEY, surface);
    } catch {
      // Ignore storage error
    }
  }, [surface]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const toggleSurface = useCallback(() => {
    setSurfaceState((prev) => (prev === 'glass' ? 'solid' : 'glass'));
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
  }, []);

  const setSurface = useCallback((newSurface: SurfaceStyle) => {
    setSurfaceState(newSurface);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      surface,
      toggleTheme,
      toggleSurface,
      setTheme,
      setSurface,
    }),
    [theme, surface, toggleTheme, toggleSurface, setTheme, setSurface]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
