import { useEffect } from 'react';

let locks = 0;
let restore: { overflow: string; paddingRight: string } | null = null;

/**
 * Stops the page behind a modal from scrolling, counted rather than per-component.
 *
 * Each overlay used to snapshot `document.body.style.overflow` on the way in and write it
 * back on the way out. That breaks as soon as two of them are open at once — the period
 * picker opens its own overlay from inside a Dialog — because the inner one snapshots the
 * outer one's `hidden` and restores *that* when it closes, leaving the page locked with
 * no modal on screen. Which reads, on a phone, as "scrolling just stopped working".
 */
export const useScrollLock = (active: boolean) => {
  useEffect(() => {
    if (!active) return;

    if (locks === 0) {
      // Compensating for the scrollbar keeps the page from shifting sideways as it locks.
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      restore = {
        overflow: document.body.style.overflow,
        paddingRight: document.body.style.paddingRight,
      };
      document.body.style.overflow = 'hidden';
      if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    }
    locks += 1;

    return () => {
      locks -= 1;
      if (locks === 0 && restore) {
        document.body.style.overflow = restore.overflow;
        document.body.style.paddingRight = restore.paddingRight;
        restore = null;
      }
    };
  }, [active]);
};
