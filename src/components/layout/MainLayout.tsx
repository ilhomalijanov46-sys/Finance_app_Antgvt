import React, { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLoader } from '../common/PageLoader';
import { Button } from '../ui/Button';
import { useData } from '../../context/DataContext';
import { formatDbError } from '../../utils/dbErrors';

export const MainLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  // A failed load used to be indistinguishable from an empty account: every page rendered
  // its "nothing here yet" state over data that had simply never arrived.
  const { isLoading, loadError, isPaused, refetchAll } = useData();
  const dataUnavailable = Boolean(loadError) || isPaused;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#fbfbfd] dark:bg-[#000000] text-slate-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 w-72 h-full bg-white dark:bg-zinc-950 shadow-2xl"
            >
              <Sidebar onNavigate={() => setIsMobileMenuOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          isMobileMenuOpen={isMobileMenuOpen}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-6">
            {dataUnavailable && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                    {t('app.loadFailed')}
                  </p>
                  <p className="text-xs text-rose-600/90 dark:text-rose-400/90 mt-0.5 break-words">
                    {loadError ? formatDbError(loadError) : t('app.loadPaused')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="shrink-0"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={() => refetchAll()}
                >
                  {t('app.retry')}
                </Button>
              </div>
            )}

            {/* Route chunks load on demand; the shell stays put while they arrive */}
            <Suspense fallback={<PageLoader />}>
              {isLoading && !dataUnavailable ? <PageLoader /> : <Outlet />}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};
