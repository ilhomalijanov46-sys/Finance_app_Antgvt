import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ThemeMode } from '../types';
import { useAuth } from './AuthContext';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('pft_theme') as ThemeMode;
    return saved || 'system';
  });

  const [isDark, setIsDark] = useState<boolean>(false);

  // The account carries a theme preference, but nothing ever read it back — the choice
  // only lived in this browser's localStorage. Adopt it once per profile value so the
  // preference follows the user to another device without overriding a change they make
  // here afterwards.
  const { user } = useAuth();
  const adoptedProfileTheme = useRef<ThemeMode | null>(null);

  useEffect(() => {
    const profileTheme = user?.theme;
    if (!profileTheme || adoptedProfileTheme.current === profileTheme) return;
    adoptedProfileTheme.current = profileTheme;
    setThemeState(profileTheme);
    localStorage.setItem('pft_theme', profileTheme);
  }, [user?.theme]);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let activeIsDark = false;
      if (theme === 'system') {
        activeIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        activeIsDark = theme === 'dark';
      }

      setIsDark(activeIsDark);
      if (activeIsDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('pft_theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
