import { useEffect, useState } from 'react';

/**
 * Subscribes to a CSS media query from React. Tailwind handles layout on its own, but the
 * chart library takes its sizes as numbers (axis width, tick font size, dot radius), and
 * those cannot be expressed as a breakpoint class — they have to be read here.
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);

    // The value can differ from the one the initial state guessed if the query changed
    // between render and effect (a rotated phone, a resized window).
    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, [query]);

  return matches;
};

/** Tailwind's `sm` breakpoint: true below 640px, i.e. on phones. */
export const useIsMobile = (): boolean => useMediaQuery('(max-width: 639px)');
