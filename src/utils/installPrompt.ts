/** Chrome's install event, which the DOM lib still does not type. */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Chrome fires `beforeinstallprompt` as soon as the page qualifies — often before React
 * has mounted, and always before a component's effect gets to run. Listening for it from
 * inside the component therefore missed it outright on Android, which is why the card
 * only ever offered the manual instructions there. This module is imported during the
 * initial module graph evaluation, so the listener is in place before the first render.
 */
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const subscribers = new Set<(event: BeforeInstallPromptEvent) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Suppressing Chrome's own mini-infobar is what earns the right to replay it later.
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    subscribers.forEach((notify) => notify(deferredPrompt as BeforeInstallPromptEvent));
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
  });
}

export const getDeferredPrompt = (): BeforeInstallPromptEvent | null => deferredPrompt;

export const onDeferredPrompt = (callback: (event: BeforeInstallPromptEvent) => void): (() => void) => {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
};

export const clearDeferredPrompt = (): void => {
  deferredPrompt = null;
};

/** The platform decides what the card can honestly offer. */
export type InstallPlatform = 'chromium' | 'ios-safari' | 'ios-other' | 'android' | 'none';

/**
 * iOS has no install API — not only in Safari but in every browser on the platform, since
 * Apple requires them all to use WebKit. Chrome, Edge and Firefox on an iPhone can only
 * show the same manual steps, and they keep the share button in a different place, so the
 * instructions have to say which.
 */
export const detectPlatform = (params?: { userAgent?: string; canPrompt?: boolean }): InstallPlatform => {
  if (typeof navigator === 'undefined') return 'none';
  const ua = params?.userAgent ?? navigator.userAgent;
  const canPrompt = params?.canPrompt ?? Boolean(deferredPrompt);

  if (canPrompt) return 'chromium';

  const iPadOS = /Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || iPadOS) {
    // CriOS/FxiOS/EdgiOS are Chrome/Firefox/Edge wearing WebKit.
    return /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) ? 'ios-other' : 'ios-safari';
  }
  if (/Android/.test(ua)) return 'android';
  return 'none';
};

/** The commit this bundle was built from — injected by vite.config.ts. */
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';

const STORAGE_KEY = 'pft_install_prompt_dismissed';

/** Already launched from the home screen (or installed on desktop). */
export const isStandaloneDisplay = (): boolean => {
  if (typeof window === 'undefined') return false;
  // `navigator.standalone` is the iOS-only flag; every other platform reports the
  // display-mode media query instead.
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches;
};

export const readDismissedVersion = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const rememberDismissed = (version: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY, version);
  } catch {
    // Private mode or blocked storage: the prompt reappears next time, which is a far
    // better failure than the prompt logic throwing on a page load.
  }
};

/**
 * Whether to offer adding the app to the home screen.
 *
 * The dismissal is remembered *per build*, not forever: iOS bakes the icon, the name and
 * the standalone flag into the shortcut at the moment it is created, so a shortcut made
 * from an older build silently keeps the older icon and can even keep opening in Safari.
 * A new deployment is therefore a legitimate reason to ask once more.
 *
 * There is no way to ask the browser whether a shortcut already exists — only whether
 * *this* window is running as one. So a browser tab always counts as "not installed",
 * and the per-build dismissal is what keeps that from being annoying.
 */
export const shouldOfferInstall = (params: {
  standalone: boolean;
  dismissedVersion: string | null;
  currentVersion: string;
}): boolean => {
  if (params.standalone) return false;
  return params.dismissedVersion !== params.currentVersion;
};

/** Has this visitor dismissed an *earlier* build's prompt? Then this one is an update. */
export const isUpdatePrompt = (dismissedVersion: string | null, currentVersion: string): boolean =>
  dismissedVersion !== null && dismissedVersion !== currentVersion;
