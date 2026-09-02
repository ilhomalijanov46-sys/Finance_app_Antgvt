import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeMode } from '../../types';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, setTheme } = useTheme();
  const { user, updateUserPreferences } = useAuth();
  const { t } = useTranslation();

  const cycleTheme = async () => {
    const sequence: ThemeMode[] = ['light', 'dark', 'system'];
    const next = sequence[(sequence.indexOf(theme) + 1) % sequence.length];
    setTheme(next);
    if (!user) return;
    try {
      await updateUserPreferences({ theme: next });
    } catch (err) {
      // Applied locally either way; a failed write should not surface as a rejection.
      console.error('Failed to persist theme to profile:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      title={`${t('profile.theme')}: ${t(`profile.themes.${theme}`)}`}
      aria-label={`${t('profile.theme')}: ${t(`profile.themes.${theme}`)}`}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-800/80 backdrop-blur-md transition-colors ${className}`}
    >
      {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
      {theme === 'dark' && <Moon className="w-4 h-4 text-blue-400" />}
      {theme === 'system' && <Laptop className="w-4 h-4 text-slate-500 dark:text-zinc-400" />}
    </button>
  );
};
