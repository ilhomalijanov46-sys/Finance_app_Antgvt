import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  /** Fill the viewport instead of just the content area (used before the shell renders) */
  fullscreen?: boolean;
  showLabel?: boolean;
}

// Shown while a route's chunk is being fetched, and while the session is being restored.
export const PageLoader: React.FC<PageLoaderProps> = ({ fullscreen = false, showLabel = true }) => {
  const { t } = useTranslation();

  return (
    <div
      className={
        fullscreen
          ? 'h-screen w-screen flex flex-col items-center justify-center bg-[#fbfbfd] dark:bg-[#000000] text-slate-900 dark:text-zinc-100'
          : 'flex flex-col items-center justify-center py-24 text-slate-900 dark:text-zinc-100'
      }
    >
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
      {showLabel && <p className="text-xs font-medium text-slate-400">{t('app.loading')}</p>}
    </div>
  );
};
