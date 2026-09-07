import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Share, SquarePlus, MoreVertical, Download, Sparkles } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { Button } from '../ui/Button';
import {
  APP_VERSION,
  BeforeInstallPromptEvent,
  clearDeferredPrompt,
  detectPlatform,
  getDeferredPrompt,
  isStandaloneDisplay,
  isUpdatePrompt,
  onDeferredPrompt,
  readDismissedVersion,
  rememberDismissed,
  shouldOfferInstall,
} from '../../utils/installPrompt';

// Long enough that the card arrives after the page has settled, short enough that it is
// clearly a response to opening the app rather than a random interruption.
const APPEAR_DELAY_MS = 1500;

/**
 * Offers to put the app on the home screen when it is being viewed in a browser tab.
 *
 * What is actually possible differs per platform, and the card says only what is true for
 * the one it is on:
 *  - Chrome (Android, desktop) fires `beforeinstallprompt`; replaying it on a tap opens
 *    the browser's own install dialog, so one tap really does install the app.
 *  - iOS has no install API in *any* browser — Apple requires them all to use WebKit, so
 *    Chrome and Firefox on an iPhone are as unable to do it as Safari. All they can do is
 *    point at the share sheet, which sits in a different place in each of them.
 *  - Android Chrome that never fired the event (already installed, or criteria not met)
 *    falls back to the menu instructions.
 */
export const InstallPrompt: React.FC = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(getDeferredPrompt);
  const [isUpdate, setIsUpdate] = useState(false);

  const platform = useMemo(() => detectPlatform({ canPrompt: Boolean(installEvent) }), [installEvent]);

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

    // The event may have arrived before this component existed — that is the whole point
    // of capturing it at module level.
    if (getDeferredPrompt()) {
      setInstallEvent(getDeferredPrompt());
      setVisible(true);
    }

    const unsubscribe = onDeferredPrompt((event) => {
      setInstallEvent(event);
      if (offerNow()) setVisible(true);
    });

    const onInstalled = () => dismiss();
    window.addEventListener('appinstalled', onInstalled);

    // Nothing will fire on a phone browser that cannot install: show the manual steps.
    const manual = detectPlatform({ canPrompt: false });
    const timer =
      manual === 'ios-safari' || manual === 'ios-other' || manual === 'android'
        ? window.setTimeout(() => {
            if (offerNow()) setVisible(true);
          }, APPEAR_DELAY_MS)
        : undefined;

    return () => {
      unsubscribe();
      window.removeEventListener('appinstalled', onInstalled);
      if (timer) window.clearTimeout(timer);
    };
  }, [dismiss]);

  const handleAdd = async () => {
    if (installEvent) {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      clearDeferredPrompt();
      setInstallEvent(null);
      // "dismissed" means they closed the browser's dialog: don't nag again on this build.
      if (outcome === 'accepted' || outcome === 'dismissed') dismiss();
      return;
    }
    // Everywhere else all this button can honestly do is show where the share sheet is.
    setShowSteps(true);
  };

  const steps: Array<{ icon: React.ReactNode; text: string }> =
    platform === 'android'
      ? [
          { icon: <MoreVertical className="w-4 h-4" />, text: t('install.androidStep1') },
          { icon: <Download className="w-4 h-4" />, text: t('install.androidStep2') },
        ]
      : [
          {
            icon: <Share className="w-4 h-4" />,
            text: platform === 'ios-other' ? t('install.iosOtherStep1') : t('install.iosStep1'),
          },
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
