import type * as React from 'react';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';
interface ThemeCtx { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void }
const Ctx = createContext<ThemeCtx | null>(null);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('kshira-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('kshira-theme', theme);
  }, [theme]);
  const value = useMemo(() => ({ theme, setTheme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }), [theme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useTheme() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useTheme must be used inside ThemeProvider');
  return c;
}

/** Hex colours for SVG charts, which cannot read CSS variables reliably. */
export function useChartColors() {
  const { theme } = useTheme();
  return theme === 'dark'
    ? { grid: '#342E5A', tick: '#A6A0C8', panel: '#18142E', ink: '#F0ECFF', brand: '#A78BFA', accent: '#F472B6', line: '#342E5A' }
    : { grid: '#E2DCF7', tick: '#6A648C', panel: '#FFFFFF', ink: '#1E183C', brand: '#7C3AED', accent: '#EC4899', line: '#E2DCF7' };
}
