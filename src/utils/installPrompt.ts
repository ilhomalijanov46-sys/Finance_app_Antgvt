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

/** iOS has no install API at all, so the prompt there can only explain the manual steps. */
export const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ reports itself as a Mac; the touch points give it away.
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(ua) || iPadOS;
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
