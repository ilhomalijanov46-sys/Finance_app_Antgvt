import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Share, SquarePlus, Sparkles } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { Button } from '../ui/Button';
import {
  APP_VERSION,
  isIOS,
  isStandaloneDisplay,
  isUpdatePrompt,
  readDismissedVersion,
  rememberDismissed,
  shouldOfferInstall,
} from '../../utils/installPrompt';

/** Chrome's install event, which the DOM lib still does not type. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Long enough that the card arrives after the page has settled, short enough that it is
// clearly a response to opening the app rather than a random interruption.
const APPEAR_DELAY_MS = 1500;

/**
 * Offers to put the app on the home screen when it is being viewed in a browser tab.
 *
 * The platforms differ in what is even possible:
 *  - Chrome (Android, desktop) fires `beforeinstallprompt`, which can be saved and
 *    replayed on a tap — that opens the browser's own install dialog, so one tap really
 *    does install it.
 *  - iOS has no such API and never has: Safari only adds a shortcut through its own share
 *    sheet. Nothing a page does can trigger it, so the card shows the three steps instead
 *    of pretending a button can do it.
 * Anywhere else (Firefox, desktop Safari) nothing useful can happen, so nothing is shown.
 */
export const InstallPrompt: React.FC = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isUpdate, setIsUpdate] = useState(false);

  const ios = isIOS();

  const dismiss = useCallback(() => {
    rememberDismissed(APP_VERSION);
    setVisible(false);
  }, []);

  useEffect(() => {
    // Re-read the dismissal at the moment of showing rather than trusting the check made
    // when this effect ran: Chrome can fire `beforeinstallprompt` again later in the same
    // session, and without this the card came back after the visitor had waved it away.
    const offerNow = () =>
      shouldOfferInstall({
        standalone: isStandaloneDisplay(),
        dismissedVersion: readDismissedVersion(),
        currentVersion: APP_VERSION,
      });

    if (!offerNow()) return;

    setIsUpdate(isUpdatePrompt(readDismissedVersion(), APP_VERSION));

    const onBeforeInstall = (e: Event) => {
      // Suppressing Chrome's own mini-infobar is what earns the right to replay it later.
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      if (offerNow()) setVisible(true);
    };
    // Added from the home screen while the tab is still open, or installed in Chrome.
    const onInstalled = () => dismiss();

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    // iOS never fires the event, so the card is shown on a timer instead.
    const timer = ios
      ? window.setTimeout(() => {
          if (offerNow()) setVisible(true);
        }, APPEAR_DELAY_MS)
      : undefined;

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      if (timer) window.clearTimeout(timer);
    };
  }, [ios, dismiss]);

  const handleAdd = async () => {
    if (installEvent) {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      setInstallEvent(null);
      // "dismissed" means they closed the browser's dialog: don't nag again on this build.
      if (outcome === 'accepted' || outcome === 'dismissed') dismiss();
      return;
    }
    // iOS: all this button can honestly do is show where the share sheet is.
    setShowSteps(true);
  };

  const steps = [
    { icon: <Share className="w-4 h-4" />, text: t('install.iosStep1') },
    { icon: <SquarePlus className="w-4 h-4" />, text: t('install.iosStep2') },
    { icon: <Sparkles className="w-4 h-4" />, text: t('install.iosStep3') },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          role="dialog"
          aria-label={t('install.title')}
          className="fixed inset-x-3 bottom-3 z-[200] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[360px] pb-safe"
        >
          <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-2xl p-4">
            <div className="flex items-start gap-3">
              <AppLogo size={56} className="w-12 h-12" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  {isUpdate ? t('install.updatedTitle') : t('install.title')}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {isUpdate ? t('install.updatedDescription') : t('install.description')}
                </p>
              </div>
              <button
                type="button"
                onClick={dismiss}
                aria-label={t('common.close')}
                className="p-2 -m-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <AnimatePresence initial={false}>
              {showSteps && (
                <motion.ol
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-2 overflow-hidden"
                >
                  {steps.map((step, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-zinc-300">
                      <span className="w-7 h-7 shrink-0 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        {step.icon}
                      </span>
                      <span>{step.text}</span>
                    </li>
                  ))}
                </motion.ol>
              )}
            </AnimatePresence>

            <div className="mt-3 flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={handleAdd} className="flex-1">
                {installEvent ? t('install.add') : t('install.howTo')}
              </Button>
              <Button variant="ghost" size="sm" onClick={dismiss}>
                {t('install.later')}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
